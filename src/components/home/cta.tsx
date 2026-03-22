/**
 * CTA Section
 *
 * Full-screen call to action — mirrors v1 CTA.
 *
 * @phase Phase 4 (updated): Public Pages
 * @author Agent (Antigravity)
 * @created 2026-02-15
 */
'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export default function CTA() {
  return (
    <motion.section
      initial={{ opacity: 0, scale: 0.92, filter: 'blur(20px)' }}
      whileInView={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      className="relative z-50 w-full -mt-40 min-h-[60vh] flex flex-col items-center justify-center py-20 bg-cold-dark/20 backdrop-blur-[80px] border border-white/10 rounded-[3rem] shadow-[0_-50px_100px_-20px_rgba(0,0,0,0.5)] mb-20"
    >
      <div className="max-w-4xl mx-auto px-4 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.3 }}
          className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold mb-8 text-ice-white"
        >
          هل أنت مستعد لنقل أعمالك والارتقاء بها لمستوى جديد؟
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.5 }}
          className="text-lg md:text-xl lg:text-2xl opacity-80 mb-12 max-w-2xl mx-auto text-ice-white leading-relaxed"
        >
          من التشتت إلى الوضوح التام.. دعنا نرسم معاً خارطة طريق واضحة تقودك نحو إنجازك الكبير القادم.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.7 }}
          className="flex flex-col sm:flex-row gap-6 justify-center"
        >
          <Link href="/book"
            className="bg-cyan-glow text-cold-black text-lg px-10 py-4 rounded-full font-bold hover:bg-cyan-glow/80 hover:scale-105 transition-all shadow-[0_0_30px_rgba(250,204,21,0.4)]"
          >
            احجز استشارة الآن
          </Link>
          <Link href="/shop"
            className="border border-cyan-glow/30 text-ice-white text-lg px-10 py-4 rounded-full hover:bg-cyan-glow/10 hover:border-cyan-glow/50 transition-all"
          >
            تصفح المنتجات
          </Link>
        </motion.div>
      </div>
    </motion.section>
  )
}
