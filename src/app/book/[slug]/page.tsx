import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { getBookingProfile } from '@/app/admin/booking-profile/actions';
import BookingFlow from './BookingFlow';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const supabase = createAdminClient();
    const { data } = await supabase.from('event_types').select('title').eq('slug', slug).single();
    return { title: data ? `${data.title} | الحجز` : 'الحجز' };
}

export default async function BookSlugPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const supabase = createAdminClient();
    const { data: eventType } = await supabase
        .from('event_types')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

    if (!eventType) notFound();

    const profile = await getBookingProfile();

    return <BookingFlow eventType={eventType} profile={profile} />;
}
