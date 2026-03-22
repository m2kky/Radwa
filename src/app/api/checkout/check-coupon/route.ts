/**
 * Check Coupon API Route
 *
 * Validates a coupon code against a product and returns discount info.
 *
 * @endpoint POST /api/checkout/check-coupon
 * @auth Not required
 * @phase Phase 3: Post-Payment
 * @author Agent (Antigravity)
 * @created 2026-02-15
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'

const schema = z.object({
  code:       z.string().min(1),
  product_id: z.string().uuid(),
  amount:     z.number().positive(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { code, product_id, amount } = schema.parse(body)

    const admin = createAdminClient()

    const { data: coupon } = await admin
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .maybeSingle()

    if (!coupon) {
      return NextResponse.json(
        { error: { code: 'INVALID_COUPON', message: 'كود الخصم غير صالح' } },
        { status: 404 }
      )
    }

    const now = new Date()
    const validFrom  = new Date(coupon.valid_from)
    const validUntil = coupon.valid_until ? new Date(coupon.valid_until) : null

    if (now < validFrom || (validUntil && now > validUntil)) {
      return NextResponse.json(
        { error: { code: 'COUPON_EXPIRED', message: 'كود الخصم منتهي الصلاحية' } },
        { status: 400 }
      )
    }

    if (coupon.max_uses !== null && coupon.usage_count >= coupon.max_uses) {
      return NextResponse.json(
        { error: { code: 'COUPON_EXHAUSTED', message: 'تم استنفاد هذا الكود' } },
        { status: 400 }
      )
    }

    if (coupon.product_id !== null && coupon.product_id !== product_id) {
      return NextResponse.json(
        { error: { code: 'COUPON_NOT_APPLICABLE', message: 'هذا الكود لا ينطبق على هذا المنتج' } },
        { status: 400 }
      )
    }

    if (coupon.min_amount !== null && amount < coupon.min_amount) {
      return NextResponse.json(
        { error: { code: 'BELOW_MIN_AMOUNT', message: `الحد الأدنى للطلب ${coupon.min_amount} جنيه` } },
        { status: 400 }
      )
    }

    // Calculate discount
    let discount = coupon.discount_type === 'percentage'
      ? (amount * coupon.discount_value) / 100
      : coupon.discount_value

    if (coupon.max_discount !== null) discount = Math.min(discount, coupon.max_discount)
    discount = Math.min(discount, amount) // can't exceed total

    return NextResponse.json({
      success: true,
      data: {
        discount_amount: parseFloat(discount.toFixed(2)),
        final_amount:    parseFloat((amount - discount).toFixed(2)),
        discount_type:   coupon.discount_type,
        discount_value:  coupon.discount_value,
      },
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: error.issues } },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    )
  }
}
