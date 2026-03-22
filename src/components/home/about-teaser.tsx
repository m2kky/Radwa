/**
 * HomeAbout Section
 *
 * Image + stats + animated quote card — mirrors v1 HomeAbout.
 *
 * @phase Phase 4 (updated): Public Pages
 * @author Agent (Antigravity)
 * @created 2026-02-15
 */
'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Globe, Users, Trophy } from 'lucide-react'

const stats = [
  { label: 'سنوات الخبرة', value: '+5', icon: Globe },
  { label: 'مشاريع ناجحة', value: '+20', icon: Trophy },
  { label: 'عملاء تم إرشادهم', value: '+50', icon: Users },
]

const quote = '"الاستراتيجية ليست محاولة للقيام بكل شيء، بل هي التركيز على ما يُحْدث الفارق الحقيقي."'

export default function HomeAbout() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">

        {/* Image col */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative"
        >
          <div className="aspect-[4/5] bg-card/30 border border-cyan-glow/10 rounded-2xl overflow-hidden relative backdrop-blur-md">
            <div className="absolute inset-0 bg-gradient-to-t from-cold-black/50 to-transparent z-10" />
            <Image
              src="/radwa.jpg"
              alt="Radwa Portrait"
              fill
              className="object-cover object-center grayscale hover:grayscale-0 transition-all duration-500"
            />
            {/* Floating quote card */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="absolute bottom-6 left-6 right-6 glass-teal p-6 rounded-xl z-20"
            >
              <p className="font-serif italic text-ice-white text-base leading-relaxed" dir="rtl">
                {quote.split(' ').map((word, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, filter: 'blur(8px)' }}
                    whileInView={{ opacity: 1, filter: 'blur(0px)' }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 0.8 + i * 0.07 }}
                    className="mr-1 inline-block text-cyan-glow"
                  >
                    {word}
                  </motion.span>
                ))}
              </p>
            </motion.div>
          </div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-cyan-glow/20 rounded-full blur-3xl -z-10 animate-pulse" />
        </motion.div>

        {/* Content col */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="space-y-8"
        >
          <div className="space-y-4">
            <p className="text-sm font-bold tracking-widest text-cyan-glow uppercase">نبذة عني</p>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-ice-white leading-tight">
              أصمم استراتيجيات <span className="text-cyan-glow italic">تصنع الفارق.</span>
            </h2>
            <p className="text-lg text-ice-white/80 leading-relaxed">
              أرافق الشركات في رحلة تخطي التحديات المعقدة، وأبني معهم خططاً واضحة وقابلة للتطبيق للوصول لنتائج حقيقية. أعتمد في عملي على مزيج من التحليل الدقيق للبيانات والتفكير الإبداعي.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 py-6 border-y border-cyan-glow/10">
            {stats.map((stat, i) => (
              <div key={i} className="space-y-1">
                <stat.icon size={18} className="text-cyan-glow mb-2" />
                <p className="text-2xl md:text-3xl font-bold text-ice-white font-serif">{stat.value}</p>
                <p className="text-xs text-cyan-glow/70 uppercase tracking-wide">{stat.label}</p>
              </div>
            ))}
          </div>

          <Link
            href="/about"
            className="inline-flex items-center gap-2 border border-cyan-glow/30 text-ice-white hover:text-cyan-glow hover:border-cyan-glow px-5 py-2.5 rounded-lg text-sm transition-colors"
          >
            اكتشف رحلتي بالكامل
            <ArrowLeft size={16} />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
