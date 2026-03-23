'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ProductCard } from '@/components/features/product-card'
import type { Product } from '@/types'

type SortMode = 'newest' | 'price_low' | 'price_high'
type FilterType = 'all' | 'digital' | 'course'

function sortProducts(items: Product[], sortBy: SortMode): Product[] {
  const copied = [...items]
  if (sortBy === 'price_low') {
    copied.sort((a, b) => a.price - b.price)
    return copied
  }
  if (sortBy === 'price_high') {
    copied.sort((a, b) => b.price - a.price)
    return copied
  }
  copied.sort((a, b) => {
    const first = new Date(a.created_at).getTime()
    const second = new Date(b.created_at).getTime()
    return second - first
  })
  return copied
}

export default function ShopCatalog({ products }: { products: Product[] }) {
  const [query, setQuery] = useState('')
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [sortBy, setSortBy] = useState<SortMode>('newest')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const base = products.filter((product) => {
      if (filterType !== 'all' && product.type !== filterType) return false
      if (!q) return true
      const haystack = `${product.title} ${product.description ?? ''}`.toLowerCase()
      return haystack.includes(q)
    })
    return sortProducts(base, sortBy)
  }, [products, query, filterType, sortBy])

  const featured = filtered.find((product) => product.is_featured) ?? filtered[0] ?? null
  const rest = featured ? filtered.filter((product) => product.id !== featured.id) : filtered

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <p className="text-muted-foreground text-lg">لا توجد منتجات متاحة حالياً</p>
        <p className="text-muted-foreground text-sm mt-2">ارجع قريباً!</p>
      </div>
    )
  }

  return (
    <div className="space-y-10">
      <section className="container mx-auto px-4 pt-10 md:pt-14">
        <div className="bg-cold-dark border border-border rounded-2xl p-4 md:p-5 grid gap-3 md:grid-cols-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث باسم المنتج..."
            className="w-full bg-cold-black border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40"
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as FilterType)}
            className="w-full bg-cold-black border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/40"
          >
            <option value="all">كل الأنواع</option>
            <option value="digital">منتجات رقمية</option>
            <option value="course">كورسات</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortMode)}
            className="w-full bg-cold-black border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/40"
          >
            <option value="newest">الأحدث أولًا</option>
            <option value="price_low">السعر: الأقل للأعلى</option>
            <option value="price_high">السعر: الأعلى للأقل</option>
          </select>
        </div>
      </section>

      {featured && (
        <section className="relative border-y border-border overflow-hidden">
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,rgba(250,204,21,0.06),transparent_60%)]" />

          <div className="container mx-auto px-4 py-16 md:py-24">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm text-primary font-medium uppercase tracking-widest">
                    المنتج المميز
                  </span>
                </div>

                <h1 className="text-3xl md:text-5xl font-serif font-bold text-foreground leading-tight mb-4">
                  {featured.title}
                </h1>

                {featured.description && (
                  <p className="text-muted-foreground text-lg leading-relaxed mb-6 line-clamp-3">
                    {featured.description}
                  </p>
                )}

                <div className="flex items-baseline gap-3 mb-8">
                  <span className="text-4xl font-bold text-primary">
                    {featured.price.toLocaleString('ar-EG')} ج
                  </span>
                  {featured.compare_at_price && (
                    <span className="text-xl text-muted-foreground line-through">
                      {featured.compare_at_price.toLocaleString('ar-EG')} ج
                    </span>
                  )}
                  {featured.installments_enabled && (
                    <Badge variant="secondary">أو بالأقساط</Badge>
                  )}
                </div>

                <Link
                  href={`/shop/${featured.slug}`}
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold px-8 py-4 rounded-xl hover:bg-primary/90 transition-colors text-lg"
                >
                  اشتري دلوقتي
                  <ArrowLeft className="w-5 h-5" />
                </Link>
              </div>

              <div className="order-1 md:order-2">
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-border shadow-2xl shadow-black/50">
                  {featured.thumbnail_url ? (
                    <Image
                      src={featured.thumbnail_url}
                      alt={featured.title}
                      fill
                      className="object-cover"
                      priority
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-zinc-900 text-muted-foreground">
                      لا توجد صورة
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {rest.length > 0 && (
        <section className="container mx-auto px-4 pb-12">
          <h2 className="text-2xl font-serif font-bold text-foreground mb-8">
            كل المنتجات
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rest.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {filtered.length === 0 && (
        <section className="container mx-auto px-4 pb-16">
          <div className="bg-cold-dark border border-border rounded-2xl p-8 text-center text-muted-foreground">
            لا توجد نتائج مطابقة للبحث أو الفلاتر الحالية.
          </div>
        </section>
      )}
    </div>
  )
}
