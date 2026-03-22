/**
 * Testimonials Section
 *
 * Testimonials grid + sticky blog sidebar with hover image — mirrors v1 Testimonials.
 *
 * @phase Phase 4 (updated): Public Pages
 * @author Agent (Antigravity)
 * @created 2026-02-15
 */
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Quote, ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import {
  defaultHomeTestimonials,
  type PartnerTestimonial,
} from '@/lib/site-content'

interface BlogPost {
  id: string
  title: string
  category: string | null
  published_at: string
  featured_image_url: string
  slug: string
}

export default function Testimonials({
  blogPosts = [],
  testimonials = defaultHomeTestimonials,
  title = 'شركاء النجاح',
  subtitle = 'آراء وتجارب بعض الشركات ورواد الأعمال الذين سارت معهم في رحلة النمو.',
}: {
  blogPosts?: BlogPost[]
  testimonials?: PartnerTestimonial[]
  title?: string
  subtitle?: string
}) {
  const [hoveredPost, setHoveredPost] = useState<string | null>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e: React.MouseEvent, postId: string) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top - 150 })
    setHoveredPost(postId)
  }

  const hoveredImageRaw = blogPosts.find(p => p.id === hoveredPost)?.featured_image_url
  const hoveredImage =
    hoveredImageRaw &&
    (hoveredImageRaw.startsWith('http://') ||
      hoveredImageRaw.startsWith('https://') ||
      hoveredImageRaw.startsWith('/'))
      ? hoveredImageRaw
      : null
  const hoveredTitle = blogPosts.find(p => p.id === hoveredPost)?.title

  return (
    <section className="relative z-10 py-24 pb-48 px-4 md:px-20">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-12 md:gap-20 items-start">

        {/* Testimonials col */}
        <div className="w-full md:w-3/5 flex flex-col gap-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-4">
            <h2 className="text-4xl md:text-6xl font-serif font-bold text-ice-white mb-2">{title}</h2>
            <p className="text-cyan-glow/60 text-lg">{subtitle}</p>
          </motion.div>

          <div className="space-y-6">
            {testimonials.map((t, i) => (
              <motion.div key={t.id}
                initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-100px' }} transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.01 }}
                className="bg-cold-dark/40 backdrop-blur-md border border-white/10 p-8 rounded-2xl hover:border-cyan-glow/30 transition-all duration-300"
              >
                <Quote className="w-8 h-8 text-cyan-glow mb-4 opacity-70" />
                <p className="text-xl font-light italic mb-6 text-ice-white leading-relaxed">&quot;{t.text}&quot;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-cyan-glow/20 flex items-center justify-center text-cyan-glow font-bold text-sm">
                    {t.author.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-cyan-glow">{t.author}</p>
                    <p className="text-sm opacity-60 text-ice-white">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Blog sidebar */}
        <div className="w-full md:w-2/5 md:sticky md:top-32 h-fit bg-cold-dark/40 backdrop-blur-md border border-white/10 p-8 rounded-3xl flex flex-col gap-8">
          <div>
            <p className="text-xs uppercase tracking-widest text-cyan-glow mb-2 font-bold">أحدث التدوينات</p>
            <h3 className="text-3xl font-serif font-bold text-ice-white">مكتبة المعرفة</h3>
            <p className="text-cyan-glow/60 mt-2 text-sm">تحليلات، استراتيجيات، وأنظمة عمل مصممة لرفع كفاءة أعمالك.</p>
          </div>

          <div className="space-y-2 relative">
            {blogPosts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`}
                className="group block border-b border-white/10 py-5 first:pt-0 last:border-0 hover:bg-white/5 transition-colors px-4 -mx-4 relative"
                onMouseMove={(e) => handleMouseMove(e, post.id)}
                onMouseLeave={() => setHoveredPost(null)}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-mono opacity-50 text-ice-white">
                    {post.published_at ? new Date(post.published_at).toLocaleDateString('ar-EG') : ''}
                  </span>
                  <span className="text-xs uppercase tracking-wider text-cyan-glow/80 bg-cyan-glow/10 px-2 py-0.5 rounded-full">
                    {post.category ?? 'Blog'}
                  </span>
                </div>
                <p className="text-base font-medium text-ice-white group-hover:text-cyan-glow transition-colors line-clamp-2">
                  {post.title}
                </p>
              </Link>
            ))}

            {/* Hover floating image */}
            <AnimatePresence>
              {hoveredPost && hoveredImage && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute z-50 pointer-events-none"
                  style={{ left: mousePos.x, top: mousePos.y, transform: 'translate(-50%, 0)' }}
                >
                  <div className="relative w-52 h-36 rounded-xl overflow-hidden border-2 border-cyan-glow/50 shadow-[0_0_30px_rgba(250,204,21,0.3)]">
                    <Image src={hoveredImage} alt={hoveredTitle ?? ''} fill className="object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-cold-black/60 to-transparent" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Link href="/blog" className="inline-flex items-center gap-2 text-ice-white hover:text-cyan-glow text-sm transition-colors">
            تصفح جميع المقالات <ArrowLeft size={16} />
          </Link>
        </div>
      </div>
    </section>
  )
}
