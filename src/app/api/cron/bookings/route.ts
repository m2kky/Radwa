import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendBookingFollowupEmail, sendBookingReminderEmail } from '@/lib/email'

interface BookingCronRow {
  id: string
  booking_date: string
  start_time: string
  end_time: string
  client_name: string
  client_email: string
  meeting_link: string | null
  custom_answers: Record<string, unknown> | null
  event_types:
    | {
        title: string
        email_reminder_hours: number | null
        email_followup_hours: number | null
      }
    | Array<{
        title: string
        email_reminder_hours: number | null
        email_followup_hours: number | null
      }>
    | null
}

function assertCronAuth(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false

  const bearer = req.headers.get('authorization')
  if (bearer === `Bearer ${secret}`) return true

  const querySecret = req.nextUrl.searchParams.get('secret')
  if (querySecret === secret) return true

  return false
}

function toDateTime(date: string, time: string): Date {
  return new Date(`${date}T${time.slice(0, 5)}:00`)
}

function toHours(value: number | null | undefined, fallback: number): number {
  if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) return fallback
  return value
}

function toObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return {}
}

export async function GET(req: NextRequest) {
  if (!assertCronAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const now = new Date()
  const minDate = new Date(now)
  minDate.setDate(minDate.getDate() - 7)
  const minDateString = minDate.toISOString().slice(0, 10)

  const { data, error } = await admin
    .from('bookings')
    .select('id, booking_date, start_time, end_time, client_name, client_email, meeting_link, custom_answers, event_types(title, email_reminder_hours, email_followup_hours)')
    .eq('payment_status', 'paid')
    .gte('booking_date', minDateString)

  if (error) {
    console.error('[cron/bookings] fetch failed', error)
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })
  }

  let remindersSent = 0
  let followupsSent = 0

  for (const row of (data ?? []) as BookingCronRow[]) {
    const eventType = Array.isArray(row.event_types) ? row.event_types[0] : row.event_types
    if (!eventType) continue

    const answers = toObject(row.custom_answers)
    const reminderAlreadySent = typeof answers._sys_email_reminder_sent_at === 'string'
    const followupAlreadySent = typeof answers._sys_email_followup_sent_at === 'string'

    const startAt = toDateTime(row.booking_date, row.start_time)
    const endAt = toDateTime(row.booking_date, row.end_time)
    const reminderHours = toHours(eventType.email_reminder_hours, 24)
    const followupHours = toHours(eventType.email_followup_hours, 24)
    const reminderAt = new Date(startAt.getTime() - reminderHours * 60 * 60 * 1000)
    const followupAt = new Date(endAt.getTime() + followupHours * 60 * 60 * 1000)

    let needsUpdate = false
    const nextAnswers: Record<string, unknown> = { ...answers }

    if (!reminderAlreadySent && now >= reminderAt && now <= startAt) {
      try {
        await sendBookingReminderEmail({
          to: row.client_email,
          clientName: row.client_name,
          eventTitle: eventType.title,
          bookingDate: row.booking_date,
          startTime: row.start_time.slice(0, 5),
          endTime: row.end_time.slice(0, 5),
          meetingLink: row.meeting_link,
        })
        nextAnswers._sys_email_reminder_sent_at = now.toISOString()
        remindersSent += 1
        needsUpdate = true
      } catch (err) {
        console.error('[cron/bookings] reminder failed', row.id, err)
      }
    }

    if (!followupAlreadySent && now >= followupAt) {
      try {
        await sendBookingFollowupEmail({
          to: row.client_email,
          clientName: row.client_name,
          eventTitle: eventType.title,
        })
        nextAnswers._sys_email_followup_sent_at = now.toISOString()
        followupsSent += 1
        needsUpdate = true
      } catch (err) {
        console.error('[cron/bookings] followup failed', row.id, err)
      }
    }

    if (needsUpdate) {
      await admin
        .from('bookings')
        .update({ custom_answers: nextAnswers, updated_at: now.toISOString() })
        .eq('id', row.id)
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      reminders_sent: remindersSent,
      followups_sent: followupsSent,
      processed: (data ?? []).length,
    },
  })
}
