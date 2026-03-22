/**
 * Admin Coupons API
 *
 * GET   /api/admin/coupons — list all coupons
 * POST  /api/admin/coupons — create coupon
 * PATCH /api/admin/coupons — toggle active status (body: { id, is_active })
 *
 * @auth Required (admin via middleware)
 * @phase Phase 5: Admin
 * @author Agent (Antigravity)
 * @created 2026-02-15
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'

const couponSchema = z.object({
  code: z.string().min(3).max(50).toUpperCase(),
  discount_type: z.enum(['percentage', 'fixed']),
  discount_value: z.number().positive(),
  min_amount: z.number().positive().optional(),
  max_discount: z.number().positive().optional(),
  product_id: z.string().uuid().optional(),
  max_uses: z.number().int().positive().optional(),
  valid_from: z.string().datetime(),
  valid_until: z.string().datetime().optional(),
  is_active: z.boolean().default(true),
})

const toggleSchema = z.object({
  id: z.string().uuid(),
  is_active: z.boolean(),
})

export async function GET(_req: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('[Admin Coupons GET]', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch coupons' } },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validated = couponSchema.parse(body)

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('coupons')
      .insert(validated)
      .select()
      .single()

    if (error) {
      // Duplicate code
      if (error.code === '23505') {
        return NextResponse.json(
          { error: { code: 'CONFLICT', message: 'Coupon code already exists' } },
          { status: 409 }
        )
      }
      throw error
    }
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: error.issues } },
        { status: 400 }
      )
    }
    console.error('[Admin Coupons POST]', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create coupon' } },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, is_active } = toggleSchema.parse(body)

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('coupons')
      .update({ is_active })
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
    console.error('[Admin Coupons PATCH]', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update coupon' } },
      { status: 500 }
    )
  }
}
