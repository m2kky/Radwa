import { createAdminClient } from '@/lib/supabase/server';
import AvailabilityForm from './AvailabilityForm';
import s from '../Scheduling.module.css';

export const metadata = { title: 'Availability | Admin' };

export default async function AvailabilityPage() {
    const supabase = createAdminClient();
    const { data: availabilities } = await supabase
        .from('availability')
        .select('*')
        .order('day_of_week', { ascending: true });

    const { data: overrides } = await supabase
        .from('availability_overrides')
        .select('*')
        .order('date', { ascending: true });

    return (
        <div>
            <div className={s.pageHeader}>
                <div>
                    <h1 className={s.pageTitle}>Availability</h1>
                    <p className={s.pageSub}>Set when you are typically available for meetings</p>
                </div>
            </div>

            <AvailabilityForm availabilities={availabilities || []} overrides={(overrides || []).map(o => ({ ...o, slots: typeof o.slots === 'string' ? JSON.parse(o.slots) : o.slots || [] }))} />
        </div>
    );
}
