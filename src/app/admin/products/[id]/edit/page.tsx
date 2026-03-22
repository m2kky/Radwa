/**
 * Admin Edit Product Page
 *
 * Fetches product by id and renders the shared ProductForm pre-filled.
 *
 * @phase Phase 5: Admin
 * @author Agent (Antigravity)
 * @created 2026-02-15
 */
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import ProductForm from '@/components/admin/product-form'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params
  const supabase = createAdminClient()
  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

  if (!product) notFound()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-serif font-bold text-foreground">تعديل: {product.title}</h1>
      <ProductForm id={id} defaultValues={product} />
    </div>
  )
}
