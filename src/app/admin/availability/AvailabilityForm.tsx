'use client';

import { useTransition, useState, useEffect } from 'react';
import { updateAvailabilityState, saveOverride, deleteOverride } from './actions';
import s from '../Scheduling.module.css';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

type TimeSlot = { start: string; end: string };
type ScheduleState = Record<number, TimeSlot[]>;
type AvailabilityRow = { day_of_week: number; start_time: string; end_time: string };

interface Override { id: string; date: string; slots: { start: string; end: string }[] }

export default function AvailabilityForm({ availabilities, overrides: initialOverrides }: { availabilities: AvailabilityRow[]; overrides: Override[] }) {
    const [isPending, startTransition] = useTransition();
    const [schedule, setSchedule] = useState<ScheduleState>({});
    const [overrides, setOverrides] = useState<Override[]>(initialOverrides || []);
    const [showOverrideForm, setShowOverrideForm] = useState(false);
    const [newOverrideDate, setNewOverrideDate] = useState('');
    const [newOverrideSlots, setNewOverrideSlots] = useState<TimeSlot[]>([{ start: '09:00', end: '17:00' }]);
    const [tab, setTab] = useState<'weekly' | 'overrides'>('weekly');

    useEffect(() => {
        const init: ScheduleState = {};
        DAYS.forEach((_, i) => init[i] = []);
        availabilities.forEach(a => {
            const d = a.day_of_week;
            if (init[d]) init[d].push({ start: a.start_time.substring(0, 5), end: a.end_time.substring(0, 5) });
        });
        setSchedule(init);
    }, [availabilities]);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        startTransition(async () => {
            const clean: ScheduleState = {};
            for (const [d, slots] of Object.entries(schedule))
                clean[parseInt(d)] = slots.filter(sl => sl.start && sl.end);
            const r = await updateAvailabilityState(JSON.stringify(clean));
            if (r?.error) alert('Error: ' + r.error);
            else alert('Availability saved!');
        });
    };

    const toggle = (i: number) => {
        setSchedule(p => {
            const n = { ...p };
            n[i] = n[i].length > 0 ? [] : [{ start: '09:00', end: '17:00' }];
            return n;
        });
    };
    const add = (i: number) => setSchedule(p => ({ ...p, [i]: [...p[i], { start: '17:00', end: '18:00' }] }));
    const remove = (d: number, si: number) => setSchedule(p => ({ ...p, [d]: p[d].filter((_, j) => j !== si) }));
    const update = (d: number, si: number, f: 'start' | 'end', v: string) =>
        setSchedule(p => { const n = { ...p }; n[d] = [...n[d]]; n[d][si] = { ...n[d][si], [f]: v }; return n; });
    const copyWeekdays = (src: number) => {
        if (!confirm('Copy this schedule to all weekdays (Mon-Fri)?')) return;
        setSchedule(p => { const n = { ...p }; const cp = JSON.parse(JSON.stringify(p[src])); for (let i = 1; i <= 5; i++) n[i] = JSON.parse(JSON.stringify(cp)); return n; });
    };

    const handleSaveOverride = () => {
        if (!newOverrideDate) return;
        startTransition(async () => {
            const validSlots = newOverrideSlots.filter(sl => sl.start && sl.end);
            const r = await saveOverride(newOverrideDate, validSlots);
            if (r?.error) alert(r.error);
            else {
                setOverrides(p => [...p.filter(o => o.date !== newOverrideDate), { id: '', date: newOverrideDate, slots: validSlots }]);
                setShowOverrideForm(false);
                setNewOverrideDate('');
                setNewOverrideSlots([{ start: '09:00', end: '17:00' }]);
            }
        });
    };

    const handleDeleteOverride = (id: string) => {
        startTransition(async () => {
            const r = await deleteOverride(id);
            if (r?.error) alert(r.error);
            else setOverrides(p => p.filter(o => o.id !== id));
        });
    };

    return (
        <div>
            {/* Tabs */}
            <div className={s.tabs}>
                <button type="button" className={tab === 'weekly' ? s.tabActive : s.tab} onClick={() => setTab('weekly')}>Weekly hours</button>
                <button type="button" className={tab === 'overrides' ? s.tabActive : s.tab} onClick={() => setTab('overrides')}>Date overrides</button>
            </div>

            {tab === 'weekly' && (
                <form onSubmit={handleSubmit}>
                    <div className={s.scheduleCard}>
                        {DAYS.map((dayName, di) => {
                            const slots = schedule[di] || [];
                            const active = slots.length > 0;
                            return (
                                <div key={di} className={s.availRow}>
                                    <div className={s.dayToggle}>
                                        <button type="button" onClick={() => toggle(di)} className={active ? s.dayBadgeActive : s.dayBadgeInactive} title={dayName}>
                                            {DAY_LETTERS[di]}
                                        </button>
                                    </div>
                                    <div className={s.slotsArea}>
                                        {!active ? (
                                            <span className={s.unavailText}>Unavailable</span>
                                        ) : (
                                            slots.map((slot, si) => (
                                                <div key={si} className={s.slotRow}>
                                                    <input type="time" value={slot.start} onChange={e => update(di, si, 'start', e.target.value)} className={s.timeInput} />
                                                    <span className={s.timeDash}>–</span>
                                                    <input type="time" value={slot.end} onChange={e => update(di, si, 'end', e.target.value)} className={s.timeInput} />
                                                    <div className={s.slotActions}>
                                                        <button type="button" className={s.iconBtnDanger} onClick={() => remove(di, si)} title="Remove">
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                                                        </button>
                                                        <button type="button" className={s.iconBtn} onClick={() => add(di)} title="Add interval">
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
                                                        </button>
                                                        <button type="button" className={s.iconBtn} onClick={() => copyWeekdays(di)} title="Copy to weekdays">
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        <div className={s.timezone}>🌐 Africa/Cairo ▾</div>
                        <div className={s.saveBar}>
                            <button type="submit" disabled={isPending} className={s.btnPrimary}>
                                {isPending ? 'Saving…' : 'Save changes'}
                            </button>
                        </div>
                    </div>
                </form>
            )}

            {tab === 'overrides' && (
                <div className={s.scheduleCard}>
                    <div className={s.scheduleHeader}>
                        <div>
                            <div className={s.scheduleHeaderTitle}>Date-specific overrides</div>
                            <div className={s.scheduleHeaderSub}>Override your weekly hours for specific dates</div>
                        </div>
                        <button type="button" className={s.btnPrimary} onClick={() => setShowOverrideForm(true)}>
                            + Add override
                        </button>
                    </div>

                    {showOverrideForm && (
                        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,105,255,0.03)' }}>
                            <div className={s.inputGroup}>
                                <label className={s.label}>Date</label>
                                <input type="date" value={newOverrideDate} onChange={e => setNewOverrideDate(e.target.value)} className={s.input} style={{ maxWidth: 200 }} min={new Date().toISOString().split('T')[0]} />
                            </div>
                            <div className={s.inputGroup}>
                                <label className={s.label}>Time slots (leave empty = mark as unavailable)</label>
                                {newOverrideSlots.map((sl, i) => (
                                    <div key={i} className={s.slotRow} style={{ marginBottom: '0.4rem' }}>
                                        <input type="time" value={sl.start} onChange={e => { const n = [...newOverrideSlots]; n[i] = { ...n[i], start: e.target.value }; setNewOverrideSlots(n); }} className={s.timeInput} />
                                        <span className={s.timeDash}>–</span>
                                        <input type="time" value={sl.end} onChange={e => { const n = [...newOverrideSlots]; n[i] = { ...n[i], end: e.target.value }; setNewOverrideSlots(n); }} className={s.timeInput} />
                                        <button type="button" className={s.iconBtnDanger} onClick={() => setNewOverrideSlots(p => p.filter((_, j) => j !== i))}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                ))}
                                <button type="button" className={s.btnOutline} onClick={() => setNewOverrideSlots(p => [...p, { start: '09:00', end: '17:00' }])} style={{ marginTop: '0.5rem' }}>+ Add slot</button>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                                <button type="button" className={s.btnPrimary} onClick={handleSaveOverride} disabled={isPending}>
                                    {isPending ? 'Saving…' : 'Save override'}
                                </button>
                                <button type="button" className={s.btnOutline} onClick={() => setShowOverrideForm(false)}>Cancel</button>
                            </div>
                        </div>
                    )}

                    {overrides.length > 0 ? overrides.map(o => (
                        <div key={o.id || o.date} className={s.availRow}>
                            <div style={{ width: 120, fontWeight: 500, fontSize: '0.875rem' }}>
                                {new Date(o.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                            <div className={s.slotsArea}>
                                {o.slots.length === 0 ? (
                                    <span className={s.unavailText}>Unavailable (blocked)</span>
                                ) : (
                                    o.slots.map((sl, i) => (
                                        <span key={i} style={{ fontSize: '0.85rem' }}>{sl.start} – {sl.end}</span>
                                    ))
                                )}
                            </div>
                            <button type="button" className={s.iconBtnDanger} onClick={() => handleDeleteOverride(o.id)}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2m2 0v14a2 2 0 01-2 2H8a2 2 0 01-2-2V6h12" /></svg>
                            </button>
                        </div>
                    )) : (
                        <div style={{ padding: '2rem 1.5rem', textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: '0.9rem' }}>No date overrides set</div>
                    )}
                </div>
            )}
        </div>
    );
}
