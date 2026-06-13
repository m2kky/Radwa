'use client'

import type { PortfolioItem } from '@/types'
import PortfolioCard from './portfolio-card'

export default function PortfolioGrid({ items }: { items: PortfolioItem[] }) {
  if (!items || items.length === 0) {
    return (
      <div className="py-24 text-center border border-white/5 rounded-3xl bg-white/[0.02]">
        <h3 className="text-2xl font-serif text-ice-white mb-2">لا توجد أعمال منشورة حالياً</h3>
        <p className="text-ice-white/60">يتم العمل على رفع أحدث المشاريع ودراسات الحالة. عد قريباً!</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 auto-rows-fr">
      {items.map((item, index) => (
        <PortfolioCard key={item.id} item={item} index={index} />
      ))}
    </div>
  )
}
