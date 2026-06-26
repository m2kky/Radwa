import { createClient } from '@/lib/supabase/server'
import { getSiteContentSettings } from '@/lib/site-content-server'
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

  // Fetch dynamic sections for Hero and Quote
  const settings = await getSiteContentSettings()
  const hero = settings.portfolioHero
  const quote = settings.portfolioQuote

  return (
    <main className="min-h-screen bg-cold-black text-ice-white pb-24 overflow-x-hidden">
      {/* Full Screen Hero Section */}
      <div className="relative w-full h-[90vh] sm:h-[120vh] flex items-center justify-center overflow-hidden mb-16 sm:mb-24">
        {/* Background Image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={hero.image_url}
          alt={hero.title}
          className="absolute inset-0 w-full h-full object-cover object-top opacity-80"
        />

        {/* Strong Fade Gradients */}
        <div className="absolute inset-0 bg-gradient-to-b from-cold-black/40 via-transparent to-cold-black pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-cold-black via-cold-black/80 to-transparent pointer-events-none" />

        {/* Hero Content Over Image */}
        <div className="relative z-10 px-4 sm:px-6 max-w-5xl mx-auto text-center translate-y-12 sm:translate-y-24">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold tracking-tight text-ice-white drop-shadow-2xl">
            {hero.title} <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">{hero.highlight_text}</span>
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

        {/* Projects Grid Section */}
        <section>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-serif font-bold mb-4">المشاريع البارزة</h2>
            <p className="text-ice-white/60 text-lg">مجموعة من الأعمال والمشاريع التي نفذتها مؤخراً.</p>
          </div>
          <PortfolioGrid items={projects} />
        </section>
      </div>

      {/* Quote Section (Emerald Aura Gradient, Flexbox Layout) */}
      <section className="relative w-full min-h-screen flex items-center bg-gradient-to-br from-cold-black via-emerald-950/30 to-cold-black mt-24 py-16 md:py-24 overflow-hidden">
        {/* Abstract Emerald Glow */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full z-0 pointer-events-none" />

        <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 lg:gap-12">
            
            {/* Person Image (Right side on Desktop due to RTL, Top on Mobile) */}
            <div className="w-full md:w-1/2 flex justify-center md:justify-end translate-y-12 sm:translate-y-16 md:translate-y-24">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={quote.image_url} 
                alt="رضوى محمد" 
                className="h-[75vh] md:h-auto w-auto md:w-full max-w-none md:max-w-lg lg:max-w-xl object-contain scale-110 md:scale-105 lg:scale-110 origin-bottom"
              />
            </div>
            
            {/* Quote Card (Left side on Desktop due to RTL, Below Image on Mobile) */}
            <div className="w-full md:w-1/2 flex justify-center md:justify-start -mt-24 sm:-mt-32 md:mt-0">
              <div className="relative w-full max-w-lg lg:max-w-xl z-20 md:-translate-x-8">
                {/* Huge Quote Icon */}
                <div className="absolute -top-10 -right-2 md:-top-16 md:-right-8 text-[8rem] md:text-[10rem] text-emerald-500 font-serif leading-none z-0 drop-shadow-sm select-none opacity-90">
                  &rdquo;
                </div>
                
                {/* Glassmorphism Dark Card - Ultra Frosted */}
                <div className="relative z-10 bg-white/5 backdrop-blur-[100px] border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl">
                  <h3 className="text-xl md:text-3xl lg:text-4xl font-serif leading-relaxed md:leading-[1.8] text-ice-white font-medium">
                    {quote.quote_text}
                  </h3>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 mt-32 space-y-32">
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

      </div>
    </main>
  )
}
