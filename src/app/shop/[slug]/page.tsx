import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { CheckoutForm } from '@/components/features/checkout-form'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Package } from 'lucide-react'
import type { Product } from '@/types'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('title, meta_title, meta_description, thumbnail_url')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!data) return {}

  return {
    title: data.meta_title ?? data.title,
    description: data.meta_description ?? undefined,
    openGraph: {
      title: data.meta_title ?? data.title,
      description: data.meta_description ?? undefined,
      images: data.thumbnail_url ? [data.thumbnail_url] : [],
    },
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!data) notFound()

  const product = data as Product
  const discount = product.compare_at_price
    ? Math.round((1 - product.price / product.compare_at_price) * 100)
    : null

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">

          {/* Left — Image */}
          <div className="sticky top-8">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-border shadow-2xl shadow-black/60">
              {product.thumbnail_url ? (
                <Image
                  src={product.thumbnail_url}
                  alt={product.title}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-zinc-900 text-muted-foreground">
                  <Package className="w-16 h-16 opacity-20" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
            </div>
          </div>

          {/* Right — Details + Checkout */}
          <div className="flex flex-col gap-8">

            {/* Product Info */}
            <div>
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="secondary" className="capitalize">
                  {product.type === 'course' ? 'كورس' : 'منتج رقمي'}
                </Badge>
                {product.installments_enabled && (
                  <Badge className="bg-primary/10 text-primary border border-primary/20">
                    متاح بالأقساط
                  </Badge>
                )}
                {discount && (
                  <Badge className="bg-primary text-primary-foreground font-bold">
                    خصم {discount}%
                  </Badge>
                )}
              </div>

              <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground leading-tight mb-4">
                {product.title}
              </h1>

              {product.description && (
                <p className="text-muted-foreground text-lg leading-relaxed">
                  {product.description}
                </p>
              )}
            </div>

            {/* Pricing */}
            <div className="flex items-baseline gap-3 pb-6 border-b border-border">
              <span className="text-4xl font-bold text-primary">
                {product.price.toLocaleString('ar-EG')} ج
              </span>
              {product.compare_at_price && (
                <span className="text-xl text-muted-foreground line-through">
                  {product.compare_at_price.toLocaleString('ar-EG')} ج
                </span>
              )}
            </div>

            {/* What you get */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>تحميل فوري بعد الدفع</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>لينك تحميل دائم على إيميلك</span>
              </div>
              {product.installments_enabled && (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  <span>إمكانية الدفع على قسطين أو أربعة أقساط</span>
                </div>
              )}
            </div>

            {/* Checkout Form */}
            <CheckoutForm product={product} />
          </div>
        </div>
      </div>
    </main>
  )
}
