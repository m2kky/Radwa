'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

function slugify(text: unknown): string {
  if (!text) return ''
  return String(text).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function parseJsonArray(value: FormDataEntryValue | null, fallback: unknown[]): unknown[] {
  if (typeof value !== 'string' || value.trim() === '') return fallback
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : fallback
  } catch {
    return fallback
  }
}

function readString(formData: FormData, key: string): string | null {
  const value = formData.get(key)
  if (typeof value !== 'string') return null
  return value.trim()
}

function readInt(formData: FormData, key: string): number | null {
  const value = readString(formData, key)
  if (value === null || value === '') return null
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : null
}

function readFloat(formData: FormData, key: string): number | null {
  const value = readString(formData, key)
  if (value === null || value === '') return null
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : null
}

function readBoolean(formData: FormData, key: string): boolean | null {
  if (!formData.has(key)) return null
  const value = readString(formData, key)
  return value === 'true'
}

interface EventTypeRow {
  id: string
  title: string
  slug: string
  description: string | null
  duration_minutes: number
  price: number
  color: string
  is_active: boolean
  buffer_before: number
  buffer_after: number
  max_per_day: number | null
  start_time_increment: number
  timezone_display: string
  locked_timezone: string | null
  allow_guests: boolean
  invitee_questions: unknown[]
  communication_methods: unknown[]
  confirmation_redirect: string | null
  email_reminder_hours: number | null
  email_followup_hours: number | null
  min_notice_hours: number
  max_future_days: number
}

export async function addEventType(formData: FormData) {
  const supabase = createAdminClient()
  const title = readString(formData, 'title')
  if (!title) return { error: 'Event name is required' }

  const slugInput = readString(formData, 'slug')
  const data: Record<string, unknown> = {
    title,
    slug: slugInput || slugify(title),
    description: readString(formData, 'description') ?? '',
    duration_minutes: readInt(formData, 'duration_minutes') ?? 30,
    price: readFloat(formData, 'price') ?? 0,
    color: readString(formData, 'color') || '#9b51e0',
    is_active: readBoolean(formData, 'is_active') ?? true,
    buffer_before: readInt(formData, 'buffer_before') ?? 0,
    buffer_after: readInt(formData, 'buffer_after') ?? 0,
    max_per_day: readInt(formData, 'max_per_day'),
    start_time_increment: readInt(formData, 'start_time_increment') ?? 30,
    timezone_display: readString(formData, 'timezone_display') || 'auto',
    locked_timezone: readString(formData, 'locked_timezone') || null,
    allow_guests: readBoolean(formData, 'allow_guests') ?? false,
    invitee_questions: parseJsonArray(formData.get('invitee_questions'), []),
    communication_methods: parseJsonArray(formData.get('communication_methods'), ['google_meet']),
    confirmation_redirect: readString(formData, 'confirmation_redirect') || null,
    email_reminder_hours: readInt(formData, 'email_reminder_hours'),
    email_followup_hours: readInt(formData, 'email_followup_hours'),
    min_notice_hours: readInt(formData, 'min_notice_hours') ?? 4,
    max_future_days: readInt(formData, 'max_future_days') ?? 60,
  }

  const { error } = await supabase.from('event_types').insert([data])
  if (error) return { error: error.message }
  revalidatePath('/admin/event-types')
  revalidatePath('/book')
  return { success: true }
}

export async function updateEventType(formData: FormData) {
  const supabase = createAdminClient()
  const id = readString(formData, 'id')
  if (!id) return { error: 'Event id is required' }

  const { data: current, error: fetchError } = await supabase
    .from('event_types')
    .select('*')
    .eq('id', id)
    .single<EventTypeRow>()

  if (fetchError || !current) return { error: fetchError?.message || 'Event type not found' }

  const titleInput = readString(formData, 'title')
  if (formData.has('title') && !titleInput) {
    return { error: 'Event name is required' }
  }

  const title = titleInput || current.title
  const slugInput = readString(formData, 'slug')

  const data: Record<string, unknown> = {
    title,
    slug: slugInput || current.slug || slugify(title),
    description: formData.has('description') ? (readString(formData, 'description') ?? '') : (current.description ?? ''),
    duration_minutes: readInt(formData, 'duration_minutes') ?? current.duration_minutes,
    price: readFloat(formData, 'price') ?? current.price,
    color: readString(formData, 'color') || current.color || '#9b51e0',
    is_active: readBoolean(formData, 'is_active') ?? current.is_active,
    buffer_before: readInt(formData, 'buffer_before') ?? current.buffer_before,
    buffer_after: readInt(formData, 'buffer_after') ?? current.buffer_after,
    max_per_day: formData.has('max_per_day') ? readInt(formData, 'max_per_day') : current.max_per_day,
    start_time_increment: readInt(formData, 'start_time_increment') ?? current.start_time_increment,
    timezone_display: readString(formData, 'timezone_display') || current.timezone_display || 'auto',
    locked_timezone: formData.has('locked_timezone')
      ? (readString(formData, 'locked_timezone') || null)
      : current.locked_timezone,
    allow_guests: readBoolean(formData, 'allow_guests') ?? current.allow_guests,
    invitee_questions: formData.has('invitee_questions')
      ? parseJsonArray(formData.get('invitee_questions'), current.invitee_questions || [])
      : (current.invitee_questions || []),
    communication_methods: formData.has('communication_methods')
      ? parseJsonArray(formData.get('communication_methods'), current.communication_methods || ['google_meet'])
      : (current.communication_methods || ['google_meet']),
    confirmation_redirect: formData.has('confirmation_redirect')
      ? (readString(formData, 'confirmation_redirect') || null)
      : current.confirmation_redirect,
    email_reminder_hours: formData.has('email_reminder_hours')
      ? readInt(formData, 'email_reminder_hours')
      : current.email_reminder_hours,
    email_followup_hours: formData.has('email_followup_hours')
      ? readInt(formData, 'email_followup_hours')
      : current.email_followup_hours,
    min_notice_hours: readInt(formData, 'min_notice_hours') ?? current.min_notice_hours,
    max_future_days: readInt(formData, 'max_future_days') ?? current.max_future_days,
  }

  const { error } = await supabase.from('event_types').update(data).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/event-types')
  revalidatePath('/book')
  return { success: true }
}

export async function deleteEventType(id: string) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('event_types').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/event-types')
  revalidatePath('/book')
  return { success: true }
}
