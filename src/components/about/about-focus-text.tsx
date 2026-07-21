/**
 * About Focus Text Component
 *
 * Scroll-driven blur/focus statement.
 *
 * @phase Phase 4: Public Pages
 * @author Agent (Antigravity)
 * @created 2026-02-15
 */
'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

const statement =
  'أنا لا أؤمن بالحظ، بل بالدقة والتخطيط. أفهم السلوك الإنساني، وأمزج البيانات بالإبداع لأحوّل الضوضاء إلى وضوح، والاهتمام إلى نمو حقيقي ومستدام.'

export function AboutFocusText() {
  const ref = useRef<HTMLParagraphElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const blurValue = useTransform(scrollYProgress, [0, 0.4, 0.6, 1], [8, 0, 0, 8])
  const opacity = useTransform(scrollYProgress, [0, 0.4, 0.6, 1], [0.3, 1, 1, 0.3])
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.95, 1, 0.95])

  return (
    <section className="relative w-full px-6 py-28 md:py-40">
      <motion.p
        ref={ref}
        style={{ filter: useTransform(blurValue, (value) => `blur(${value}px)`), opacity, scale }}
        className="mx-auto max-w-4xl select-none text-center font-serif text-2xl font-medium leading-relaxed text-ice-white md:text-4xl"
      >
        {statement}
      </motion.p>
    </section>
  )
}
