/**
 * About Philosophy Component
 *
 * Horizontal scroll section with 4 core values cards + animated background text.
 *
 * @phase Phase 4: Public Pages
 * @author Agent (Antigravity)
 * @created 2026-02-15
 */
'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Brain, Heart, Zap, ShieldCheck, type LucideIcon } from 'lucide-react'

const values = [
  { icon: Brain, title: 'البيانات + الحدس', desc: 'أعتمد على البيانات لتوجيه الاستراتيجية، لكني أثق في الحدس لتوجيه الإبداع. السحر يحدث حيث يتقاطعان.' },
  { icon: Zap, title: 'المرونة في التنفيذ', desc: 'في عالم رقمي متسارع، يصبح الجمود أكبر أعداء النمو. لذا أحرص على تصميم أنظمة مرنة قادرة على التكيف اللحظي مع متغيرات السوق.' },
  { icon: Heart, title: 'الإنسان أولاً', desc: 'تذكر دائمًا أن خلف كل نقرة أو تفاعل يقف إنسان حقيقي. أصمم تجارب تلامس المشاعر، لتحويل عملائك إلى سفراء وعشاق لعلامتك التجارية.' },
  { icon: ShieldCheck, title: 'شفافية مطلقة', desc: 'لا مكان للرسوم الخفية أو المصطلحات المعقدة. علاقتي بعملائي قائمة على الوضوح التام والشراكة الحقيقية التي تثمر عن نتائج فعلية.' },
]

function PhilosophyCard({ item, index }: { item: { icon: LucideIcon; title: string; desc: string }; index: number }) {
  return (
    <div className="group relative h-[450px] w-[350px] bg-white/5 border border-white/10 rounded-[2rem] p-8 flex flex-col justify-between overflow-hidden backdrop-blur-xl hover:border-cyan-glow/30 transition-colors duration-500 shrink-0">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-cyan-glow/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative z-10">
        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-cyan-glow mb-8 group-hover:scale-110 group-hover:bg-cyan-glow/20 transition-all duration-500">
          <item.icon className="w-8 h-8" />
        </div>
        <h3 className="text-3xl font-serif text-ice-white font-bold mb-4">{item.title}</h3>
        <p className="text-ice-white/50 text-base leading-relaxed group-hover:text-ice-white/80 transition-colors duration-300">{item.desc}</p>
      </div>
      <span className="text-8xl font-bold text-white/5 absolute -bottom-4 -right-4 font-serif group-hover:text-cyan-glow/10 transition-colors duration-500">
        0{index + 1}
      </span>
    </div>
  )
}

export function AboutPhilosophy() {
  const targetRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: targetRef })
  const x = useTransform(scrollYProgress, [0, 1], ['70%', '-100%'])
  const scale = useTransform(scrollYProgress, [0, 1], [0.2, 1.5])
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.9, 1, 2])
  const color = useTransform(scrollYProgress, [0, 0.5, 1.5], ['rgba(255,255,255,0.1)', '#FACC15', 'rgba(255,255,255,0.1)'])

  return (
    <section ref={targetRef} className="relative h-[300vh] bg-cold-black">
      <div className="sticky top-0 h-screen flex items-center overflow-hidden">
        <motion.div
          style={{ scale, opacity, color }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[20vw] font-bold pointer-events-none select-none font-serif tracking-tighter whitespace-nowrap"
        >
          الفلسفة
        </motion.div>

        <motion.div style={{ x }} className="flex gap-12 px-24">
          <div className="min-w-[400px] flex flex-col justify-center shrink-0">
            <span className="text-cyan-glow uppercase tracking-[0.3em] text-sm font-bold mb-4">القيم الأساسية</span>
            <h2 className="text-6xl md:text-7xl font-serif text-ice-white font-bold leading-none">
              شفرة <br /> النمو
            </h2>
            <p className="mt-8 text-ice-white/60 text-lg max-w-sm">
              أرتكز في عملي على أربع قواعد ذهبية تضمن بناء استراتيجيات قوية، قابلة للتوسع، وتضع الإنسان في جوهر اهتماماتها.
            </p>
          </div>

          {values.map((item, i) => (
            <PhilosophyCard key={i} item={item} index={i} />
          ))}
        </motion.div>
      </div>
    </section>
  )
}
