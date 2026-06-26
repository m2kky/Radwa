import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import GuidesCatalog from '@/components/guides/guides-catalog'
import type { Guide } from '@/types'

export const metadata: Metadata = {
  title: 'Guides & Templates | رضوى محمد',
  description: 'مكتبة تحميلات مجانية تضم أدلة وقوالب عملية في التسويق والاستراتيجية.',
}

export const revalidate = 60

export default async function GuidesPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('guides')
    .select('*')
    .eq('status', 'published')
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })

  const guides = (data ?? []) as Guide[]

  return (
    <main className="min-h-screen bg-background pt-24">
      <section className="relative min-h-[58vh] overflow-hidden border-b border-border">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/portfolio_hero.png"
          alt="Guides and Templates"
          className="absolute inset-0 h-full w-full object-cover object-top opacity-55"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/20" />
        <div className="relative z-10 flex min-h-[58vh] items-end">
          <div className="container mx-auto px-4 pb-14 md:pb-20">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              Guides & Templates
            </p>
            <h1 className="max-w-3xl text-4xl font-serif font-bold leading-tight text-foreground md:text-6xl">
              موارد جاهزة تساعدك تتحرك أسرع.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">
              أدلة، جداول، وقوالب عملية للتحميل المباشر بدون دفع أو خطوات إضافية.
            </p>
          </div>
        </div>
      </section>

      <GuidesCatalog guides={guides} />
    </main>
  )
}
