/**
 * Admin Coupons API
 *
 * GET   /api/admin/coupons — list all coupons
 * POST  /api/admin/coupons — create coupon
 * PATCH /api/admin/coupons — update coupon fields
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

const updateSchema = z.object({
  id: z.string().uuid(),
  code: z.string().min(3).max(50).toUpperCase().optional(),
  discount_type: z.enum(['percentage', 'fixed']).optional(),
  discount_value: z.number().positive().optional(),
  min_amount: z.number().positive().nullable().optional(),
  max_discount: z.number().positive().nullable().optional(),
  product_id: z.string().uuid().nullable().optional(),
  max_uses: z.number().int().positive().nullable().optional(),
  valid_from: z.string().datetime().optional(),
  valid_until: z.string().datetime().nullable().optional(),
  is_active: z.boolean().optional(),
})

const bulkActiveSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
  is_active: z.boolean(),
})

const deleteSchema = z.union([
  z.object({ id: z.string().uuid() }),
  z.object({ ids: z.array(z.string().uuid()).min(1) }),
])

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
    const bulkParsed = bulkActiveSchema.safeParse(body)
    if (bulkParsed.success) {
      const supabase = createAdminClient()
      const { data, error } = await supabase
        .from('coupons')
        .update({ is_active: bulkParsed.data.is_active })
        .in('id', bulkParsed.data.ids)
        .select('*')

      if (error) throw error
      return NextResponse.json({ success: true, data })
    }

    const parsed = updateSchema.parse(body)
    const { id, ...incoming } = parsed

    const updates: Record<string, unknown> = {}
    if (incoming.code !== undefined) updates.code = incoming.code.toUpperCase()
    if (incoming.discount_type !== undefined) updates.discount_type = incoming.discount_type
    if (incoming.discount_value !== undefined) updates.discount_value = incoming.discount_value
    if (incoming.min_amount !== undefined) updates.min_amount = incoming.min_amount
    if (incoming.max_discount !== undefined) updates.max_discount = incoming.max_discount
    if (incoming.product_id !== undefined) updates.product_id = incoming.product_id
    if (incoming.max_uses !== undefined) updates.max_uses = incoming.max_uses
    if (incoming.valid_from !== undefined) updates.valid_from = incoming.valid_from
    if (incoming.valid_until !== undefined) updates.valid_until = incoming.valid_until
    if (incoming.is_active !== undefined) updates.is_active = incoming.is_active

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'No fields to update' } },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('coupons')
      .update(updates)
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

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = deleteSchema.parse(body)
    const ids = 'id' in parsed ? [parsed.id] : parsed.ids

    const supabase = createAdminClient()
    const { error } = await supabase
      .from('coupons')
      .delete()
      .in('id', ids)

    if (error) throw error
    return NextResponse.json({ success: true, data: { deleted: ids.length } })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: error.issues } },
        { status: 400 }
      )
    }
    console.error('[Admin Coupons DELETE]', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete coupon(s)' } },
      { status: 500 }
    )
  }
}
