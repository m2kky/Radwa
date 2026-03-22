/**
 * Featured Products Section
 * @phase Phase 4: Public Pages
 * @author Agent (Antigravity)
 * @created 2026-02-15
 */
import Link from 'next/link'
import Image from 'next/image'
// Minimal product shape needed for this component
interface FeaturedProduct {
  id: string
  slug: string
  title: string
  description: string | null
  thumbnail_url: string | null
  price: number
  compare_at_price: number | null
  currency: string
  installments_enabled: boolean
}

export default function FeaturedProducts({ products }: { products: FeaturedProduct[] }) {
  if (!products.length) return null

  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-xs font-bold tracking-widest text-cyan-glow uppercase mb-2">المتجر</p>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-ice-white">منتجات مميزة</h2>
          </div>
          <Link href="/shop" className="text-sm text-cyan-glow hover:underline">عرض الكل</Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {products.map(p => (
            <Link key={p.id} href={`/shop/${p.slug}`} className="group bg-card border border-white/10 rounded-2xl overflow-hidden hover:border-cyan-glow/30 transition-all duration-300">
              <div className="relative h-48 bg-cold-dark">
                {p.thumbnail_url && (
                  <Image src={p.thumbnail_url} alt={p.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                )}
              </div>
              <div className="p-5">
                <h3 className="font-serif font-bold text-ice-white mb-1 group-hover:text-cyan-glow transition-colors">{p.title}</h3>
                <p className="text-cyan-glow font-bold">{p.price} جنيه</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
