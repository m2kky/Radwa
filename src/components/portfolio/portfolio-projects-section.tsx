'use client'

import { useEffect, useMemo, useState } from 'react'
import type { PortfolioItem } from '@/types'
import PortfolioGrid from './portfolio-grid'

function getProjectCategories(item: PortfolioItem) {
  const values = [
    ...(item.subcategories ?? []),
    ...(item.subcategories?.length ? [] : item.category ? [item.category] : []),
  ]

  return values
    .map((value) => value.trim())
    .filter((value, index, array) => value.length > 0 && array.indexOf(value) === index)
}

function readCategoryFromUrl(fallback: string) {
  if (typeof window === 'undefined') return fallback
  return new URL(window.location.href).searchParams.get('category') || 'all'
}

export default function PortfolioProjectsSection({
  projects,
  initialCategory = 'all',
}: {
  projects: PortfolioItem[]
  initialCategory?: string
}) {
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || 'all')

  const categories = useMemo(() => {
    const values = projects.flatMap(getProjectCategories)
    return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b))
  }, [projects])

  useEffect(() => {
    const handlePopState = () => {
      setSelectedCategory(readCategoryFromUrl('all'))
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    const current = readCategoryFromUrl(initialCategory || 'all')
    setSelectedCategory(current)
  }, [initialCategory])

  const filteredProjects = useMemo(() => {
    if (selectedCategory === 'all') return projects
    return projects.filter((project) => getProjectCategories(project).includes(selectedCategory))
  }, [projects, selectedCategory])

  const selectCategory = (category: string) => {
    setSelectedCategory(category)

    const url = new URL(window.location.href)
    if (category === 'all') {
      url.searchParams.delete('category')
    } else {
      url.searchParams.set('category', category)
    }
    window.history.pushState({ category }, '', `${url.pathname}${url.search}${url.hash}`)
  }

  return (
    <section>
      <div className="mb-12 flex flex-col gap-8 text-center">
        <div>
          <h2 className="mb-4 text-3xl font-serif font-bold md:text-5xl">المشاريع البارزة</h2>
          <p className="text-lg text-ice-white/60">مجموعة من الأعمال والمشاريع التي نفذتها مؤخراً.</p>
        </div>

        {categories.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => selectCategory('all')}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                selectedCategory === 'all'
                  ? 'border-cyan-glow bg-cyan-glow text-cold-black'
                  : 'border-white/10 bg-white/[0.03] text-ice-white/70 hover:border-cyan-glow/40 hover:text-ice-white'
              }`}
            >
              الكل
            </button>
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => selectCategory(category)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                  selectedCategory === category
                    ? 'border-cyan-glow bg-cyan-glow text-cold-black'
                    : 'border-white/10 bg-white/[0.03] text-ice-white/70 hover:border-cyan-glow/40 hover:text-ice-white'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <PortfolioGrid items={filteredProjects} />
    </section>
  )
}
