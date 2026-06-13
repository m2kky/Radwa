import { createClient } from '@/lib/supabase/server'
import PortfolioGrid from '@/components/portfolio/portfolio-grid'
import { Target, Grid, CheckSquare, BarChart3 } from 'lucide-react'

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

  const caseStudies = items?.filter(i => i.item_type === 'case_study') || []
  const projects = items?.filter(i => i.item_type === 'project') || []

  return (
    <main className="min-h-screen bg-cold-black text-ice-white pb-24">
      {/* Full Screen Hero Section */}
      <div className="relative w-full h-[90vh] sm:h-[120vh] flex items-center justify-center overflow-hidden mb-16 sm:mb-24">
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 space-y-32">
        
        {/* Methodology Section */}
        <section>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-serif font-bold mb-4">كيف أعمل؟</h2>
            <p className="text-ice-white/60 max-w-2xl mx-auto text-lg">منهجية علمية وعملية تبدأ بالفهم العميق وتنتهي بنتائج يمكن قياسها.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Target, title: 'الاستكشاف والتحليل', desc: 'فهم السوق، المنافسين، والجمهور المستهدف بدقة.' },
              { icon: Grid, title: 'رسم الاستراتيجية', desc: 'بناء خطة تسويقية متكاملة تتناسب مع أهداف البزنس.' },
              { icon: CheckSquare, title: 'التنفيذ والإطلاق', desc: 'إدارة الحملات وصناعة المحتوى بأعلى معايير الجودة.' },
              { icon: BarChart3, title: 'القياس والتحسين', desc: 'تحليل الأرقام بشكل دوري لتحسين الأداء ومضاعفة العوائد.' },
            ].map((step, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-colors">
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-6">
                  <step.icon size={28} />
                </div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-ice-white/70 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Case Studies Section */}
        <section>
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <h2 className="text-3xl md:text-5xl font-serif font-bold mb-4">دراسات الحالة</h2>
              <p className="text-ice-white/60 text-lg">تحليل متعمق للتحديات، الحلول، والأرقام التي حققناها.</p>
            </div>
          </div>
          <PortfolioGrid items={caseStudies} />
        </section>

        {/* Quote Section */}
        <section className="relative rounded-3xl overflow-hidden border border-white/10">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/40 to-emerald-900/10" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
          <div className="relative z-10 px-8 py-20 md:py-24 flex flex-col md:flex-row items-center justify-center gap-12 max-w-5xl mx-auto">
            <div className="w-48 h-48 md:w-56 md:h-56 rounded-full overflow-hidden border-4 border-cyan-500/20 shrink-0 shadow-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/radwa1.png" alt="رضوى محمد" className="w-full h-full object-cover" />
            </div>
            <div className="text-center md:text-right">
              <h3 className="text-2xl md:text-3xl lg:text-4xl font-serif italic text-ice-white/90 leading-relaxed">
                "التسويق ليس مجرد إعلانات، بل هو فن تحويل الأرقام إلى قصص نجاح مستدامة تبني علاقة حقيقية مع جمهورك."
              </h3>
              <p className="mt-8 text-cyan-300 font-semibold text-xl">- رضوى محمد</p>
            </div>
          </div>
        </section>

        {/* Projects Grid Section */}
        <section>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-serif font-bold mb-4">المشاريع البارزة</h2>
            <p className="text-ice-white/60 text-lg">مجموعة من الأعمال والمشاريع التي نفذتها مؤخراً.</p>
          </div>
          <PortfolioGrid items={projects} />
        </section>

      </div>
    </main>
  )
}
