import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { getBookingProfile } from '@/app/admin/booking-profile/actions';
import BookingFlow from './BookingFlow';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const supabase = await createClient();
    const { data } = await supabase.from('event_types').select('title').eq('slug', slug).single();
    return { title: data ? `${data.title} | الحجز` : 'الحجز' };
}

export default async function BookSlugPage({
    params,
    searchParams,
}: {
    params: Promise<{ slug: string }>
    searchParams: Promise<{ booking_paid?: string; booking_pending?: string; booking_failed?: string }>
}) {
    const { slug } = await params;
    const query = await searchParams;
    const supabase = await createClient();
    const { data: eventType } = await supabase
        .from('event_types')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

    if (!eventType) notFound();

    const profile = await getBookingProfile();
    const notice = query.booking_paid
        ? 'تم تأكيد الدفع والحجز بنجاح.'
        : query.booking_pending
            ? 'عملية الدفع قيد التأكيد. سيتم تحديث الحالة تلقائيًا.'
            : query.booking_failed
                ? 'الدفع لم يكتمل. يمكنك إعادة المحاولة.'
                : null;

    return <BookingFlow eventType={eventType} profile={profile} notice={notice} />;
}
