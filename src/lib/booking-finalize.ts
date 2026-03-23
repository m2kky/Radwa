import { createAdminClient } from '@/lib/supabase/server'
import { createGoogleCalendarEvent, extractAttendees } from '@/lib/google-calendar'
import {
  sendBookingAdminNotificationEmail,
  sendBookingConfirmationEmail,
} from '@/lib/email'

interface EventTypeLite {
  title: string
  slug: string
  price: number
  email_reminder_hours: number | null
  communication_methods: unknown
  locked_timezone: string | null
}

interface BookingRow {
  id: string
  booking_date: string
  start_time: string
  end_time: string
  client_name: string
  client_email: string
  client_phone: string | null
  guests: string | null
  notes: string | null
  payment_status: 'pending' | 'paid' | 'cancelled' | string
  meeting_link: string | null
  custom_answers: Record<string, unknown> | null
  event_types: EventTypeLite | EventTypeLite[] | null
}

function toHHMM(time: string): string {
  return time.slice(0, 5)
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseCommunicationMethods(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean)
  }
  if (typeof value === 'string' && value.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => String(item).trim())
          .filter(Boolean)
      }
    } catch {
      return []
    }
  }
  return []
}

export async function finalizeBookingPayment(
  bookingId: string,
  options?: { gatewayTxnId?: string | null; amount?: number | null; forcePaid?: boolean }
) {
  const admin = createAdminClient()
  const { data: row, error } = await admin
    .from('bookings')
    .select(`
      id,
      booking_date,
      start_time,
      end_time,
      client_name,
      client_email,
      client_phone,
      guests,
      notes,
      payment_status,
      meeting_link,
      custom_answers,
      event_types(title, slug, price, email_reminder_hours, communication_methods, locked_timezone)
    `)
    .eq('id', bookingId)
    .maybeSingle()

  if (error || !row) {
    console.error('[booking-finalize] booking not found', bookingId, error)
    return { ok: false as const, reason: 'not_found' }
  }

  const booking = row as BookingRow
  const eventType = Array.isArray(booking.event_types)
    ? booking.event_types[0] ?? null
    : booking.event_types
  if (!eventType) {
    return { ok: false as const, reason: 'missing_event_type' }
  }

  const existingAnswers = isObject(booking.custom_answers) ? booking.custom_answers : {}
  const alreadyFinalizedAt = typeof existingAnswers._sys_finalized_at === 'string'
    ? existingAnswers._sys_finalized_at
    : null

  if (alreadyFinalizedAt && booking.payment_status === 'paid') {
    return {
      ok: true as const,
      alreadyFinalized: true,
      slug: eventType.slug,
      meetingLink: booking.meeting_link,
    }
  }

  const methods = parseCommunicationMethods(eventType.communication_methods)
  const useMeet = methods.includes('google_meet')
  const timezone = eventType.locked_timezone || 'Africa/Cairo'
  const attendees = extractAttendees(booking.client_email, booking.client_name, booking.guests)

  const startHHMM = toHHMM(booking.start_time)
  const endHHMM = toHHMM(booking.end_time)
  const description = [
    `العميل: ${booking.client_name}`,
    `الإيميل: ${booking.client_email}`,
    booking.client_phone ? `الموبايل: ${booking.client_phone}` : null,
    booking.notes ? `ملاحظات: ${booking.notes}` : null,
  ]
    .filter(Boolean)
    .join('\n')

  const calendarEvent = await createGoogleCalendarEvent({
    summary: eventType.title,
    description,
    startDate: booking.booking_date,
    startTime: `${startHHMM}:00`,
    endTime: `${endHHMM}:00`,
    timezone,
    attendees,
    createMeetLink: useMeet,
    requestId: `booking-${booking.id}-${Date.now()}`,
    reminderHours: eventType.email_reminder_hours,
  })

  const meetingLink =
    calendarEvent?.meetLink ||
    calendarEvent?.htmlLink ||
    booking.meeting_link ||
    'سيتم إرسال الرابط عبر البريد'

  const nowIso = new Date().toISOString()
  const mergedAnswers: Record<string, unknown> = {
    ...existingAnswers,
    _sys_finalized_at: nowIso,
    _sys_gateway_txn_id: options?.gatewayTxnId ?? existingAnswers._sys_gateway_txn_id ?? null,
    _sys_google_event_id: calendarEvent?.eventId ?? existingAnswers._sys_google_event_id ?? null,
    _sys_google_event_link: calendarEvent?.htmlLink ?? existingAnswers._sys_google_event_link ?? null,
  }

  const nextStatus =
    options?.forcePaid || booking.payment_status === 'paid' ? 'paid' : 'paid'

  const { error: updateError } = await admin
    .from('bookings')
    .update({
      payment_status: nextStatus,
      meeting_link: meetingLink,
      custom_answers: mergedAnswers,
      updated_at: nowIso,
    })
    .eq('id', booking.id)

  if (updateError) {
    console.error('[booking-finalize] update failed', updateError)
    return { ok: false as const, reason: 'update_failed' }
  }

  try {
    await sendBookingConfirmationEmail({
      to: booking.client_email,
      clientName: booking.client_name,
      eventTitle: eventType.title,
      bookingDate: booking.booking_date,
      startTime: startHHMM,
      endTime: endHHMM,
      meetingLink,
      amount: options?.amount ?? eventType.price ?? 0,
      isPaid: true,
    })

    await sendBookingAdminNotificationEmail({
      clientName: booking.client_name,
      clientEmail: booking.client_email,
      clientPhone: booking.client_phone,
      eventTitle: eventType.title,
      bookingDate: booking.booking_date,
      startTime: startHHMM,
      endTime: endHHMM,
      meetingLink,
      amount: options?.amount ?? eventType.price ?? 0,
    })
  } catch (emailError) {
    console.error('[booking-finalize] email failed', emailError)
  }

  return {
    ok: true as const,
    alreadyFinalized: false,
    slug: eventType.slug,
    meetingLink,
  }
}
