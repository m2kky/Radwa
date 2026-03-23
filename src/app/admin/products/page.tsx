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
import { Plus } from 'lucide-react'
import ProductsManager from '@/components/admin/products-manager'

async function getProducts() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('products')
    .select('id, slug, title, price, status, is_featured, installments_enabled, created_at')
    .order('created_at', { ascending: false })
  return data ?? []
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

      <ProductsManager initialProducts={products} />
    </div>
  )
}
