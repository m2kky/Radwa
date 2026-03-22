/**
 * Admin New Product Page
 *
 * @phase Phase 5: Admin
 * @author Agent (Antigravity)
 * @created 2026-02-15
 */
import ProductForm from '@/components/admin/product-form'

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-serif font-bold text-foreground">منتج جديد</h1>
      <ProductForm />
    </div>
  )
}
