'use client'

import { useMemo, useState } from 'react'
import type { Guide } from '@/types'
import GuideCard from './guide-card'

export default function GuidesCatalog({ guides }: { guides: Guide[] }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')

  const categories = useMemo(() => {
    const values = guides
      .map((guide) => guide.category?.trim())
      .filter((value): value is string => Boolean(value))
    return Array.from(new Set(values))
  }, [guides])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return guides.filter((guide) => {
      if (category !== 'all' && guide.category !== category) return false
      if (!q) return true
      const haystack = `${guide.title} ${guide.excerpt ?? ''} ${guide.category ?? ''}`.toLowerCase()
      return haystack.includes(q)
    })
  }, [guides, query, category])

  return (
    <div className="space-y-10">
      <section className="container mx-auto px-4 pt-10 md:pt-14">
        <div className="grid gap-3 rounded-2xl border border-border bg-cold-dark p-4 md:grid-cols-[minmax(0,1fr)_220px] md:p-5">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث في الـ guides والـ templates..."
            className="w-full rounded-xl border border-border bg-cold-black px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-xl border border-border bg-cold-black px-4 py-2.5 text-sm text-foreground focus:border-primary/40 focus:outline-none"
          >
            <option value="all">كل التصنيفات</option>
            {categories.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-16">
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((guide) => (
              <GuideCard key={guide.id} guide={guide} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-cold-dark p-8 text-center text-muted-foreground">
            لا توجد نتائج مطابقة.
          </div>
        )}
      </section>
    </div>
  )
}
