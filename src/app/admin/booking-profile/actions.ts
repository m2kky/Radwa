'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type BookingProfile = {
    name: string;
    welcome_message: string;
    language: string;
    date_format: string;
    time_format: string;
    timezone: string;
    avatar_url: string;
}

const DEFAULT_PROFILE: BookingProfile = {
    name: 'Radwa Muhammed',
    welcome_message: 'احجزي جلسة استشارية مباشرة لمناقشة استراتيجية التسويق والمحتوى المناسبة لعملك.',
    language: 'ar',
    date_format: 'MMM d, yyyy',
    time_format: '12h',
    timezone: 'Africa/Cairo',
    avatar_url: '/avatar.jpg',
};

export async function getBookingProfile(): Promise<BookingProfile> {
    const supabase = createAdminClient();
    const { data } = await supabase.from('settings').select('value').eq('key', 'booking_profile').single();
    if (data?.value) {
        return { ...DEFAULT_PROFILE, ...(typeof data.value === 'string' ? JSON.parse(data.value) : data.value) };
    }
    return DEFAULT_PROFILE;
}

export async function updateBookingProfile(formData: FormData) {
    const supabase = createAdminClient();

    const profile: BookingProfile = {
        name: formData.get('name') as string || DEFAULT_PROFILE.name,
        welcome_message: formData.get('welcome_message') as string || DEFAULT_PROFILE.welcome_message,
        language: formData.get('language') as string || 'en',
        date_format: formData.get('date_format') as string || 'MMM d, yyyy',
        time_format: formData.get('time_format') as string || '12h',
        timezone: formData.get('timezone') as string || 'Africa/Cairo',
        avatar_url: formData.get('avatar_url') as string || '/avatar.jpg',
    };

    const { error } = await supabase.from('settings').upsert({
        key: 'booking_profile',
        value: profile,
        updated_at: new Date().toISOString(),
    }, { onConflict: 'key' });

    if (error) return { error: error.message };
    revalidatePath('/admin/booking-profile');
    revalidatePath('/book');
    return { success: true };
}
