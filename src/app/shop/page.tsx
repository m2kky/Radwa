import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/features/product-card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Sparkles } from 'lucide-react'
import type { Product } from '@/types'

export const metadata: Metadata = {
  title: 'المتجر',
  description: 'قوالب احترافية وكورسات متخصصة في الاستراتيجية والتسويق الرقمي للسوق المصري',
}

export default async function ShopPage() {
  const supabase = await createClient()

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('status', 'published')
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })

  const all = (products ?? []) as Product[]
  const featured = all.find(p => p.is_featured) ?? all[0] ?? null
  const rest = featured ? all.filter(p => p.id !== featured.id) : all

  return (
    <main className="min-h-screen bg-background">

      {/* Featured Product Hero */}
      {featured && (
        <section className="relative border-b border-border overflow-hidden">
          {/* Background glow */}
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,rgba(250,204,21,0.06),transparent_60%)]" />

          <div className="container mx-auto px-4 py-16 md:py-24">
            <div className="grid md:grid-cols-2 gap-12 items-center">

              {/* Text */}
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

              {/* Image */}
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
                  {/* Shine overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Rest of products */}
      {rest.length > 0 && (
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-2xl font-serif font-bold text-foreground mb-8">
            كل المنتجات
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rest.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {all.length === 0 && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <p className="text-muted-foreground text-lg">لا توجد منتجات متاحة حالياً</p>
          <p className="text-muted-foreground text-sm mt-2">ارجع قريباً!</p>
        </div>
      )}
    </main>
  )
}
