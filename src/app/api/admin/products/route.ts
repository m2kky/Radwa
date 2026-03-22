/**
 * Admin Products API
 *
 * GET  /api/admin/products — list all products
 * POST /api/admin/products — create new product
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

const productSchema = z.object({
  slug: z.string().min(1),
  type: z.enum(['course', 'digital']),
  title: z.string().min(1),
  description: z.string().optional(),
  thumbnail_url: z.string().trim().min(1).optional().nullable(),
  price: z.number().positive(),
  compare_at_price: z.number().positive().optional().nullable(),
  installments_enabled: z.boolean().default(false),
  files: z.array(productFileSchema).optional().nullable(),
  is_featured: z.boolean().default(false),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  meta_title: z.string().optional().nullable(),
  meta_description: z.string().optional().nullable(),
})

export async function GET(_req: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('products')
      .select('id, slug, title, price, status, is_featured, installments_enabled, created_at')
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('[Admin Products GET]', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch products' } },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validated = productSchema.parse(body)

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('products')
      .insert(validated)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: error.issues } },
        { status: 400 }
      )
    }
    console.error('[Admin Products POST]', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create product' } },
      { status: 500 }
    )
  }
}
