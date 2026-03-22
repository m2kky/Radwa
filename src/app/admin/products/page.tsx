/**
 * Admin Products Page
 *
 * Lists all products with status toggle and links to edit/create.
 *
 * @phase Phase 5: Admin
 * @author Agent (Antigravity)
 * @created 2026-02-15
 */
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'
import { Plus, Pencil } from 'lucide-react'
import { ProductStatus } from '@/types'
import ProductStatusToggle from '@/components/admin/product-status-toggle'

async function getProducts() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('products')
    .select('id, slug, title, price, status, is_featured, installments_enabled, created_at')
    .order('created_at', { ascending: false })
  return data ?? []
}

const statusColors: Record<ProductStatus, string> = {
  published: 'text-emerald-400 bg-emerald-400/10',
  draft: 'text-yellow-400 bg-yellow-400/10',
  archived: 'text-zinc-400 bg-zinc-400/10',
}

const statusLabels: Record<ProductStatus, string> = {
  published: 'منشور',
  draft: 'مسودة',
  archived: 'مؤرشف',
}

export default async function AdminProductsPage() {
  const products = await getProducts()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-serif font-bold text-foreground">المنتجات</h1>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-2 bg-cyan-glow text-cold-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-cyan-glow/90 transition-colors"
        >
          <Plus size={16} />
          منتج جديد
        </Link>
      </div>

      <div className="bg-cold-dark border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="text-right px-6 py-3 font-medium">المنتج</th>
              <th className="text-right px-6 py-3 font-medium">السعر</th>
              <th className="text-right px-6 py-3 font-medium">الحالة</th>
              <th className="text-right px-6 py-3 font-medium">تقسيط</th>
              <th className="text-right px-6 py-3 font-medium">مميز</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody>
            {products.map((p: {
              id: string
              slug: string
              title: string
              price: number
              status: ProductStatus
              is_featured: boolean
              installments_enabled: boolean
            }) => (
              <tr key={p.id} className="border-b border-border/50 hover:bg-white/2 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-medium text-foreground">{p.title}</p>
                  <p className="text-xs text-muted-foreground">{p.slug}</p>
                </td>
                <td className="px-6 py-4 text-foreground">{p.price.toLocaleString()} EGP</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[p.status]}`}>
                    {statusLabels[p.status]}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <ProductStatusToggle
                    id={p.id}
                    field="installments_enabled"
                    value={p.installments_enabled}
                  />
                </td>
                <td className="px-6 py-4">
                  <ProductStatusToggle
                    id={p.id}
                    field="is_featured"
                    value={p.is_featured}
                  />
                </td>
                <td className="px-6 py-4">
                  <Link
                    href={`/admin/products/${p.id}/edit`}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-cyan-glow transition-colors"
                  >
                    <Pencil size={13} />
                    تعديل
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && (
          <p className="text-center text-muted-foreground py-12">لا توجد منتجات بعد</p>
        )}
      </div>
    </div>
  )
}
