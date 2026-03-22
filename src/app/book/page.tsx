import { createAdminClient } from '@/lib/supabase/server';
import { getBookingProfile } from '../admin/booking-profile/actions';
import Image from 'next/image';
import Link from 'next/link';
import s from './Booking.module.css';

export const metadata = { title: 'احجزي جلسة' };

export default async function BookPage() {
    const supabase = createAdminClient();
    const profile = await getBookingProfile();
    const { data: eventTypes } = await supabase
        .from('event_types')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true });

    return (
        <div className={s.pageWrap}>
            <div className={s.listingCard}>
                <Image src={profile.avatar_url} alt={profile.name} width={80} height={80} className={s.profilePhoto} />
                <div className={s.profileName}>{profile.name}</div>
                <p className={s.profileBio}>{profile.welcome_message}</p>
                <div className={s.divider} />
                {eventTypes && eventTypes.length > 0 ? (
                    eventTypes.map(ev => (
                        <Link key={ev.id} href={`/book/${ev.slug}`} className={s.eventItem}>
                            <div className={s.eventDot} style={{ background: ev.color || '#9b51e0' }} />
                            <div className={s.eventItemBody}>
                                <div className={s.eventItemTitle}>
                                    {ev.title}
                                    <span className={s.eventItemArrow}>▶</span>
                                </div>
                                <div className={s.eventItemDesc}>
                                    {ev.description ? `"${ev.description.substring(0, 150)}${ev.description.length > 150 ? '...' : ''}"` : ''}
                                </div>
                            </div>
                        </Link>
                    ))
                ) : (
                    <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>No events available at the moment.</p>
                )}
            </div>
        </div>
    );
}
