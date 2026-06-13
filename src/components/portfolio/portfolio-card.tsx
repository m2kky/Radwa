'use client'

import { useRef, useState, MouseEvent } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import type { PortfolioItem } from '@/types'

export default function PortfolioCard({ item, index }: { item: PortfolioItem, index: number }) {
  const cardRef = useRef<HTMLAnchorElement>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseMove = (e: MouseEvent<HTMLAnchorElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setMousePosition({ x, y })
  }

  // Determine span size for Bento Grid (make the first item or specific items span 2 columns/rows)
  const isLarge = index === 0 || index === 5 || index === 8

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={`group relative ${isLarge ? 'md:col-span-2 md:row-span-2' : 'col-span-1 row-span-1'} h-[400px] md:h-auto min-h-[350px] md:min-h-[450px] rounded-3xl overflow-hidden`}
    >
      <Link
        ref={cardRef}
        href={`/portfolio/${item.item_type === 'case_study' ? 'case-study' : 'project'}/${item.slug}`}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="block w-full h-full relative"
      >
        {/* Background Image */}
        <div className="absolute inset-0 bg-cold-black/80">
          {item.thumbnail_url ? (
            <motion.div
              className="absolute inset-0 w-full h-full bg-cover bg-center"
              style={{ backgroundImage: `url(${item.thumbnail_url})` }}
              animate={{
                scale: isHovered ? 1.05 : 1,
              }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          ) : (
            <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-cyan-900/20 to-cold-black" />
          )}
        </div>

        {/* Dynamic Gradient Overlay (Glow effect) */}
        <div
          className="absolute inset-0 z-10 transition-opacity duration-300 pointer-events-none mix-blend-overlay"
          style={{
            opacity: isHovered ? 1 : 0,
            background: `radial-gradient(800px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,255,255,0.1), transparent 40%)`,
          }}
        />

        {/* Dark Gradient from bottom for text readability */}
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-cold-black/95 via-cold-black/50 to-transparent pointer-events-none" />

        {/* Content */}
        <div className="absolute inset-0 z-20 p-6 sm:p-8 flex flex-col justify-end">
          {/* Top Badges */}
          <div className="absolute top-6 left-6 right-6 flex justify-between items-start">
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 backdrop-blur-md">
              {item.item_type === 'case_study' ? 'دراسة حالة' : 'مشروع'}
            </span>
            {item.year && (
              <span className="text-xs font-mono text-ice-white/60 bg-cold-black/40 px-2 py-1 rounded backdrop-blur-sm">
                {item.year}
              </span>
            )}
          </div>

          <motion.div
            animate={{ y: isHovered ? -8 : 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <h3 className="text-2xl sm:text-3xl font-serif font-bold text-ice-white mb-2 leading-tight">
              {item.title}
            </h3>
            
            <p className="text-ice-white/70 text-sm sm:text-base line-clamp-2 mb-4 max-w-xl">
              {item.description}
            </p>

            <div className="flex flex-wrap items-center justify-between gap-4 mt-auto">
              <div className="flex flex-wrap gap-2">
                {item.tags?.slice(0, 3).map(tag => (
                  <span key={tag} className="text-xs text-ice-white/50 border border-white/10 px-2.5 py-1 rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2 text-cyan-glow font-medium text-sm group-hover:text-cyan-300 transition-colors">
                <span>التفاصيل</span>
                <ArrowLeft size={16} className="transform group-hover:-translate-x-1 transition-transform" />
              </div>
            </div>
          </motion.div>
        </div>
      </Link>
    </motion.div>
  )
}
