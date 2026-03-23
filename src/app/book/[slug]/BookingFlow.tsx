'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { getAvailableSlots, submitBooking } from '@/app/api/bookings/actions';
import { trackEvent } from '@/lib/analytics';
import s from '../Booking.module.css';

interface EventType {
    id: string; title: string; slug: string; description: string;
    duration_minutes: number; price: number; color: string;
    start_time_increment: number; allow_guests: boolean;
    invitee_questions: InviteeQuestion[];
    communication_methods: string[];
    timezone_display: string; locked_timezone: string;
    min_notice_hours: number; max_future_days: number;
}

type InviteeQuestion = { text: string; required: boolean; answer_type: string; status: boolean };

interface Profile {
    name: string;
    welcome_message: string;
    avatar_url: string;
    time_format: string;
    timezone: string;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

function formatTime(t: string, format: string = '12h') {
    const [h, m] = t.split(':').map(Number);
    if (format === '24h') return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    const ampm = h >= 12 ? 'pm' : 'am';
    const h12 = h % 12 || 12;
    return `${h12}:${m.toString().padStart(2, '0')}${ampm}`;
}

function addMinutes(time: string, mins: number): string {
    const [h, m] = time.split(':').map(Number);
    const total = h * 60 + m + mins;
    return `${Math.floor(total / 60).toString().padStart(2, '0')}:${(total % 60).toString().padStart(2, '0')}`;
}

export default function BookingFlow({
    eventType,
    profile,
    notice,
}: {
    eventType: EventType
    profile: Profile
    notice?: string | null
}) {
    const ev = eventType;
    const p = profile;
    const [step, setStep] = useState<'calendar' | 'details' | 'success'>('calendar');
    const [month, setMonth] = useState(new Date().getMonth());
    const [year, setYear] = useState(new Date().getFullYear());
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [selectedTime, setSelectedTime] = useState<string>('');
    const [slots, setSlots] = useState<string[]>([]);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'card' | 'wallet'>('card');
    const [showGuests, setShowGuests] = useState(false);

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Calendar grid
    const calendarDays = useMemo(() => {
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const maxDate = new Date(); maxDate.setDate(maxDate.getDate() + (ev.max_future_days || 60));

        const days: { day: number; available: boolean }[] = [];
        for (let i = 0; i < firstDay; i++) days.push({ day: 0, available: false });
        for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(year, month, d);
            const dayOfWeek = date.getDay();
            const isFuture = date >= today && date <= maxDate;
            // Simple: weekdays are available (fine-tuned by server slots)
            const isWeekday = dayOfWeek >= 0 && dayOfWeek <= 6;
            days.push({ day: d, available: isFuture && isWeekday });
        }
        return days;
    }, [month, year, ev.max_future_days]);

    // Fetch slots when date changes
    useEffect(() => {
        if (!selectedDate) return;
        setSlotsLoading(true);
        setSlots([]);
        setSelectedTime('');
        getAvailableSlots(selectedDate, ev.duration_minutes, ev.id).then(result => {
            setSlots(result);
            setSlotsLoading(false);
        }).catch(() => setSlotsLoading(false));
    }, [selectedDate, ev.duration_minutes, ev.id]);

    const selectDate = (day: number) => {
        const d = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        setSelectedDate(d);
    };

    const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
    const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        const fd = new FormData(e.currentTarget);
        fd.set('event_type_id', ev.id);
        fd.set('date', selectedDate);
        fd.set('time', selectedTime);
        fd.set('duration_minutes', ev.duration_minutes.toString());
        const r = await submitBooking(fd);
        setSubmitting(false);
        if (r?.error) {
            setError(r.error);
        } else if (r?.redirect) {
            trackEvent('begin_checkout', {
                form_name: 'booking',
                event_type: ev.title,
                value: ev.price ?? 0,
            });
            window.location.href = r.redirect;
        } else {
            trackEvent('generate_lead', {
                form_name: 'booking',
                event_type: ev.title,
                event_slug: ev.slug,
            });
            setStep('success');
        }
    };

    const selectedDateObj = selectedDate ? new Date(selectedDate + 'T00:00:00') : null;
    const activeQuestions = (ev.invitee_questions || []).filter((q) => q.status);

    /* ======== SUCCESS ======== */
    if (step === 'success') {
        return (
            <div className={s.pageWrap}>
                <div className={s.bookingCard} style={{ justifyContent: 'center' }}>
                    <div className={s.successWrap}>
                        <div className={s.successIcon}>✓</div>
                        <div className={s.successTitle}>You are scheduled</div>
                        <p className={s.successSub}>A calendar invitation has been sent to your email.</p>
                    </div>
                </div>
            </div>
        );
    }

    /* ======== MAIN ======== */
    return (
        <div className={s.pageWrap}>
            <div className={s.bookingCard}>
                {/* — Sidebar — */}
                <div className={s.sidebar}>
                    {step === 'details' && (
                        <button type="button" className={s.backBtn} onClick={() => setStep('calendar')}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
                        </button>
                    )}
                    <Image src={p.avatar_url} alt={p.name} width={64} height={64} className={s.sidebarPhoto} />
                    <div className={s.sidebarName}>{p.name}</div>
                    <div className={s.sidebarTitle}>{ev.title}</div>
                    <div className={s.sidebarMeta}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                        {ev.duration_minutes} min
                    </div>
                    {Number(ev.price || 0) > 0 && (
                        <div className={s.sidebarMeta}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1v22M17 5H9a4 4 0 000 8h6a4 4 0 010 8H6" /></svg>
                            {Number(ev.price).toLocaleString('ar-EG')} EGP
                        </div>
                    )}
                    {step === 'details' && selectedDateObj && selectedTime && (
                        <>
                            <div className={s.sidebarMeta}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                                {formatTime(selectedTime, p.time_format)} - {formatTime(addMinutes(selectedTime, ev.duration_minutes), p.time_format)}, {selectedDateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                            </div>
                            <div className={s.sidebarMeta}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></svg>
                                {tz}
                            </div>
                        </>
                    )}
                    {ev.description && <div className={s.sidebarDesc}>&ldquo;{ev.description}&rdquo;</div>}
                </div>

                {/* — Main Content — */}
                <div className={s.mainContent}>
                    {notice ? (
                        <div style={{
                            marginBottom: '1rem',
                            border: '1px solid rgba(34,197,94,0.35)',
                            background: 'rgba(34,197,94,0.1)',
                            color: '#86efac',
                            borderRadius: 10,
                            padding: '0.75rem 0.9rem',
                            fontSize: '0.85rem'
                        }}>
                            {notice}
                        </div>
                    ) : null}
                    {step === 'calendar' && (
                        <>
                            <div className={s.stepHeading}>Select a Date &amp; Time</div>
                            <div className={s.calendarWrap}>
                                {/* Calendar */}
                                <div className={s.calendarGrid}>
                                    <div className={s.monthNav}>
                                        <button type="button" className={s.monthNavBtn} onClick={prevMonth}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
                                        </button>
                                        <div className={s.monthLabel}>{MONTHS[month]} {year}</div>
                                        <button type="button" className={s.monthNavBtn} onClick={nextMonth}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                                        </button>
                                    </div>
                                    <div className={s.dayHeaders}>
                                        {DAYS.map(d => <div key={d}>{d}</div>)}
                                    </div>
                                    <div className={s.daysGrid}>
                                        {calendarDays.map((d, i) => {
                                            if (d.day === 0) return <div key={i} className={s.dayEmpty} />;
                                            const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${d.day.toString().padStart(2, '0')}`;
                                            const isSelected = dateStr === selectedDate;
                                            return (
                                                <button
                                                    key={i}
                                                    type="button"
                                                    className={isSelected ? s.daySelected : d.available ? s.dayAvailable : s.dayUnavailable}
                                                    onClick={() => d.available && selectDate(d.day)}
                                                    disabled={!d.available}
                                                >
                                                    {d.day}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <div className={s.timezoneBar}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></svg>
                                        <span>Time zone: {tz}</span>
                                    </div>
                                </div>

                                {/* Time Slots */}
                                {selectedDate && (
                                    <div className={s.timeSlotsPanel}>
                                        <div className={s.timeSlotsDate}>
                                            {selectedDateObj?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                                        </div>
                                        {slotsLoading ? (
                                            <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>Loading...</p>
                                        ) : slots.length > 0 ? (
                                            slots.map(time => (
                                                selectedTime === time ? (
                                                    <div key={time} className={s.timeSlotSelected}>
                                                        <div className={s.timeSlotSelectedTime}>{formatTime(time, p.time_format)}</div>
                                                        <button type="button" className={s.timeSlotNextBtn} onClick={() => setStep('details')}>Next</button>
                                                    </div>
                                                ) : (
                                                    <button key={time} type="button" className={s.timeSlot} onClick={() => setSelectedTime(time)} title={formatTime(time, p.time_format)}>
                                                        {formatTime(time, p.time_format)}
                                                    </button>
                                                )
                                            ))
                                        ) : (
                                            <p style={{ fontSize: '0.85rem', color: '#ef4444' }}>No slots available</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {step === 'details' && (
                        <form onSubmit={handleSubmit} className={s.formSection}>
                            <div className={s.stepHeading}>Enter Details</div>
                            <div className={s.formRow}>
                                <div className={s.formGroup}>
                                    <label className={s.formLabel}>First Name *</label>
                                    <input name="first_name" required className={s.formInput} />
                                </div>
                                <div className={s.formGroup}>
                                    <label className={s.formLabel}>Last Name *</label>
                                    <input name="last_name" required className={s.formInput} />
                                </div>
                            </div>
                            <div className={s.formGroup}>
                                <label className={s.formLabel}>Email *</label>
                                <input type="email" name="email" required className={s.formInput} />
                            </div>
                            {/* Hidden combined name for backend */}
                            <input type="hidden" name="name" value="" />

                            {ev.allow_guests && (
                                <>
                                    <button type="button" className={s.addGuestsBtn} onClick={() => setShowGuests(!showGuests)}>
                                        + Add Guests
                                    </button>
                                    {showGuests && (
                                        <div className={s.formGroup}>
                                            <label className={s.formLabel}>Guest emails (comma separated)</label>
                                            <input name="guests" className={s.formInput} placeholder="guest1@email.com, guest2@email.com" />
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Communication Methods */}
                            {ev.communication_methods && ev.communication_methods.length > 0 && (
                                <div className={s.commMethodGroup}>
                                    <div className={s.commMethodLabel}>Online *</div>
                                    {ev.communication_methods.map((m: string) => (
                                        <label key={m} className={s.commOption}>
                                            <input type="radio" name="communication_method" value={m} defaultChecked={m === ev.communication_methods[0]} />
                                            {m === 'google_meet' && '📹 Google Meet'}
                                            {m === 'phone' && '📞 Phone call'}
                                            {m === 'in_person' && '🏢 In person'}
                                        </label>
                                    ))}
                                </div>
                            )}

                            {Number(ev.price || 0) > 0 && (
                                <div className={s.formGroup}>
                                    <label className={s.formLabel}>الدفع</label>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        <button
                                            type="button"
                                            onClick={() => setPaymentMethod('card')}
                                            style={{
                                                border: paymentMethod === 'card' ? '1px solid #22d3ee' : '1px solid rgba(255,255,255,0.15)',
                                                background: paymentMethod === 'card' ? 'rgba(34,211,238,0.12)' : 'rgba(255,255,255,0.04)',
                                                color: '#e5e7eb',
                                                borderRadius: 10,
                                                padding: '0.5rem 0.75rem',
                                                fontSize: '0.8rem',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            بطاقة بنكية
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPaymentMethod('wallet')}
                                            style={{
                                                border: paymentMethod === 'wallet' ? '1px solid #22d3ee' : '1px solid rgba(255,255,255,0.15)',
                                                background: paymentMethod === 'wallet' ? 'rgba(34,211,238,0.12)' : 'rgba(255,255,255,0.04)',
                                                color: '#e5e7eb',
                                                borderRadius: 10,
                                                padding: '0.5rem 0.75rem',
                                                fontSize: '0.8rem',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            محفظة إلكترونية
                                        </button>
                                    </div>
                                    <p style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: '0.45rem' }}>
                                        سيتم تحويلك إلى بوابة الدفع لإتمام الحجز.
                                    </p>
                                </div>
                            )}
                            <input type="hidden" name="payment_method" value={paymentMethod} />

                            {/* Custom Questions */}
                            {activeQuestions.map((q, i: number) => (
                                <div key={i} className={s.formGroup}>
                                    <label className={s.formLabel}>&ldquo;{q.text}&rdquo; {q.required && '*'}</label>
                                    {q.answer_type === 'textarea' ? (
                                        <textarea name={`question_${i}`} required={q.required} className={s.formTextarea} />
                                    ) : q.answer_type === 'select' ? (
                                        <select name={`question_${i}`} required={q.required} className={s.formSelect}>
                                            <option value="">Select...</option>
                                        </select>
                                    ) : (
                                        <input name={`question_${i}`} required={q.required} className={s.formInput} />
                                    )}
                                </div>
                            ))}

                            <div className={s.formGroup}>
                                <label className={s.formLabel}>Anything you&apos;d like to share?</label>
                                <textarea name="notes" className={s.formTextarea} placeholder="Your current challenges, goals, etc..." />
                            </div>

                            <p className={s.termsText}>
                                By proceeding, you confirm that you have read and agree to the Terms of Use and Privacy Notice.
                            </p>

                            {error && <p style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '0.75rem' }}>{error}</p>}

                            <button type="submit" disabled={submitting} className={s.scheduleBtn}>
                                {submitting
                                    ? 'جاري المتابعة...'
                                    : Number(ev.price || 0) > 0
                                        ? `ادفع ${Number(ev.price).toLocaleString('ar-EG')} ج واحجز`
                                        : 'تأكيد الحجز'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
