import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ServiceCard from '@/components/services/service-card'
import type { Service } from '@/types'

export const metadata: Metadata = {
  title: 'الخدمات | رضوى محمد',
  description: 'خدمات استراتيجية وتسويقية قابلة للحجز أو طلب التفاصيل مباشرة.',
}

export const revalidate = 60

export default async function ServicesPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('services')
    .select('*')
    .eq('status', 'published')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  const services = (data ?? []) as Service[]

  return (
    <main className="min-h-screen bg-background pt-24">
      <section className="relative min-h-[62vh] overflow-hidden border-b border-border">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/hero_bg.webp"
          alt="Services"
          className="absolute inset-0 h-full w-full object-cover opacity-55"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/20" />
        <div className="relative z-10 flex min-h-[62vh] items-end">
          <div className="container mx-auto px-4 pb-14 md:pb-20">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              Services
            </p>
            <h1 className="max-w-3xl text-4xl font-serif font-bold leading-tight text-foreground md:text-6xl">
              خدمات عملية تتحول لخطة تنفيذ واضحة.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">
              اختار الخدمة الأقرب لاحتياجك، واحجز أو ابعت تفاصيل مشروعك مباشرة.
            </p>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 md:py-20">
        {services.length > 0 ? (
          <div>
            {services.map((service, index) => (
              <ServiceCard key={service.id} service={service} index={index} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-cold-dark p-8 text-center text-muted-foreground">
            لا توجد خدمات منشورة حالياً.
          </div>
        )}
      </section>

      <section className="border-t border-border">
        <div className="container mx-auto flex flex-col items-start justify-between gap-5 px-4 py-12 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-serif font-bold text-foreground">مش متأكد تبدأ منين؟</h2>
            <p className="mt-2 text-sm text-muted-foreground">احجز جلسة قصيرة ونحدد أنسب مسار.</p>
          </div>
          <Link href="/book" className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90">
            احجز جلسة
          </Link>
        </div>
      </section>
    </main>
  )
}
