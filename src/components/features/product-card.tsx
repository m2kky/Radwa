import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { ArrowUpRight } from 'lucide-react'
import type { Product } from '@/types'

export function ProductCard({ product }: { product: Product }) {
  const href = `/shop/${product.slug}`
  const discount = product.compare_at_price
    ? Math.round((1 - product.price / product.compare_at_price) * 100)
    : null

  return (
    <Link href={href} className="group block">
      <div className="relative overflow-hidden rounded-xl bg-card border border-border transition-all duration-300 hover:border-primary/40 hover:shadow-[0_0_30px_rgba(250,204,21,0.08)]">

        {/* Thumbnail */}
        <div className="relative aspect-[4/3] overflow-hidden bg-zinc-900">
          {product.thumbnail_url ? (
            <Image
              src={product.thumbnail_url}
              alt={product.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
              لا توجد صورة
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 right-3 flex gap-2">
            {discount && (
              <Badge className="bg-primary text-primary-foreground font-bold text-xs">
                -{discount}%
              </Badge>
            )}
            {product.installments_enabled && (
              <Badge variant="secondary" className="text-xs">أقساط</Badge>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-foreground line-clamp-2 mb-1 group-hover:text-primary transition-colors">
            {product.title}
          </h3>
          {product.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {product.description}
            </p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-primary">
                {product.price.toLocaleString('ar-EG')} ج
              </span>
              {product.compare_at_price && (
                <span className="text-sm text-muted-foreground line-through">
                  {product.compare_at_price.toLocaleString('ar-EG')} ج
                </span>
              )}
            </div>
            <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </div>
      </div>
    </Link>
  )
}
