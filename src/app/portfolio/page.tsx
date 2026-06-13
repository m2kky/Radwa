import { createClient } from '@/lib/supabase/server'
import PortfolioGrid from '@/components/portfolio/portfolio-grid'

export const metadata = {
  title: 'أعمالي ودراسات الحالة | رضوى محمد',
  description: 'معرض يضم أبرز المشاريع التسويقية ودراسات الحالة التي قمت بتنفيذها.',
}

// Revalidate page every 60 seconds (ISR)
export const revalidate = 60

export default async function PortfolioPage() {
  const supabase = await createClient()

  // Fetch published portfolio items
  const { data: items } = await supabase
    .from('portfolio_items')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen bg-cold-black text-ice-white pb-24">
      {/* Full Screen Hero Section */}
      <div className="relative w-full h-[70vh] sm:h-[90vh] flex items-center justify-center overflow-hidden mb-16 sm:mb-24">
        {/* Background Image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/portfolio_hero.png"
          alt="رضوى محمد - معرض الأعمال"
          className="absolute inset-0 w-full h-full object-cover object-top opacity-80"
        />

        {/* Strong Fade Gradients */}
        <div className="absolute inset-0 bg-gradient-to-b from-cold-black/40 via-transparent to-cold-black pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-cold-black via-cold-black/80 to-transparent pointer-events-none" />

        {/* Hero Content Over Image */}
        <div className="relative z-10 px-4 sm:px-6 max-w-5xl mx-auto text-center translate-y-12 sm:translate-y-24">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold tracking-tight text-ice-white drop-shadow-2xl">
            قصص نجاح <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">تُصاغ بلغة الأرقام</span>
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">

        {/* Bento Grid Gallery */}
        <PortfolioGrid items={items || []} />

      </div>
    </main>
  )
}
