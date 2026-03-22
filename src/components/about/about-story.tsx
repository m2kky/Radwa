/**
 * About Story Component
 *
 * Vertical timeline with alternating milestone cards and scroll-driven animations.
 *
 * @phase Phase 4: Public Pages
 * @author Agent (Antigravity)
 * @created 2026-02-15
 */
'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

const milestones = [
  { year: '2018', title: 'نقطة الانطلاق', desc: 'كانت الانطلاقة في عالم التسويق الرقمي، حيث أتقنت أسرار تحسين محركات البحث (SEO)، وإدارة الحملات الإعلانية، وبناء استراتيجيات المحتوى وسط تحديات العمل المتسارعة في الوكالات التسويقية.' },
  { year: '2020', title: 'توجيه الدفة', desc: 'خضت أولى تجاربي القيادية بإدارة فريق متنوع يضم نخبة من المصممين وكتّاب المحتوى، لنعمل معاً على إطلاق حملات تسويقية ذات أثر ملموس.' },
  { year: '2022', title: 'الرؤية الشاملة', desc: 'أدركت مبكراً أن الإعلانات الجذابة تفقد قيمتها دون أساس قوي؛ لذا وجهت بوصلتي نحو بناء استراتيجيات شاملة للعلامات التجارية ترتكز على أهداف أعمال واضحة ومحددة.' },
  { year: '2024', title: 'توسيع الآفاق', desc: 'بدأت مسيرتي كمستشارة مستقلة، وعقدت شراكات استراتيجية مع شركات ناشئة واعدة وعلامات تجارية كبرى في منطقة الشرق الأوسط وشمال أفريقيا وما وراءها.' },
]

export function AboutStory() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start end', 'end center'] })
  const scale = useTransform(scrollYProgress, [0, 1], [2.2, 10.5])
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.9, 1, 2])
  const color = useTransform(scrollYProgress, [0, 0.5, 1], ['rgba(255,255,255,0.1)', '#c3d3ee', 'rgba(255,255,255,0.1)'])

  return (
    <section className="py-32 bg-cold-black relative overflow-hidden">
      <div className="container md:px-12 mx-auto relative z-10 px-6">
        <div ref={containerRef} className="mb-32 flex flex-col items-center text-center">
          <motion.span
            style={{ scale, opacity, color }}
            className="text-cyan-glow uppercase tracking-[0.5em] text-xs font-bold mb-6 block"
          >
            مراحل النمو
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            viewport={{ once: true }}
            className="text-5xl md:text-8xl font-serif text-transparent bg-clip-text bg-gradient-to-b from-ice-white to-ice-white/50 font-bold uppercase tracking-tighter"
          >
            رحلتي عبر الزمن
          </motion.h2>
        </div>

        <div className="relative max-w-4xl mx-auto">
          <div className="absolute left-[20px] md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-cyan-glow/30 to-transparent md:-translate-x-1/2" />

          <div className="space-y-32 relative">
            {milestones.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 100 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-10%' }}
                transition={{ duration: 0.8 }}
                className={`flex flex-col md:flex-row gap-8 md:gap-24 items-start relative group ${i % 2 === 0 ? 'md:flex-row-reverse' : ''}`}
              >
                <div className="w-[120px] md:w-1/2 flex md:justify-end">
                  <div className="relative">
                    <span className="text-6xl md:text-8xl font-bold font-serif text-white/5 group-hover:text-cyan-glow/20 transition-colors duration-500 block leading-none">
                      {item.year}
                    </span>
                    <div className="absolute top-1/2 -right-[50px] w-3 h-3 bg-cyan-glow rounded-full shadow-[0_0_20px_rgba(34,211,238,0.8)] z-20 -translate-y-1/2 hidden md:block" />
                  </div>
                </div>

                <div className="flex-1 md:w-1/2 pl-12 md:pl-0 pt-4">
                  <h3 className="text-3xl font-bold text-ice-white mb-4 group-hover:text-cyan-glow transition-colors duration-300">
                    {item.title}
                  </h3>
                  <p className="text-ice-white/70 text-lg leading-relaxed border-l border-white/10 pl-6 group-hover:border-cyan-glow/50 transition-colors duration-500">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
