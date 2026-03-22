/**
 * About Focus Text Component
 *
 * Scroll-driven blur/focus paragraphs — each paragraph sharpens as it enters viewport center.
 *
 * @phase Phase 4: Public Pages
 * @author Agent (Antigravity)
 * @created 2026-02-15
 */
'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

const paragraphs = [
  'أنا لا أؤمن بالحظ. أنا أؤمن بالدقة والتخطيط.',
  'في مشهد رقمي يغرق في الضوضاء، أصبح جذب الانتباه مجرد خطوة أولى. التحدي الحقيقي - والفن الحقيقي - يكمن في الحفاظ عليه.',
  'لم تبدأ رحلتي بكتيب قواعد. بل بدأت بفضول لا هوادة فيه حول السلوك البشري. لماذا ننقر؟ لماذا نتابع؟ لماذا نثق بعلامات تجارية معينة ونتجاهل أخرى؟',
  'على مر السنين، قمت بفك شفرة هذه الأنماط. تعلمت أن النمو الحقيقي لا يتعلق بالحيل السريعة أو الاتجاهات العابرة. بل يتعلق ببناء أنظمة بيئية مستدامة حيث توجه البيانات الإبداع، وتدفع الاستراتيجية عجلة التنفيذ.',
  'أنا أسد الفجوة بين الجانب التحليلي والفني. أنا لا أقوم فقط بالتحسين من أجل المقاييس والأرقام؛ بل أقوم بالتحسين من أجل المعنى.',
  'هذه هي مهنتي. هندسة الوضوح من رحم الفوضى. تحويل المقاييس الثابتة إلى حركات ديناميكية. وبناء إرث وعلامة تجارية تتجاوز مجرد تواجد عابر على الشاشة.',
]

function BlurryParagraph({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const blurValue = useTransform(scrollYProgress, [0, 0.4, 0.6, 1], [8, 0, 0, 8])
  const opacity = useTransform(scrollYProgress, [0, 0.4, 0.6, 1], [0.3, 1, 1, 0.3])
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.95, 1, 0.95])

  return (
    <motion.p
      ref={ref}
      style={{ filter: useTransform(blurValue, (v) => `blur(${v}px)`), opacity, scale }}
      className="text-2xl md:text-4xl text-ice-white font-medium leading-relaxed max-w-4xl mx-auto text-center py-12 md:py-16 px-6 font-serif select-none"
    >
      {text}
    </motion.p>
  )
}

export function AboutFocusText() {
  return (
    <div className="relative w-full py-40 my-20">
      {paragraphs.map((text, i) => (
        <BlurryParagraph key={i} text={text} />
      ))}
    </div>
  )
}
