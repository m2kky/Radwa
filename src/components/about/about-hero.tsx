/**
 * About Hero Component
 *
 * Fullscreen hero with parallax scroll + letter stagger animation.
 *
 * @phase Phase 4: Public Pages
 * @author Agent (Antigravity)
 * @created 2026-02-15
 */
'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowDown } from 'lucide-react'

function WordStagger({ text, delay = 0 }: { text: string; delay?: number }) {
  const words = text.split('_')
  return (
    <span className="inline-flex gap-4 whitespace-nowrap">
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1.2, delay: delay + i * 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="inline-block origin-bottom"
        >
          {word}
        </motion.span>
      ))}
    </span>
  )
}

export function AboutHero() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%'])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  return (
    <section ref={containerRef} className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-cold-black">
      <div className="absolute inset-0 bg-cover bg-center opacity-60 mix-blend-overlay" style={{ backgroundImage: "url('/hero_bg.webp')" }} />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#020617]/60 pointer-events-none" />
      <div className="absolute inset-0 bg-cyan-900/10 mix-blend-color-dodge pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      <motion.div style={{ y, opacity }} className="relative z-10 container px-6 mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-glow/20 bg-cyan-glow/5 backdrop-blur-sm"
        >
          <span className="text-xs font-mono text-cyan-glow tracking-[0.2em] uppercase">المُصممة الاستراتيجية</span>
        </motion.div>

        <h1 className="text-[12vw] md:text-[10vw] leading-[0.85] font-serif font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-ice-white via-ice-white to-ice-white/50 mb-10 select-none">
          <WordStagger text="ما_وراء" delay={0} />
          <br />
          <WordStagger text="المألوف" delay={0.15} />
        </h1>
      </motion.div>

      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-cold-black to-transparent z-10" />

      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-ice-white/50 z-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
      >
        <span className="text-xs uppercase tracking-widest">تصفح لمعرفة المزيد</span>
        <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
          <ArrowDown className="w-5 h-5" />
        </motion.div>
      </motion.div>
    </section>
  )
}
