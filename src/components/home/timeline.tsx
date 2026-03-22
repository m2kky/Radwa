/**
 * Timeline Section
 *
 * Horizontal scroll career timeline — RTL aware.
 * Intro card appears first (right side), cards scroll to the left.
 *
 * @phase Phase 4: Public Pages
 * @author Agent (Antigravity)
 * @created 2026-02-15
 * @updated 2026-02-15
 */
'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform, useSpring } from 'framer-motion'
import {
  defaultHomeTimeline,
  type HomeTimelineContent,
} from '@/lib/site-content'

export default function Timeline({ content }: { content?: HomeTimelineContent }) {
  const timelineContent = content ?? defaultHomeTimeline
  const targetRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: targetRef })
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 })

  // RTL: positive x moves content right, revealing cards from right→left
  const x = useTransform(smoothProgress, [0, 0.85], ['0%', '85%'])

  return (
    <section ref={targetRef} className="relative h-[350vh]">
      <div className="sticky top-0 h-screen flex items-center overflow-hidden">
        <motion.div style={{ x }} className="flex gap-5 md:gap-10 px-5 md:px-20 items-center">

          {/* Intro card — first in DOM = rightmost in flex-row-reverse = visible on load */}
          <div className="min-w-[280px] md:min-w-[400px] h-[380px] md:h-[450px] flex flex-col justify-center text-ice-white pr-12 shrink-0">
            <h2 className="text-3xl md:text-6xl font-serif font-bold mb-4 md:mb-6 leading-tight">
              {timelineContent.intro_title}
            </h2>
            <p className="text-base md:text-xl max-w-md opacity-80 border-r-2 border-cyan-glow/30 pr-6 py-2">
              {timelineContent.intro_description}
            </p>
            <div className="mt-6 text-xs opacity-50 uppercase tracking-widest flex items-center gap-2">
              <span className="w-4 h-px bg-cyan-glow" />
              {timelineContent.browse_label}
              <span className="w-4 h-px bg-cyan-glow" />
            </div>
          </div>

          {/* Cards — after intro card in DOM = scroll left to reveal */}
          {timelineContent.items.map((item, index) => (
            <div key={item.id}
              className="relative flex-shrink-0 w-full max-w-md min-w-[340px] md:min-w-[380px] h-[340px] md:h-[480px] p-6 md:p-10 rounded-2xl md:rounded-3xl flex flex-col justify-between bg-cold-dark/50 backdrop-blur-md border border-white/10 hover:border-cyan-glow/30 hover:scale-[1.02] transition-all duration-300 shadow-xl"
            >
              <div>
                <span className={`text-xs md:text-sm font-bold uppercase tracking-wider opacity-70 ${item.accent}`}>
                  {item.period}
                </span>
                <h3 className="text-xl md:text-3xl font-serif font-bold mt-2 md:mt-4 mb-1 text-ice-white">
                  {item.company}
                </h3>
                <h4 className="text-sm md:text-lg font-medium text-ice-white/90 mb-4">{item.role}</h4>
                <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">{item.description}</p>
              </div>
              <div>
                <div className="text-3xl md:text-5xl font-bold opacity-10 text-ice-white">
                  {String(index + 1).padStart(2, '0')}
                </div>
                <div className="mt-2 md:mt-4 pt-2 md:pt-4 border-t border-white/10">
                  <p className={`text-xs md:text-sm font-semibold ${item.accent}`}>الأثر الملموس</p>
                  <p className="text-lg md:text-2xl font-bold mt-1 text-ice-white">{item.metric}</p>
                </div>
              </div>
            </div>
          ))}

        </motion.div>
      </div>
    </section>
  )
}
