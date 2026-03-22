'use client';

import { useTransition, useState } from 'react';
import { updateBookingProfile, BookingProfile } from './actions';
import s from '../Scheduling.module.css';

const TIMEZONES = ['Africa/Cairo', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Dubai', 'Asia/Kolkata', 'Asia/Tokyo', 'Australia/Sydney'];
const DATE_FORMATS = ['MMM d, yyyy', 'dd/MM/yyyy', 'MM/dd/yyyy', 'yyyy-MM-dd', 'd MMMM yyyy'];

export default function ProfileForm({ profile }: { profile: BookingProfile }) {
    const [isPending, startTransition] = useTransition();
    const [saved, setSaved] = useState(false);

    const save = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSaved(false);
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
            const r = await updateBookingProfile(fd);
            if (r.error) alert(r.error);
            else setSaved(true);
        });
    };

    return (
        <form onSubmit={save}>
            <div className={s.accordion}>
                {/* Personal Info */}
                <div className={s.accordionItem}>
                    <div className={s.accordionTrigger} style={{ cursor: 'default' }}>
                        <span>Personal Information</span>
                    </div>
                    <div className={s.accordionContent}>
                        <div className={s.inputGroup}>
                            <label className={s.label}>Display Name</label>
                            <input name="name" defaultValue={profile.name} className={s.input} placeholder="Your name" />
                        </div>
                        <div className={s.inputGroup}>
                            <label className={s.label}>Welcome Message / Bio</label>
                            <textarea name="welcome_message" defaultValue={profile.welcome_message} className={s.textarea} rows={3} placeholder="Tell invitees about yourself..." />
                        </div>
                        <div className={s.inputGroup}>
                            <label className={s.label}>Avatar URL</label>
                            <input name="avatar_url" defaultValue={profile.avatar_url} className={s.input} placeholder="/avatar.jpg or https://..." />
                            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', marginTop: '0.25rem' }}>
                                Place your photo in <code>public/avatar.jpg</code> or use a full URL
                            </div>
                        </div>
                    </div>
                </div>

                {/* Regional */}
                <div className={s.accordionItem}>
                    <div className={s.accordionTrigger} style={{ cursor: 'default' }}>
                        <span>Regional Settings</span>
                    </div>
                    <div className={s.accordionContent}>
                        <div className={s.twoCol}>
                            <div className={s.inputGroup}>
                                <label className={s.label}>Language</label>
                                <select name="language" defaultValue={profile.language} className={s.input}>
                                    <option value="en">English</option>
                                    <option value="ar">العربية</option>
                                    <option value="fr">Français</option>
                                    <option value="de">Deutsch</option>
                                    <option value="es">Español</option>
                                </select>
                            </div>
                            <div className={s.inputGroup}>
                                <label className={s.label}>Time Zone</label>
                                <select name="timezone" defaultValue={profile.timezone} className={s.input}>
                                    {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className={s.twoCol}>
                            <div className={s.inputGroup}>
                                <label className={s.label}>Date Format</label>
                                <select name="date_format" defaultValue={profile.date_format} className={s.input}>
                                    {DATE_FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
                                </select>
                            </div>
                            <div className={s.inputGroup}>
                                <label className={s.label}>Time Format</label>
                                <select name="time_format" defaultValue={profile.time_format} className={s.input}>
                                    <option value="12h">12-hour (1:00 PM)</option>
                                    <option value="24h">24-hour (13:00)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className={s.editFooter}>
                {saved && <span style={{ color: '#22c55e', fontSize: '0.85rem' }}>✓ Saved successfully</span>}
                <div style={{ marginLeft: 'auto' }}>
                    <button type="submit" disabled={isPending} className={s.btnPrimary}>
                        {isPending ? 'Saving…' : 'Save Profile'}
                    </button>
                </div>
            </div>
        </form>
    );
}
