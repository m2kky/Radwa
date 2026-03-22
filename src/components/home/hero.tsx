/**
 * Hero Section
 * @phase Phase 4: Public Pages
 * @author Agent (Antigravity)
 * @created 2026-02-15
 */
'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-t from-cold-black via-transparent to-transparent pointer-events-none" />

      {/* Animated blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-glow/5 rounded-full blur-3xl animate-blob-1" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-glow/3 rounded-full blur-3xl animate-blob-2" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="text-5xl sm:text-7xl md:text-9xl font-serif font-bold text-ice-white tracking-[0.2em] md:tracking-[0.3em] leading-none"
        >
          استراتيجية
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="mt-6 text-base md:text-xl text-ice-white/70 max-w-xl leading-relaxed"
        >
          نحوِّل الأفكار المبتكرة إلى واقع عملي ملموس.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="mt-10 flex flex-wrap gap-4"
        >
          <Link href="/book" className="flex items-center gap-2 bg-ice-white text-cold-black font-bold px-7 py-3 rounded-full hover:bg-cyan-glow transition-colors">
            احجز استشارة <ArrowLeft size={16} />
          </Link>
          <Link href="/shop" className="flex items-center gap-2 border border-cyan-glow/30 text-ice-white px-7 py-3 rounded-full hover:bg-cyan-glow/10 transition-colors">
            تصفح المتجر
          </Link>
          <Link href="/about" className="flex items-center gap-2 border border-white/20 text-ice-white px-7 py-3 rounded-full hover:bg-white/5 transition-colors">
            من أنا
          </Link>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <div className="w-6 h-10 border-2 border-white/20 rounded-full flex justify-center pt-2">
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-1.5 h-1.5 bg-ice-white rounded-full"
          />
        </div>
      </motion.div>
    </section>
  )
}
