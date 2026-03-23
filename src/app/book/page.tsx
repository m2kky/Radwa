import { createAdminClient } from '@/lib/supabase/server';
import { getBookingProfile } from '../admin/booking-profile/actions';
import Image from 'next/image';
import Link from 'next/link';
import FAQSection from '@/components/features/faq-section';
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

    const faqItems = [
        {
            question: 'هل الحجز يتم بالدفع المسبق؟',
            answer: 'يعتمد على نوع الجلسة. بعض الجلسات مجانية والبعض يتطلب الدفع قبل التأكيد.',
        },
        {
            question: 'هل أقدر أغيّر الموعد بعد الحجز؟',
            answer: 'نعم، يمكنك التواصل عبر البريد أو الواتساب الموضح بالموقع لتعديل الموعد حسب المتاح.',
        },
        {
            question: 'هل الجلسة أونلاين ولا حضوري؟',
            answer: 'نوع التواصل يحدده نوع الجلسة (Google Meet أو مكالمة أو حضوري).',
        },
    ];

    const faqJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqItems.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: item.answer,
            },
        })),
    };

    return (
        <div>
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
                                <div style={{ marginTop: '0.35rem', fontSize: '0.78rem', color: 'rgba(255,255,255,0.65)' }}>
                                    {Number(ev.price ?? 0) > 0
                                        ? `${Number(ev.price).toLocaleString('ar-EG')} EGP`
                                        : 'مجاني'}
                                </div>
                            </div>
                        </Link>
                    ))
                    ) : (
                        <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>No events available at the moment.</p>
                    )}
                </div>
            </div>
            <FAQSection
                title="أسئلة شائعة عن الحجز"
                subtitle="معلومات مهمة قبل اختيار موعد الاستشارة."
                items={faqItems}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
            />
        </div>
    );
}
