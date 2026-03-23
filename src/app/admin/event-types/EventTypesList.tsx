'use client';

import { useTransition, useState } from 'react';
import { addEventType, updateEventType, deleteEventType } from './actions';
import s from '../Scheduling.module.css';

const COLORS = ['#9b51e0', '#0069ff', '#e040fb', '#ff5722', '#00bcd4', '#4caf50', '#ff9800'];
const INCREMENTS = [5, 10, 15, 20, 30, 45, 60];

type Question = { text: string; required: boolean; answer_type: string; status: boolean };
type EditableEventType = {
    id: string;
    title?: string;
    slug?: string;
    description?: string;
    duration_minutes?: number;
    price?: number;
    color?: string;
    is_active?: boolean;
    buffer_before?: number;
    buffer_after?: number;
    max_per_day?: number | null;
    start_time_increment?: number;
    timezone_display?: string;
    locked_timezone?: string | null;
    allow_guests?: boolean;
    invitee_questions?: Question[];
    communication_methods?: string[];
    confirmation_redirect?: string | null;
    email_reminder_hours?: number | null;
    email_followup_hours?: number | null;
    min_notice_hours?: number;
    max_future_days?: number;
};

function slugify(t: unknown) {
    if (!t) return '';
    return String(t).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export default function EventTypesList({ eventTypes }: { eventTypes: EditableEventType[] }) {
    const [isPending, startTransition] = useTransition();
    const [editing, setEditing] = useState<EditableEventType | null>(null);
    const [openSection, setOpenSection] = useState('description');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [commMethods, setCommMethods] = useState<string[]>(['google_meet']);

    const startEdit = (ev: EditableEventType) => {
        setEditing(ev);
        setQuestions(ev.invitee_questions || []);
        setCommMethods(ev.communication_methods || ['google_meet']);
        setOpenSection('description');
    };

    const save = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editing) return;
        const currentEditing = editing;
        const fd = new FormData(e.currentTarget);
        fd.set('invitee_questions', JSON.stringify(questions));
        fd.set('communication_methods', JSON.stringify(commMethods));
        if (!fd.get('slug')) fd.set('slug', slugify(fd.get('title') as string));
        startTransition(async () => {
            const isNew = currentEditing.id === 'new';
            const r = isNew ? await addEventType(fd) : await updateEventType(fd);
            if (r.success) setEditing(null); else alert(r.error);
        });
    };

    const del = (id: string) => {
        if (!confirm('Delete this event type?')) return;
        startTransition(async () => { const r = await deleteEventType(id); if (r.success) setEditing(null); else alert(r.error); });
    };

    const toggle = (key: string) => setOpenSection(p => p === key ? '' : key);

    const addQuestion = () => setQuestions(p => [...p, { text: '', required: false, answer_type: 'textarea', status: true }]);
    const removeQuestion = (i: number) => setQuestions(p => p.filter((_, j) => j !== i));
    const updateQuestion = (i: number, field: keyof Question, val: Question[keyof Question]) =>
        setQuestions(p => { const n = [...p]; n[i] = { ...n[i], [field]: val }; return n; });

    const toggleComm = (method: string) => {
        setCommMethods(p => p.includes(method) ? p.filter(m => m !== method) : [...p, method]);
    };

    /* ======== CHEVRON helper ======== */
    const Chevron = ({ open }: { open: boolean }) => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}>
            <path d="M6 9l6 6 6-6" />
        </svg>
    );

    /* ======== EDIT VIEW ======== */
    if (editing) {
        const isNew = editing.id === 'new';
        return (
            <div style={{ maxWidth: 680 }}>
                <div className={s.editHeader}>
                    <button type="button" className={s.backBtn} onClick={() => setEditing(null)}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
                    </button>
                    <h2 className={s.editTitle}>{isNew ? 'New Event Type' : editing.title}</h2>
                </div>

                <form onSubmit={save}>
                    {!isNew && <input type="hidden" name="id" value={editing.id} />}
                    <input type="hidden" name="is_active" value={editing.is_active !== false ? 'true' : 'false'} />

                    <div className={s.accordion}>
                        {/* ─── 1. DESCRIPTION ─── */}
                        <div className={s.accordionItem}>
                            <button type="button" className={s.accordionTrigger} onClick={() => toggle('description')}>
                                <span>Description</span><Chevron open={openSection === 'description'} />
                            </button>
                            {openSection === 'description' && (
                                <div className={s.accordionContent}>
                                    <div className={s.inputGroup}>
                                        <label className={s.label}>Event name</label>
                                        <input name="title" required defaultValue={editing.title} className={s.input} placeholder="e.g. Quick Discovery Call" />
                                    </div>
                                    <div className={s.inputGroup}>
                                        <label className={s.label}>Description / instructions</label>
                                        <textarea name="description" defaultValue={editing.description} className={s.textarea} rows={3} placeholder="Come with your challenge, leave with clarity..." />
                                    </div>
                                    <div className={s.inputGroup}>
                                        <label className={s.label}>Event color</label>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            {COLORS.map(c => (
                                                <label key={c} style={{ cursor: 'pointer' }}>
                                                    <input type="radio" name="color" value={c} defaultChecked={(editing.color || '#9b51e0') === c} style={{ display: 'none' }} />
                                                    <div style={{
                                                        width: 28, height: 28, borderRadius: '50%', background: c,
                                                        border: '2px solid transparent', outline: (editing.color || '#9b51e0') === c ? '2px solid #fff' : 'none',
                                                        outlineOffset: 2
                                                    }} />
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ─── 2. DURATION ─── */}
                        <div className={s.accordionItem}>
                            <button type="button" className={s.accordionTrigger} onClick={() => toggle('duration')}>
                                <span>Duration</span><Chevron open={openSection === 'duration'} />
                            </button>
                            {openSection === 'duration' && (
                                <div className={s.accordionContent}>
                                    <div className={s.inputGroup}>
                                        <label className={s.label}>Duration (minutes)</label>
                                        <input type="number" name="duration_minutes" required defaultValue={editing.duration_minutes || 30} className={s.input} />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ─── 3. LIMITS & BUFFERS ─── */}
                        <div className={s.accordionItem}>
                            <button type="button" className={s.accordionTrigger} onClick={() => toggle('limits')}>
                                <span>Limits &amp; Buffers</span><Chevron open={openSection === 'limits'} />
                            </button>
                            {openSection === 'limits' && (
                                <div className={s.accordionContent}>
                                    <div className={s.twoCol}>
                                        <div className={s.inputGroup}>
                                            <label className={s.label}>Buffer before (min)</label>
                                            <input type="number" name="buffer_before" defaultValue={editing.buffer_before || 0} className={s.input} />
                                        </div>
                                        <div className={s.inputGroup}>
                                            <label className={s.label}>Buffer after (min)</label>
                                            <input type="number" name="buffer_after" defaultValue={editing.buffer_after || 0} className={s.input} />
                                        </div>
                                    </div>
                                    <div className={s.twoCol}>
                                        <div className={s.inputGroup}>
                                            <label className={s.label}>Max bookings per day</label>
                                            <input type="number" name="max_per_day" defaultValue={editing.max_per_day || ''} className={s.input} placeholder="Unlimited" />
                                        </div>
                                        <div className={s.inputGroup}>
                                            <label className={s.label}>Minimum notice (hours)</label>
                                            <input type="number" name="min_notice_hours" defaultValue={editing.min_notice_hours ?? 4} className={s.input} />
                                        </div>
                                    </div>
                                    <div className={s.inputGroup}>
                                        <label className={s.label}>Max days in the future</label>
                                        <input type="number" name="max_future_days" defaultValue={editing.max_future_days ?? 60} className={s.input} />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ─── 4. BOOKING PAGE OPTIONS ─── */}
                        <div className={s.accordionItem}>
                            <button type="button" className={s.accordionTrigger} onClick={() => toggle('booking')}>
                                <span>Booking page options</span><Chevron open={openSection === 'booking'} />
                            </button>
                            {openSection === 'booking' && (
                                <div className={s.accordionContent}>
                                    <div className={s.inputGroup}>
                                        <label className={s.label}>Event slug</label>
                                        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)', marginBottom: 4 }}>muhammedmekky.com/book/</div>
                                        <input name="slug" defaultValue={editing.slug || ''} className={s.input} placeholder={slugify(editing.title || 'new-event')} />
                                    </div>
                                    <div className={s.inputGroup}>
                                        <label className={s.label}>Start time increments</label>
                                        <select name="start_time_increment" defaultValue={editing.start_time_increment || 30} className={s.input}>
                                            {INCREMENTS.map(m => <option key={m} value={m}>{m} min</option>)}
                                        </select>
                                    </div>
                                    <div className={s.inputGroup}>
                                        <label className={s.label}>Time zone display</label>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.35rem' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                                                <input type="radio" name="timezone_display" value="auto" defaultChecked={(editing.timezone_display || 'auto') === 'auto'} />
                                                Automatically detect invitee&apos;s time zone
                                            </label>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                                                <input type="radio" name="timezone_display" value="locked" defaultChecked={editing.timezone_display === 'locked'} />
                                                Lock the timezone (best for in-person meetings)
                                            </label>
                                        </div>
                                    </div>
                                    <div className={s.inputGroup}>
                                        <label className={s.label}>Locked timezone (if locked)</label>
                                        <input name="locked_timezone" defaultValue={editing.locked_timezone || 'Africa/Cairo'} className={s.input} />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ─── 5. INVITEE FORM ─── */}
                        <div className={s.accordionItem}>
                            <button type="button" className={s.accordionTrigger} onClick={() => toggle('invitee')}>
                                <span>Invitee form</span><Chevron open={openSection === 'invitee'} />
                            </button>
                            {openSection === 'invitee' && (
                                <div className={s.accordionContent}>
                                    <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.75rem' }}>Name and Email are always collected.</p>

                                    <div className={s.inputGroup} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <label style={{ fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <input type="checkbox" name="allow_guests_cb" defaultChecked={editing.allow_guests}
                                                onChange={e => { const h = document.querySelector('input[name="allow_guests"]') as HTMLInputElement; if (h) h.value = e.target.checked ? 'true' : 'false'; }} />
                                            Allow invitees to add guests
                                        </label>
                                        <input type="hidden" name="allow_guests" defaultValue={editing.allow_guests ? 'true' : 'false'} />
                                    </div>

                                    <div style={{ marginTop: '0.75rem' }}>
                                        <label className={s.label} style={{ marginBottom: '0.5rem' }}>Communication methods</label>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                            {[{ key: 'google_meet', label: 'Google Meet', icon: '📹' }, { key: 'phone', label: 'Phone call', icon: '📞' }, { key: 'in_person', label: 'In person', icon: '🏢' }].map(m => (
                                                <label key={m.key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                                                    <input type="checkbox" checked={commMethods.includes(m.key)} onChange={() => toggleComm(m.key)} />
                                                    {m.icon} {m.label}
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1rem' }}>
                                        <label className={s.label} style={{ marginBottom: '0.5rem' }}>Invitee questions</label>
                                        {questions.map((q, i) => (
                                            <div key={i} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '0.75rem', marginBottom: '0.5rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                    <strong style={{ fontSize: '0.85rem' }}>Question {i + 1}</strong>
                                                    <button type="button" className={s.iconBtnDanger} onClick={() => removeQuestion(i)}>
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2m2 0v14a2 2 0 01-2 2H8a2 2 0 01-2-2V6h12" /></svg>
                                                    </button>
                                                </div>
                                                <textarea value={q.text} onChange={e => updateQuestion(i, 'text', e.target.value)} className={s.textarea} rows={2} placeholder="e.g. What's your main challenge right now?" />
                                                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', alignItems: 'center' }}>
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}>
                                                        <input type="checkbox" checked={q.required} onChange={e => updateQuestion(i, 'required', e.target.checked)} /> Required
                                                    </label>
                                                    <select value={q.answer_type} onChange={e => updateQuestion(i, 'answer_type', e.target.value)} className={s.input} style={{ width: 'auto', padding: '0.3rem 0.5rem' }}>
                                                        <option value="text">Single Line</option>
                                                        <option value="textarea">Multiple Lines</option>
                                                        <option value="select">Dropdown</option>
                                                    </select>
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', marginLeft: 'auto' }}>
                                                        <input type="checkbox" checked={q.status} onChange={e => updateQuestion(i, 'status', e.target.checked)} /> On
                                                    </label>
                                                </div>
                                            </div>
                                        ))}
                                        <button type="button" onClick={addQuestion} className={s.btnOutline} style={{ marginTop: '0.5rem' }}>
                                            + Add new question
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ─── 6. PAYMENT ─── */}
                        <div className={s.accordionItem}>
                            <button type="button" className={s.accordionTrigger} onClick={() => toggle('payment')}>
                                <span>Payment</span><Chevron open={openSection === 'payment'} />
                            </button>
                            {openSection === 'payment' && (
                                <div className={s.accordionContent}>
                                    <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.75rem' }}>Collect payment for your event. Set to 0 for free events.</p>
                                    <div className={s.inputGroup}>
                                        <label className={s.label}>Price (EGP)</label>
                                        <input type="number" step="0.01" name="price" required defaultValue={editing.price || 0} className={s.input} />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ─── 7. NOTIFICATIONS ─── */}
                        <div className={s.accordionItem}>
                            <button type="button" className={s.accordionTrigger} onClick={() => toggle('notifications')}>
                                <span>Notifications &amp; workflows</span><Chevron open={openSection === 'notifications'} />
                            </button>
                            {openSection === 'notifications' && (
                                <div className={s.accordionContent}>
                                    <div style={{ background: 'rgba(0,105,255,0.06)', border: '1px solid rgba(0,105,255,0.15)', borderRadius: 8, padding: '0.75rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span>✉️</span>
                                        <div>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>Calendar invitation</div>
                                            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)' }}>Immediately after booking • Always on</div>
                                        </div>
                                    </div>
                                    <div className={s.inputGroup}>
                                        <label className={s.label}>Email reminder</label>
                                        <select name="email_reminder_hours" defaultValue={editing.email_reminder_hours ?? ''} className={s.input}>
                                            <option value="">Off</option>
                                            <option value="1">1 hour before</option>
                                            <option value="4">4 hours before</option>
                                            <option value="24">24 hours before</option>
                                        </select>
                                    </div>
                                    <div className={s.inputGroup}>
                                        <label className={s.label}>Email follow-up</label>
                                        <select name="email_followup_hours" defaultValue={editing.email_followup_hours ?? ''} className={s.input}>
                                            <option value="">Off</option>
                                            <option value="24">24 hours after</option>
                                            <option value="48">48 hours after</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ─── 8. CONFIRMATION ─── */}
                        <div className={s.accordionItem}>
                            <button type="button" className={s.accordionTrigger} onClick={() => toggle('confirmation')}>
                                <span>Confirmation page</span><Chevron open={openSection === 'confirmation'} />
                            </button>
                            {openSection === 'confirmation' && (
                                <div className={s.accordionContent}>
                                    <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.75rem' }}>After booking, display a confirmation page or redirect.</p>
                                    <div className={s.inputGroup}>
                                        <label className={s.label}>Redirect URL (leave empty for default confirmation)</label>
                                        <input name="confirmation_redirect" defaultValue={editing.confirmation_redirect || ''} className={s.input} placeholder="https://example.com/thank-you" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ─── FOOTER ─── */}
                    <div className={s.editFooter}>
                        {!isNew ? <button type="button" onClick={() => del(editing.id)} disabled={isPending} className={s.btnDanger}>Delete</button> : <div />}
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button type="button" onClick={() => setEditing(null)} className={s.btnOutline}>Cancel</button>
                            <button type="submit" disabled={isPending} className={s.btnPrimary}>{isPending ? 'Saving…' : 'Save changes'}</button>
                        </div>
                    </div>
                </form>
            </div>
        );
    }

    /* ======== LIST VIEW ======== */
    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.25rem' }}>
                <button onClick={() => startEdit({ id: 'new', duration_minutes: 30, price: 0, is_active: true, color: '#9b51e0', buffer_before: 0, buffer_after: 0, min_notice_hours: 4, max_future_days: 60, start_time_increment: 30, timezone_display: 'auto', allow_guests: false, invitee_questions: [], communication_methods: ['google_meet'] })} className={s.btnPrimary}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
                    New Event Type
                </button>
            </div>
            <div className={s.eventGrid}>
                {eventTypes.length > 0 ? eventTypes.map((ev) => (
                    <div key={ev.id} className={s.eventCard} style={{ opacity: ev.is_active === false ? 0.5 : 1 }}>
                        <div className={s.eventStrip} style={{ background: ev.color || '#9b51e0' }} />
                        <div className={s.eventBody}>
                            <div className={s.eventActions}>
                                <button className={s.menuBtn} onClick={() => startEdit(ev)} title="Edit">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" /></svg>
                                </button>
                            </div>
                            <div className={s.eventTitle}>{ev.title}</div>
                            <div className={s.eventDesc}>{ev.description || 'No description'}</div>
                            <div className={s.eventMeta}>
                                <span>{ev.duration_minutes ?? 30} min</span>
                                <span>{ev.is_active === false ? 'Inactive' : 'One-on-One'}</span>
                                <span style={{ marginLeft: 'auto' }}>{(ev.price ?? 0) > 0 ? `${Number(ev.price ?? 0).toLocaleString('ar-EG')} EGP` : 'Free'}</span>
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className={s.emptyState}>No event types yet. Click &quot;New Event Type&quot; to get started.</div>
                )}
            </div>
        </div>
    );
}
