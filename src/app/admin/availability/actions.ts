'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateAvailabilityState(scheduleJson: string) {
    const supabase = createAdminClient();

    type TimeSlot = { start: string; end: string };
    type ScheduleMap = Record<string, TimeSlot[]>;

    let scheduleData: ScheduleMap = {};
    try {
        scheduleData = JSON.parse(scheduleJson);
    } catch {
        return { error: 'Invalid schedule payload format' };
    }

    // Since we don't have foreign keys referencing availability IDs anywhere,
    // the cleanest way to sync a complex schedule is to wipe and replace.
    const { error: deleteError } = await supabase
        .from('availability')
        .delete()
        .filter('id', 'not.is', null); // Delete all rows

    if (deleteError) {
        console.error('Failed to clear old availability:', deleteError);
        return { error: deleteError.message };
    }

    const inserts = [];
    for (const [dayIndexStr, slots] of Object.entries(scheduleData)) {
        const dayOfWeek = parseInt(dayIndexStr, 10);
        for (const slot of slots) {
            inserts.push({
                day_of_week: dayOfWeek,
                start_time: slot.start.includes(':') && slot.start.length === 5 ? `${slot.start}:00` : slot.start,
                end_time: slot.end.includes(':') && slot.end.length === 5 ? `${slot.end}:00` : slot.end,
            });
        }
    }

    if (inserts.length > 0) {
        const { error: insertError } = await supabase
            .from('availability')
            .insert(inserts);

        if (insertError) {
            console.error('Failed to insert new availability:', insertError);
            return { error: insertError.message };
        }
    }

    revalidatePath('/admin/availability');
    return { success: true };
}

export async function saveOverride(date: string, slots: { start: string; end: string }[]) {
    const supabase = createAdminClient();

    // Delete existing override for this date
    await supabase.from('availability_overrides').delete().eq('date', date);

    // Insert new
    const { error } = await supabase.from('availability_overrides').insert([{
        date,
        slots: JSON.stringify(slots)
    }]);

    if (error) return { error: error.message };
    revalidatePath('/admin/availability');
    return { success: true };
}

export async function deleteOverride(id: string) {
    const supabase = createAdminClient();
    const { error } = await supabase.from('availability_overrides').delete().eq('id', id);
    if (error) return { error: error.message };
    revalidatePath('/admin/availability');
    return { success: true };
}
