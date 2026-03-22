'use server'

import { createAdminClient } from '@/lib/supabase/server'
import {
  sendBookingAdminNotificationEmail,
  sendBookingConfirmationEmail,
} from '@/lib/email'

type SlotSegment = { start_time: string; end_time: string }
type OverrideSlot = { start: string; end: string }

function toHHMM(value: string): string {
  return value.slice(0, 5)
}

function toMinutes(value: string): number {
  const [h, m] = toHHMM(value).split(':').map(Number)
  return h * 60 + m
}

function fromMinutes(value: number): string {
  const h = Math.floor(value / 60)
  const m = value % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function parseOverrideSlots(raw: unknown): OverrideSlot[] {
  if (Array.isArray(raw)) return raw as OverrideSlot[]
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? (parsed as OverrideSlot[]) : []
    } catch {
      return []
    }
  }
  return []
}

export async function getAvailableSlots(
  dateStr: string,
  durationMinutes: number,
  eventTypeId?: string
): Promise<string[]> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr) || durationMinutes <= 0) return []

  const admin = createAdminClient()
  const date = new Date(`${dateStr}T00:00:00`)
  if (Number.isNaN(date.getTime())) return []
  const dayOfWeek = date.getDay()

  let bufferBefore = 0
  let bufferAfter = 0
  let maxPerDay: number | null = null
  let increment = 30
  let minNoticeHours = 0

  if (eventTypeId) {
    const { data: eventType } = await admin
      .from('event_types')
      .select('buffer_before, buffer_after, max_per_day, start_time_increment, min_notice_hours')
      .eq('id', eventTypeId)
      .maybeSingle()

    if (eventType) {
      bufferBefore = eventType.buffer_before ?? 0
      bufferAfter = eventType.buffer_after ?? 0
      maxPerDay = eventType.max_per_day ?? null
      increment = eventType.start_time_increment ?? 30
      minNoticeHours = eventType.min_notice_hours ?? 0
    }
  }

  const { data: overrideRow } = await admin
    .from('availability_overrides')
    .select('slots')
    .eq('date', dateStr)
    .maybeSingle()

  let segments: SlotSegment[] = []
  if (overrideRow) {
    const overrideSlots = parseOverrideSlots(overrideRow.slots)
    if (overrideSlots.length === 0) return []
    segments = overrideSlots
      .filter((slot) => slot?.start && slot?.end)
      .map((slot) => ({ start_time: toHHMM(slot.start), end_time: toHHMM(slot.end) }))
  } else {
    const { data: availabilityRows } = await admin
      .from('availability')
      .select('start_time, end_time')
      .eq('day_of_week', dayOfWeek)
      .order('start_time', { ascending: true })

    if (!availabilityRows || availabilityRows.length === 0) return []
    segments = availabilityRows.map((row) => ({
      start_time: row.start_time,
      end_time: row.end_time,
    }))
  }

  const now = new Date()
  const minNoticeDate = new Date(now.getTime() + minNoticeHours * 60 * 60 * 1000)
  const minNoticeMinutes = toMinutes(`${minNoticeDate.getHours()}:${minNoticeDate.getMinutes()}`)
  const isToday = date.toDateString() === now.toDateString()

  const slotSet = new Set<string>()
  for (const segment of segments) {
    const startMinutes = toMinutes(segment.start_time)
    const endMinutes = toMinutes(segment.end_time)
    for (let cursor = startMinutes; cursor + durationMinutes <= endMinutes; cursor += increment) {
      if (isToday && cursor <= minNoticeMinutes) continue
      slotSet.add(fromMinutes(cursor))
    }
  }

  let slots = Array.from(slotSet).sort()

  const { data: bookings } = await admin
    .from('bookings')
    .select('start_time, end_time, event_type_id')
    .eq('booking_date', dateStr)

  if (!bookings || bookings.length === 0) return slots

  if (maxPerDay !== null) {
    const totalByType = eventTypeId
      ? bookings.filter((row) => row.event_type_id === eventTypeId).length
      : bookings.length
    if (totalByType >= maxPerDay) return []
  }

  slots = slots.filter((slot) => {
    const slotStart = toMinutes(slot) - bufferBefore
    const slotEnd = toMinutes(slot) + durationMinutes + bufferAfter

    for (const booking of bookings) {
      const bookingStart = toMinutes(booking.start_time)
      const bookingEnd = toMinutes(booking.end_time)
      const overlap = slotStart < bookingEnd && slotEnd > bookingStart
      if (overlap) return false
    }

    return true
  })

  return slots
}

export async function submitBooking(formData: FormData) {
  const eventTypeId = String(formData.get('event_type_id') ?? '')
  const bookingDate = String(formData.get('date') ?? '')
  const startTime = toHHMM(String(formData.get('time') ?? ''))
  const durationMinutes = Number.parseInt(String(formData.get('duration_minutes') ?? '30'), 10)

  const firstName = String(formData.get('first_name') ?? '').trim()
  const lastName = String(formData.get('last_name') ?? '').trim()
  const fallbackName = [firstName, lastName].filter(Boolean).join(' ')
  const clientName = String(formData.get('name') ?? '').trim() || fallbackName
  const clientEmail = String(formData.get('email') ?? '').trim().toLowerCase()
  const clientPhone = String(formData.get('phone') ?? '').trim() || null
  const guests = String(formData.get('guests') ?? '').trim() || null
  const communicationMethod = String(formData.get('communication_method') ?? '').trim() || null
  const notes = String(formData.get('notes') ?? '').trim()

  if (!eventTypeId || !bookingDate || !startTime || !clientName || !clientEmail || !durationMinutes) {
    return { error: 'البيانات غير مكتملة. من فضلك راجع البيانات ثم أعد المحاولة.' }
  }

  const availableSlots = await getAvailableSlots(bookingDate, durationMinutes, eventTypeId)
  if (!availableSlots.includes(startTime)) {
    return { error: 'الميعاد المختار غير متاح الآن. اختر وقتًا آخر.' }
  }

  const startMinutes = toMinutes(startTime)
  const endTime = fromMinutes(startMinutes + durationMinutes)

  const answers: Record<string, string> = {}
  if (notes) answers.notes = notes
  for (const [key, value] of formData.entries()) {
    if (key.startsWith('question_')) answers[key] = String(value)
  }

  const admin = createAdminClient()
  const { data: eventType } = await admin
    .from('event_types')
    .select('title, confirmation_redirect')
    .eq('id', eventTypeId)
    .maybeSingle()

  const { error } = await admin
    .from('bookings')
    .insert({
      event_type_id: eventTypeId,
      booking_date: bookingDate,
      start_time: `${startTime}:00`,
      end_time: `${endTime}:00`,
      client_name: clientName,
      client_email: clientEmail,
      client_phone: clientPhone,
      guests,
      communication_method: communicationMethod,
      notes: notes || null,
      custom_answers: answers,
      payment_status: 'pending',
      meeting_link: 'سيتم إرسال الرابط عبر البريد',
    })

  if (error) {
    if (error.code === '23505') {
      return { error: 'هذا الوقت تم حجزه منذ لحظات. اختر وقتًا مختلفًا.' }
    }
    console.error('[bookings] insert failed:', error)
    return { error: 'تعذر تأكيد الحجز الآن. حاول مرة أخرى.' }
  }

  try {
    const title = eventType?.title || 'جلسة استشارية'
    await sendBookingConfirmationEmail({
      to: clientEmail,
      clientName,
      eventTitle: title,
      bookingDate,
      startTime,
      endTime,
    })
    await sendBookingAdminNotificationEmail({
      clientName,
      clientEmail,
      clientPhone,
      eventTitle: title,
      bookingDate,
      startTime,
      endTime,
    })
  } catch (emailError) {
    console.error('[bookings] confirmation email failed:', emailError)
  }

  return {
    success: true,
    redirect: eventType?.confirmation_redirect || null,
  }
}
