'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

function slugify(text: unknown): string {
    if (!text) return '';
    return String(text).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function parseJsonArray(value: FormDataEntryValue | null, fallback: unknown[]): unknown[] {
    if (typeof value !== 'string' || value.trim() === '') return fallback;
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : fallback;
    } catch {
        return fallback;
    }
}

export async function addEventType(formData: FormData) {
    const supabase = createAdminClient();
    const title = formData.get('title') as string;
    const slug = (formData.get('slug') as string) || slugify(title);

    const data: Record<string, unknown> = {
        title,
        slug,
        description: formData.get('description') as string || '',
        duration_minutes: parseInt(formData.get('duration_minutes') as string) || 30,
        price: parseFloat(formData.get('price') as string) || 0,
        color: formData.get('color') as string || '#9b51e0',
        is_active: formData.get('is_active') === 'true',
        buffer_before: parseInt(formData.get('buffer_before') as string) || 0,
        buffer_after: parseInt(formData.get('buffer_after') as string) || 0,
        max_per_day: formData.get('max_per_day') ? parseInt(formData.get('max_per_day') as string) : null,
        start_time_increment: parseInt(formData.get('start_time_increment') as string) || 30,
        timezone_display: formData.get('timezone_display') as string || 'auto',
        locked_timezone: formData.get('locked_timezone') as string || null,
        allow_guests: formData.get('allow_guests') === 'true',
        invitee_questions: parseJsonArray(formData.get('invitee_questions'), []),
        communication_methods: parseJsonArray(formData.get('communication_methods'), ['google_meet']),
        confirmation_redirect: formData.get('confirmation_redirect') as string || null,
        email_reminder_hours: formData.get('email_reminder_hours') ? parseInt(formData.get('email_reminder_hours') as string) : null,
        email_followup_hours: formData.get('email_followup_hours') ? parseInt(formData.get('email_followup_hours') as string) : null,
        min_notice_hours: parseInt(formData.get('min_notice_hours') as string) || 4,
        max_future_days: parseInt(formData.get('max_future_days') as string) || 60,
    };

    const { error } = await supabase.from('event_types').insert([data]);
    if (error) return { error: error.message };
    revalidatePath('/admin/event-types');
    revalidatePath('/book');
    return { success: true };
}

export async function updateEventType(formData: FormData) {
    const supabase = createAdminClient();
    const id = formData.get('id') as string;
    const title = formData.get('title') as string;
    const slug = (formData.get('slug') as string) || slugify(title);

    const data: Record<string, unknown> = {
        title,
        slug,
        description: formData.get('description') as string || '',
        duration_minutes: parseInt(formData.get('duration_minutes') as string) || 30,
        price: parseFloat(formData.get('price') as string) || 0,
        color: formData.get('color') as string || '#9b51e0',
        is_active: formData.get('is_active') === 'true',
        buffer_before: parseInt(formData.get('buffer_before') as string) || 0,
        buffer_after: parseInt(formData.get('buffer_after') as string) || 0,
        max_per_day: formData.get('max_per_day') ? parseInt(formData.get('max_per_day') as string) : null,
        start_time_increment: parseInt(formData.get('start_time_increment') as string) || 30,
        timezone_display: formData.get('timezone_display') as string || 'auto',
        locked_timezone: formData.get('locked_timezone') as string || null,
        allow_guests: formData.get('allow_guests') === 'true',
        invitee_questions: parseJsonArray(formData.get('invitee_questions'), []),
        communication_methods: parseJsonArray(formData.get('communication_methods'), ['google_meet']),
        confirmation_redirect: formData.get('confirmation_redirect') as string || null,
        email_reminder_hours: formData.get('email_reminder_hours') ? parseInt(formData.get('email_reminder_hours') as string) : null,
        email_followup_hours: formData.get('email_followup_hours') ? parseInt(formData.get('email_followup_hours') as string) : null,
        min_notice_hours: parseInt(formData.get('min_notice_hours') as string) || 4,
        max_future_days: parseInt(formData.get('max_future_days') as string) || 60,
    };

    const { error } = await supabase.from('event_types').update(data).eq('id', id);
    if (error) return { error: error.message };
    revalidatePath('/admin/event-types');
    revalidatePath('/book');
    return { success: true };
}

export async function deleteEventType(id: string) {
    const supabase = createAdminClient();
    const { error } = await supabase.from('event_types').delete().eq('id', id);
    if (error) return { error: error.message };
    revalidatePath('/admin/event-types');
    revalidatePath('/book');
    return { success: true };
}
