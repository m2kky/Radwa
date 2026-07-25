import Link from 'next/link'
import {
  ArrowLeft,
  ExternalLink,
  Globe,
  Mail,
  Smartphone,
} from 'lucide-react'
import ContactForm from '@/components/home/contact-form'
import { getSiteContentSettings } from '@/lib/site-content-server'

export const metadata = {
  title: 'تواصل معنا | رضوى محمد',
  description: 'تواصل مع رضوى محمد للاستشارات التسويقية، الخدمات، والأسئلة العامة.',
}

function whatsappUrl(phone: string) {
  const digits = phone.replace(/\D/g, '')
  return digits ? `https://wa.me/${digits}` : ''
}

export default async function ContactPage() {
  const { siteGeneral } = await getSiteContentSettings()
  const whatsappHref = whatsappUrl(siteGeneral.contact_whatsapp)

  const contactItems = [
    {
      label: 'البريد الإلكتروني',
      value: siteGeneral.contact_email,
      href: siteGeneral.contact_email ? `mailto:${siteGeneral.contact_email}` : '',
      icon: Mail,
    },
    {
      label: 'رقم الهاتف',
      value: siteGeneral.contact_phone,
      href: siteGeneral.contact_phone ? `tel:${siteGeneral.contact_phone.replace(/\s/g, '')}` : '',
      icon: Smartphone,
    },
    {
      label: 'واتساب',
      value: siteGeneral.contact_whatsapp,
      href: whatsappHref,
      icon: Smartphone,
    },
    {
      label: 'العنوان',
      value: siteGeneral.contact_address,
      href: siteGeneral.google_maps_url,
      icon: Globe,
    },
  ].filter((item) => item.value)

  const socialLinks = [
    { label: 'Instagram', href: siteGeneral.social_instagram_url, icon: ExternalLink },
    { label: 'Facebook', href: siteGeneral.social_facebook_url, icon: ExternalLink },
    { label: 'LinkedIn', href: siteGeneral.social_linkedin_url, icon: ExternalLink },
    { label: 'TikTok', href: siteGeneral.social_tiktok_url, icon: ExternalLink },
    { label: 'WhatsApp', href: whatsappHref, icon: Smartphone },
  ].filter((item) => item.href)

  return (
    <main className="min-h-screen overflow-hidden bg-cold-black pt-28 text-ice-white">
      <section className="relative px-4 py-20 md:py-28">
        <div className="absolute inset-x-0 top-10 mx-auto h-72 max-w-5xl bg-cyan-glow/10 blur-[120px]" />
        <div className="container relative z-10 mx-auto max-w-7xl">
          <div className="grid gap-10 md:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.9fr)] md:items-end">
            <div>
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.32em] text-cyan-glow">
                Contact
              </p>
              <h1 className="max-w-4xl text-5xl font-black leading-tight md:text-7xl lg:text-8xl">
                خلينا نحول السؤال لخطة واضحة.
              </h1>
            </div>
            <p className="max-w-xl text-lg leading-9 text-ice-white/65">
              ابعت تفاصيل مشروعك، أو استخدم بيانات التواصل المباشر. الرسائل بتتراجع وبيرجعلك رد خلال 24 إلى 48 ساعة.
            </p>
          </div>
        </div>
      </section>

      <section className="container mx-auto grid max-w-7xl gap-5 px-4 pb-16 md:grid-cols-2 lg:grid-cols-4">
        {contactItems.map((item) => (
          <Link
            key={item.label}
            href={item.href || '/contact'}
            target={item.href?.startsWith('http') ? '_blank' : undefined}
            className="group min-h-[180px] rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition-colors hover:border-cyan-glow/40 hover:bg-white/[0.07]"
          >
            <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-glow/10 text-cyan-glow">
              <item.icon size={24} aria-hidden="true" />
            </div>
            <p className="mb-2 text-sm text-ice-white/45">{item.label}</p>
            <p
              className="break-words text-lg font-bold text-ice-white"
              dir={item.label === 'العنوان' ? 'rtl' : 'ltr'}
            >
              {item.value}
            </p>
          </Link>
        ))}
      </section>

      <section className="container mx-auto grid max-w-7xl gap-8 px-4 pb-12 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:items-stretch">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 md:p-10">
          <h2 className="text-3xl font-serif font-bold text-ice-white">تابعيني هنا</h2>
          <p className="mt-3 text-sm leading-7 text-ice-white/60">
            اختار القناة الأنسب لك للتواصل أو متابعة أحدث المحتوى.
          </p>

          {socialLinks.length > 0 ? (
            <div className="mt-8 flex flex-wrap gap-3">
              {socialLinks.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-cold-black px-4 py-2.5 text-sm font-semibold text-ice-white/75 transition-colors hover:border-cyan-glow/50 hover:text-cyan-glow"
                >
                  <item.icon size={17} aria-hidden="true" />
                  {item.label}
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-8 rounded-2xl border border-dashed border-white/10 p-5 text-sm text-ice-white/50">
              روابط السوشيال يمكن إضافتها من إعدادات المحتوى في الداشبورد.
            </p>
          )}
        </div>

        <div className="relative min-h-[340px] overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(250,204,21,0.22),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.08),transparent)]" />
          <div className="relative z-10 flex h-full flex-col justify-between p-8 md:p-10">
            <div>
              <p className="mb-3 text-sm font-bold text-cyan-glow">Google Maps</p>
              <h2 className="text-3xl font-serif font-bold text-ice-white">موقع العمل</h2>
              <p className="mt-3 max-w-lg text-sm leading-7 text-ice-white/60">
                {siteGeneral.contact_address || 'لم يتم تحديد العنوان بعد. يمكن إضافة العنوان ورابط الخريطة من الداشبورد.'}
              </p>
            </div>
            {siteGeneral.google_maps_url ? (
              <Link
                href={siteGeneral.google_maps_url}
                target="_blank"
                rel="noreferrer"
                className="mt-10 inline-flex w-fit items-center gap-3 rounded-full bg-cyan-glow px-6 py-3 text-sm font-black text-cold-black transition-colors hover:bg-cyan-glow/90"
              >
                افتح الخريطة
                <ArrowLeft size={18} aria-hidden="true" />
              </Link>
            ) : (
              <span className="mt-10 inline-flex w-fit rounded-full border border-white/10 px-5 py-3 text-sm text-ice-white/50">
                Placeholder لحين إضافة رابط Google Maps
              </span>
            )}
          </div>
        </div>
      </section>

      <ContactForm
        contactEmail={siteGeneral.contact_email}
        contactPhone={siteGeneral.contact_phone}
      />
    </main>
  )
}
