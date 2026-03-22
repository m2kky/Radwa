import { createAdminClient } from '@/lib/supabase/server';
import { format } from 'date-fns';
import s from '../Scheduling.module.css';

export const metadata = { title: 'Scheduled Events | Admin' };

type BookingRow = {
    id: string;
    client_name: string;
    client_email: string;
    booking_date: string;
    start_time: string;
    end_time: string;
    meeting_link: string | null;
    payment_status: 'pending' | 'paid' | 'cancelled' | string;
    event_types: { title: string } | null;
};

export default async function BookingsPage() {
    const supabase = createAdminClient();
    const { data } = await supabase
        .from('bookings')
        .select(`*, event_types ( title )`)
        .order('booking_date', { ascending: false })
        .order('start_time', { ascending: false });

    const bookings = (data ?? []) as BookingRow[];
    const today = new Date(new Date().toDateString());
    const upcoming = bookings.filter((b) => new Date(b.booking_date) >= today);
    const past = bookings.filter((b) => new Date(b.booking_date) < today);

    const renderRow = (b: BookingRow) => (
        <tr key={b.id}>
            <td>
                <div className={s.clientName}>{b.client_name}</div>
                <div className={s.clientEmail}>{b.client_email}</div>
            </td>
            <td><span className={s.eventTypeBadge}>{b.event_types?.title || 'Unknown'}</span></td>
            <td>
                <div style={{ fontWeight: 500 }}>{format(new Date(b.booking_date), 'EEE, MMM d, yyyy')}</div>
                <div className={s.clientEmail}>{b.start_time.substring(0, 5)} – {b.end_time.substring(0, 5)}</div>
            </td>
            <td>
                {b.meeting_link && b.meeting_link !== 'Not generated yet' ? (
                    <a href={b.meeting_link} target="_blank" rel="noreferrer" className={s.meetLink}>Join ↗</a>
                ) : (
                    <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.25)' }}>—</span>
                )}
            </td>
            <td>
                <span className={
                    b.payment_status === 'paid' ? s.badgeConfirmed
                        : b.payment_status === 'cancelled' ? s.badgeCancelled
                            : s.badgePending
                }>
                    {b.payment_status === 'paid' ? '● Confirmed' : b.payment_status === 'cancelled' ? '● Cancelled' : '● Pending'}
                </span>
            </td>
        </tr>
    );

    return (
        <div>
            <div className={s.pageHeader}>
                <div>
                    <h1 className={s.pageTitle}>Scheduled Events</h1>
                    <p className={s.pageSub}>View and manage upcoming and past meetings</p>
                </div>
            </div>

            {/* Upcoming */}
            <div className={s.scheduleCard} style={{ marginBottom: '1.5rem' }}>
                <div className={s.scheduleHeader}>
                    <div className={s.scheduleHeaderTitle}>Upcoming ({upcoming.length})</div>
                </div>
                <div className={s.tableWrap}>
                    <table className={s.table}>
                        <thead>
                            <tr>
                                <th>Invitee</th>
                                <th>Event</th>
                                <th>Date &amp; Time</th>
                                <th>Meeting</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {upcoming.length > 0 ? upcoming.map(renderRow) : (
                                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.25)' }}>No upcoming events</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Past */}
            <div className={s.scheduleCard}>
                <div className={s.scheduleHeader}>
                    <div className={s.scheduleHeaderTitle}>Past ({past.length})</div>
                </div>
                <div className={s.tableWrap}>
                    <table className={s.table}>
                        <thead>
                            <tr>
                                <th>Invitee</th>
                                <th>Event</th>
                                <th>Date &amp; Time</th>
                                <th>Meeting</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {past.length > 0 ? past.map(renderRow) : (
                                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.25)' }}>No past events</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
