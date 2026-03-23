'use client'

interface ProductStickyBuyBarProps {
  title: string
  price: number
}

export default function ProductStickyBuyBar({ title, price }: ProductStickyBuyBarProps) {
  return (
    <div className="fixed bottom-3 inset-x-3 z-40 md:hidden">
      <a
        href="#checkout-form"
        className="flex items-center justify-between gap-3 bg-cold-dark/95 backdrop-blur-xl border border-border rounded-2xl px-4 py-3 shadow-2xl"
      >
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground truncate">{title}</p>
          <p className="text-base font-bold text-primary">{price.toLocaleString('ar-EG')} ج</p>
        </div>
        <span className="inline-flex items-center justify-center h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-bold">
          شراء الآن
        </span>
      </a>
    </div>
  )
}
