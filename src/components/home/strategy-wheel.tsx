/**
 * StrategyWheel Section
 *
 * Interactive rotating wheel with 5 strategy pillars — mirrors v1 StrategyWheel.
 *
 * @phase Phase 4 (updated): Public Pages
 * @author Agent (Antigravity)
 * @created 2026-02-15
 */
'use client'

import { useState, useRef } from 'react'
import { motion, useInView, AnimatePresence, useMotionValue, useAnimationFrame, useTransform } from 'framer-motion'
import { Target, CheckSquare, BarChart3, Grid, Users } from 'lucide-react'

const segments = [
  { id: 1, title: 'تصميم الاستراتيجية', description: 'نحول أهدافك الطموحة إلى مسارات عمل واضحة وخطوات مدروسة.', icon: Target, textColor: 'text-cyan-400', borderColor: 'border-cyan-500', bgColor: 'bg-cyan-500', scatterX: -300, scatterY: -200 },
  { id: 2, title: 'خطط التنفيذ', description: 'نترجم الرؤية الشاملة إلى مهام يومية قابلة للقياس والإنجاز.', icon: CheckSquare, textColor: 'text-yellow-400', borderColor: 'border-yellow-500', bgColor: 'bg-yellow-500', scatterX: 350, scatterY: -150 },
  { id: 3, title: 'الذكاء التحليلي', description: 'نستثمر قوة الأرقام لتوجيه كل قرار نحو تحقيق أقصى عائد.', icon: BarChart3, textColor: 'text-blue-400', borderColor: 'border-blue-500', bgColor: 'bg-blue-500', scatterX: 280, scatterY: 250 },
  { id: 4, title: 'منظومة المحتوى', description: 'نؤسس آليات مستدامة لصناعة محتوى ينمو ويتفاعل مع جمهورك.', icon: Grid, textColor: 'text-cyan-300', borderColor: 'border-cyan-500', bgColor: 'bg-cyan-600', scatterX: -250, scatterY: 200 },
  { id: 5, title: 'تمكين الفِرق', description: 'نُسلّح فريق عملك بالمهارات والأدوات اللازمة لتحويل أي خطة إلى واقع.', icon: Users, textColor: 'text-sky-300', borderColor: 'border-sky-500', bgColor: 'bg-sky-600', scatterX: 0, scatterY: 300 },
]

const getPosition = (index: number) => {
  const angle = (index * 360) / segments.length - 90
  const radius = 220
  return {
    x: Math.cos((angle * Math.PI) / 180) * radius,
    y: Math.sin((angle * Math.PI) / 180) * radius,
  }
}

export default function StrategyWheel() {
  const [activeSegment, setActiveSegment] = useState<number | null>(null)
  const [hasAnimated, setHasAnimated] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, margin: '-100px' })
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rotation = useMotionValue(0)
  const negativeRotation = useTransform(rotation, (r) => -r)

  useAnimationFrame((_t, delta) => {
    if (!activeSegment && hasAnimated) rotation.set(rotation.get() + delta * 0.006)
  })

  if (isInView && !hasAnimated) setHasAnimated(true)

  const onHoverStart = (id: number) => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current)
    setActiveSegment(id)
  }
  const onHoverEnd = () => {
    hoverTimeout.current = setTimeout(() => setActiveSegment(null), 150)
  }

  return (
    <section className="min-h-screen py-20 relative flex flex-col items-center justify-center overflow-hidden">

      {/* Desktop */}
      <div className="hidden md:grid md:grid-cols-2 gap-8 max-w-7xl mx-auto px-8 items-center">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="space-y-6"
        >
          <h2 className="text-5xl md:text-6xl font-serif font-bold text-ice-white leading-tight">
            منهجيتي في صياغة <br />
            <span className="text-cyan-glow">الاستراتيجيات</span>
          </h2>
          <p className="text-xl text-ice-white/80 leading-relaxed max-w-lg">
            كل عمل تجاري ناجح هو بمثابة نظام بيئي متكامل. أعتمد على خمس ركائز أساسية تتناغم معاً لتخلق حالة من النمو المستمر والمستدام.
          </p>
          <p className="text-lg text-cyan-glow/70 italic">تفاعل مع العناصر لاكتشاف أسرار هذه المنهجية.</p>
        </motion.div>

        <div ref={containerRef} className="relative w-[550px] h-[550px] flex items-center justify-center">
          <motion.div className="absolute inset-0" style={{ rotate: rotation }}>
            {/* Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="-300 -300 600 600">
              {segments.map((seg, i) => {
                const p1 = getPosition(i)
                const p2 = getPosition((i + 1) % segments.length)
                const active = activeSegment === seg.id || activeSegment === segments[(i + 1) % segments.length].id
                return (
                  <motion.line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                    stroke={active ? '#FACC15' : '#FACC1520'} strokeWidth={active ? 3 : 1}
                    strokeDasharray={active ? '0' : '5 5'}
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: hasAnimated ? 1 : 0, opacity: hasAnimated ? 1 : 0 }}
                    transition={{ delay: 2 + i * 0.2, duration: 0.5 }}
                  />
                )
              })}
              {segments.map((seg, i) => {
                const p = getPosition(i)
                return (
                  <motion.line key={`c${i}`} x1={0} y1={0} x2={p.x} y2={p.y}
                    stroke={activeSegment === seg.id ? '#FACC15' : '#FACC1515'}
                    strokeWidth={activeSegment === seg.id ? 2 : 1}
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: hasAnimated ? 1 : 0, opacity: hasAnimated ? (activeSegment === seg.id ? 1 : 0.3) : 0 }}
                    transition={{ delay: 2.5 + i * 0.1, duration: 0.3 }}
                  />
                )
              })}
            </svg>

            {/* Icons */}
            {segments.map((seg, i) => {
              const pos = getPosition(i)
              const isActive = activeSegment === seg.id
              return (
                <motion.div key={seg.id} className="absolute left-1/2 top-1/2 z-50"
                  initial={{ x: seg.scatterX, y: seg.scatterY, scale: 0, opacity: 0 }}
                  animate={hasAnimated ? { x: pos.x - 64, y: pos.y - 64, scale: 1, opacity: 1 } : {}}
                  transition={{ delay: i * 0.15, duration: 1.2, type: 'spring', stiffness: 60, damping: 12 }}
                  onHoverStart={() => onHoverStart(seg.id)}
                  onHoverEnd={onHoverEnd}
                >
                  <motion.div
                    className={`w-32 h-32 rounded-full flex items-center justify-center cursor-pointer bg-cold-black/60 backdrop-blur-md border border-cyan-500/40 ${isActive ? 'ring-4 ring-cyan-glow/50 border-cyan-glow' : ''}`}
                    animate={{
                      scale: isActive ? 1.25 : 1,
                      filter: activeSegment && !isActive ? 'blur(3px) grayscale(80%)' : 'none',
                      boxShadow: isActive ? '0 0 40px rgba(250,204,21,0.4)' : '0 0 20px rgba(250,204,21,0.1)',
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    style={{ rotate: negativeRotation }}
                  >
                    <seg.icon className={`w-12 h-12 ${seg.textColor}`} strokeWidth={2.5} />
                  </motion.div>
                </motion.div>
              )
            })}
          </motion.div>

          {/* Center */}
          <div className="absolute z-30 text-center w-72 pointer-events-none">
            <AnimatePresence mode="wait">
              {activeSegment ? (
                <motion.div key={activeSegment}
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {(() => {
                    const seg = segments.find(s => s.id === activeSegment)!
                    return (
                      <div className="flex flex-col items-center glass-teal rounded-2xl p-6 border border-cyan-glow/30">
                        <seg.icon className={`w-10 h-10 mb-3 ${seg.textColor}`} />
                        <h3 className={`text-xl font-bold mb-2 ${seg.textColor}`}>{seg.title}</h3>
                        <p className="text-ice-white/90 text-sm">{seg.description}</p>
                      </div>
                    )
                  })()}
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: hasAnimated ? 1 : 0 }} transition={{ delay: 2.5 }}
                  className="bg-cold-dark/50 backdrop-blur-sm rounded-2xl p-4 border border-cyan-glow/20"
                >
                  <span className="text-ice-white/60 text-lg font-serif italic">تفاعل لاكتشاف المزيد</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Mobile */}
      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        className="md:hidden text-center mb-10 px-6"
      >
        <h2 className="text-3xl font-serif font-bold text-ice-white mb-3">
          منهجيتي في صياغة <span className="text-cyan-glow">الاستراتيجيات</span>
        </h2>
      </motion.div>
      <div className="md:hidden flex flex-col gap-4 w-full px-6">
        {segments.map((seg, i) => (
          <motion.div key={seg.id}
            initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            transition={{ delay: i * 0.1, type: 'spring', stiffness: 100 }}
            className={`flex items-center gap-4 p-5 rounded-2xl border bg-cold-dark/60 backdrop-blur-sm ${seg.borderColor}`}
          >
            <div className={`p-3 rounded-full text-white ${seg.bgColor}`}>
              <seg.icon className="w-6 h-6" />
            </div>
            <div>
              <h3 className={`font-bold text-base ${seg.textColor}`}>{seg.title}</h3>
              <p className="text-sm text-ice-white/70">{seg.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
