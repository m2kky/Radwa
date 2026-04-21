import { createClient } from '@/lib/supabase/server'
import { getBookingProfile } from '../admin/booking-profile/actions'
import Image from 'next/image'
import Link from 'next/link'
import FAQSection from '@/components/features/faq-section'
import s from './Booking.module.css'

export const metadata = { title: 'احجزي جلسة' }

export default async function BookPage() {
  const supabase = await createClient()
  const profile = await getBookingProfile()
  const { data: eventTypes } = await supabase
    .from('event_types')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  const faqItems = [
    {
      question: 'هل الحجز يتم بالدفع المسبق؟',
      answer: 'يعتمد على نوع الجلسة. بعض الجلسات مجانية، وبعضها يتطلب الدفع قبل تأكيد الموعد.',
    },
    {
      question: 'هل أقدر أغيّر الموعد بعد الحجز؟',
      answer: 'نعم، يمكنك التواصل عبر البريد أو الواتساب الظاهر في الموقع لتعديل الموعد حسب التوافر.',
    },
    {
      question: 'هل الجلسة أونلاين أم حضوري؟',
      answer: 'نوع التواصل يحدده نوع الجلسة نفسها: Google Meet أو مكالمة هاتفية أو حضوري.',
    },
  ]

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
  }

  return (
    <div>
      <div className={s.pageWrap}>
        <div className={s.listingShell}>
          <div className={s.listingIntro}>
            <span className={s.listingEyebrow}>Book a Session</span>
            <h1 className={s.listingTitle}>احجزي جلستك الاستشارية</h1>
            <p className={s.listingSub}>
              اختاري نوع الجلسة المناسب، حددي الموعد، وابدئي بخطة عملية واضحة تناسب وضعك الحالي.
            </p>
          </div>

          <div className={s.listingGrid}>
            <div className={s.listingCard}>
              <Image
                src={profile.avatar_url}
                alt={profile.name}
                width={84}
                height={84}
                className={s.profilePhoto}
              />
              <div className={s.profileName}>{profile.name}</div>
              <p className={s.profileBio}>{profile.welcome_message}</p>
              <div className={s.divider} />

              {eventTypes && eventTypes.length > 0 ? (
                eventTypes.map((eventType) => (
                  <Link
                    key={eventType.id}
                    href={`/book/${eventType.slug}`}
                    className={s.eventItem}
                  >
                    <div
                      className={s.eventDot}
                      style={{ background: eventType.color || '#facc15' }}
                    />
                    <div className={s.eventItemBody}>
                      <div className={s.eventItemTitle}>
                        {eventType.title}
                        <span className={s.eventItemArrow}>▶</span>
                      </div>
                      <div className={s.eventItemDesc}>
                        {eventType.description
                          ? `"${eventType.description.substring(0, 150)}${
                              eventType.description.length > 150 ? '...' : ''
                            }"`
                          : 'جلسة عملية موجهة حسب احتياجك الحالي.'}
                      </div>

                      <div className={s.eventMetaRow}>
                        <span className={s.eventChip}>
                          {eventType.duration_minutes || 30} دقيقة
                        </span>
                        <span className={s.eventPrice}>
                          {Number(eventType.price || 0) > 0
                            ? `${Number(eventType.price).toLocaleString('ar-EG')} EGP`
                            : 'مجاني'}
                        </span>
                        <span className={s.eventCta}>اختيار الموعد</span>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <p className={s.profileBio}>لا توجد جلسات متاحة حاليًا.</p>
              )}
            </div>

            <aside className={s.listingAside}>
              <div className={s.asideCard}>
                <span className={s.asideBadge}>01</span>
                <h3 className={s.asideTitle}>تجربة حجز سريعة</h3>
                <p className={s.asideText}>
                  اختاري التاريخ والوقت المتاحين في ثواني، بدون تعقيد.
                </p>
              </div>
              <div className={s.asideCard}>
                <span className={s.asideBadge}>02</span>
                <h3 className={s.asideTitle}>تأكيد تلقائي</h3>
                <p className={s.asideText}>
                  بعد تأكيد الحجز، توصلك رسالة على البريد مع كل تفاصيل الموعد.
                </p>
              </div>
              <div className={s.asideCard}>
                <span className={s.asideBadge}>03</span>
                <h3 className={s.asideTitle}>متابعة قبل الجلسة</h3>
                <p className={s.asideText}>
                  بنبعت reminders قبل الموعد لضمان حضور سلس وتجهيز أفضل.
                </p>
              </div>
            </aside>
          </div>
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
  )
}
