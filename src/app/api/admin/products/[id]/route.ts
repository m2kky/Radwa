/**
 * Admin Product [id] API
 *
 * GET    /api/admin/products/[id] — get single product
 * PATCH  /api/admin/products/[id] — update product
 * DELETE /api/admin/products/[id] — delete product
 *
 * @auth Required (admin via middleware)
 * @phase Phase 5: Admin
 * @author Agent (Antigravity)
 * @created 2026-02-15
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'

const productFileSchema = z.object({
  name: z.string().min(1),
  storage_path: z.string().min(1),
  size: z.number().int().nonnegative(),
})

const updateSchema = z.object({
  slug: z.string().min(1).optional(),
  type: z.enum(['course', 'digital']).optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  thumbnail_url: z.string().trim().min(1).optional().nullable(),
  price: z.number().positive().optional(),
  compare_at_price: z.number().positive().optional().nullable(),
  installments_enabled: z.boolean().optional(),
  files: z.array(productFileSchema).optional().nullable(),
  is_featured: z.boolean().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  meta_title: z.string().optional().nullable(),
  meta_description: z.string().optional().nullable(),
})

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Product not found' } },
        { status: 404 }
      )
    }
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('[Admin Product GET]', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch product' } },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await req.json()
    const validated = updateSchema.parse(body)

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('products')
      .update({ ...validated, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: error.issues } },
        { status: 400 }
      )
    }
    console.error('[Admin Product PATCH]', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update product' } },
      { status: 500 }
    )
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const supabase = createAdminClient()
    const { error } = await supabase.from('products').delete().eq('id', id)

    if (error) throw error
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('[Admin Product DELETE]', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete product' } },
      { status: 500 }
    )
  }
}
