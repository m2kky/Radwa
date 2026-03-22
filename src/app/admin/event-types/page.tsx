import { createAdminClient } from '@/lib/supabase/server';
import EventTypesList from './EventTypesList';
import s from '../Scheduling.module.css';

export const metadata = { title: 'Event Types | Admin' };

export default async function EventTypesPage() {
    const supabase = createAdminClient();
    const { data: eventTypes } = await supabase
        .from('event_types')
        .select('*')
        .order('created_at', { ascending: true });

    return (
        <div>
            <div className={s.pageHeader}>
                <div>
                    <h1 className={s.pageTitle}>Event Types</h1>
                    <p className={s.pageSub}>Create events to share for people to book on your calendar</p>
                </div>
            </div>

            <EventTypesList eventTypes={eventTypes || []} />
        </div>
    );
}
