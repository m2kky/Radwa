interface BookingCalendarEventInput {
  summary: string
  description?: string
  startDate: string
  startTime: string
  endTime: string
  timezone?: string
  attendees?: Array<{ email: string; displayName?: string }>
  createMeetLink?: boolean
  requestId: string
  reminderHours?: number | null
}

interface CalendarEventOutput {
  eventId: string | null
  htmlLink: string | null
  meetLink: string | null
}

function hasCalendarConfig(): boolean {
  return Boolean(
    process.env.GOOGLE_CALENDAR_CLIENT_ID &&
      process.env.GOOGLE_CALENDAR_CLIENT_SECRET &&
      process.env.GOOGLE_CALENDAR_REFRESH_TOKEN
  )
}

async function getGoogleAccessToken(): Promise<string | null> {
  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET
  const refreshToken = process.env.GOOGLE_CALENDAR_REFRESH_TOKEN

  if (!clientId || !clientSecret || !refreshToken) return null

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  const tokenJson = await tokenRes.json().catch(() => null)
  if (!tokenRes.ok || !tokenJson?.access_token) {
    console.error('[google-calendar] access token fetch failed', tokenJson)
    return null
  }

  return tokenJson.access_token as string
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase()
}

function parseGuestEmails(rawGuests: string | null | undefined): string[] {
  if (!rawGuests) return []
  return rawGuests
    .split(',')
    .map((email) => normalizeEmail(email))
    .filter((email) => email.length > 3 && email.includes('@'))
}

export async function createGoogleCalendarEvent(
  input: BookingCalendarEventInput
): Promise<CalendarEventOutput | null> {
  if (!hasCalendarConfig()) return null

  const accessToken = await getGoogleAccessToken()
  if (!accessToken) return null

  const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary'
  const timezone = input.timezone || process.env.GOOGLE_CALENDAR_TIMEZONE || 'Africa/Cairo'
  const sendUpdates = process.env.GOOGLE_CALENDAR_SEND_UPDATES || 'all'

  const uniqueAttendees = new Map<string, { email: string; displayName?: string }>()
  for (const attendee of input.attendees ?? []) {
    const normalized = normalizeEmail(attendee.email)
    if (!normalized) continue
    uniqueAttendees.set(normalized, { email: normalized, displayName: attendee.displayName })
  }

  const reminderMinutes = input.reminderHours && input.reminderHours > 0
    ? input.reminderHours * 60
    : null

  const body: Record<string, unknown> = {
    summary: input.summary,
    description: input.description || '',
    start: {
      dateTime: `${input.startDate}T${input.startTime}`,
      timeZone: timezone,
    },
    end: {
      dateTime: `${input.startDate}T${input.endTime}`,
      timeZone: timezone,
    },
    attendees: Array.from(uniqueAttendees.values()),
  }

  if (reminderMinutes) {
    body.reminders = {
      useDefault: false,
      overrides: [{ method: 'email', minutes: reminderMinutes }],
    }
  }

  if (input.createMeetLink) {
    body.conferenceData = {
      createRequest: {
        requestId: input.requestId,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    }
  }

  const encodedCalendarId = encodeURIComponent(calendarId)
  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodedCalendarId}/events?conferenceDataVersion=1&sendUpdates=${encodeURIComponent(sendUpdates)}`
  const eventRes = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const eventJson = await eventRes.json().catch(() => null)
  if (!eventRes.ok) {
    console.error('[google-calendar] create event failed', eventJson)
    return null
  }

  const meetLink =
    eventJson?.hangoutLink ||
    eventJson?.conferenceData?.entryPoints?.find?.((entry: { entryPointType?: string; uri?: string }) => entry.entryPointType === 'video')?.uri ||
    null

  return {
    eventId: typeof eventJson?.id === 'string' ? eventJson.id : null,
    htmlLink: typeof eventJson?.htmlLink === 'string' ? eventJson.htmlLink : null,
    meetLink: typeof meetLink === 'string' ? meetLink : null,
  }
}

export function extractAttendees(
  clientEmail: string,
  clientName: string,
  guestEmailsRaw: string | null | undefined
): Array<{ email: string; displayName?: string }> {
  const attendees: Array<{ email: string; displayName?: string }> = []
  attendees.push({ email: normalizeEmail(clientEmail), displayName: clientName || undefined })

  for (const guestEmail of parseGuestEmails(guestEmailsRaw)) {
    attendees.push({ email: guestEmail })
  }

  const notifyEmail = process.env.NOTIFY_EMAIL || process.env.BUSINESS_EMAIL
  if (notifyEmail) {
    attendees.push({ email: normalizeEmail(notifyEmail) })
  }

  return attendees
}
