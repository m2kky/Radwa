/**
 * Checkout API Route
 *
 * Creates a pending order and initiates payment with Paymob only.
 * Tokens are created ONLY after webhook confirms payment — never here.
 *
 * @endpoint POST /api/checkout
 * @auth Optional (guest or authenticated)
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { initiatePaymob } from '@/lib/payments/paymob'

const schema = z.object({
  product_id:       z.string().uuid(),
  payment_method:   z.enum(['card', 'wallet']),
  installment_plan: z.enum(['full', '2', '4']).default('full'),
  coupon_code:      z.string().optional(),
  customer: z.object({
    name:  z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(10),
  }),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const input = schema.parse(body)

    const supabase = await createClient()
    const admin = createAdminClient()

    // Get authenticated user if any
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch product
    const { data: product, error: productError } = await admin
      .from('products')
      .select('id, title, price, status, installments_enabled')
      .eq('id', input.product_id)
      .eq('status', 'published')
      .single()

    if (productError || !product) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Product not found' } },
        { status: 404 }
      )
    }

    // Validate installment request
    if (input.installment_plan !== 'full' && !product.installments_enabled) {
      return NextResponse.json(
        { error: { code: 'INSTALLMENTS_DISABLED', message: 'Installments not available for this product' } },
        { status: 400 }
      )
    }

    // Installments require authenticated user
    if (input.installment_plan !== 'full' && !user) {
      return NextResponse.json(
        { error: { code: 'AUTH_REQUIRED', message: 'Login required for installment payments' } },
        { status: 401 }
      )
    }

    // Installments require approved profile (KYC)
    if (input.installment_plan !== 'full' && user) {
      const { data: profile } = await admin
        .from('users')
        .select('installment_status')
        .eq('id', user.id)
        .maybeSingle()

      if (!profile || profile.installment_status !== 'approved') {
        return NextResponse.json(
          { error: { code: 'INSTALLMENT_NOT_APPROVED', message: 'التقسيط يتطلب اعتماد الهوية أولاً' } },
          { status: 403 }
        )
      }
    }

    // Check duplicate purchase (authenticated users only)
    if (user) {
      const { data: existing } = await admin
        .from('orders')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', input.product_id)
        .eq('status', 'completed')
        .maybeSingle()

      if (existing) {
        return NextResponse.json(
          { error: { code: 'ALREADY_PURCHASED', message: 'You already own this product' } },
          { status: 409 }
        )
      }
    }

    // Apply coupon
    let discountAmount = 0
    if (input.coupon_code) {
      const { data: coupon } = await admin
        .from('coupons')
        .select('*')
        .eq('code', input.coupon_code.toUpperCase())
        .eq('is_active', true)
        .maybeSingle()

      if (coupon) {
        const now = new Date()
        const validFrom = new Date(coupon.valid_from)
        const validUntil = coupon.valid_until ? new Date(coupon.valid_until) : null
        const withinLimit = coupon.max_uses === null || coupon.usage_count < coupon.max_uses
        const appliesToProduct = coupon.product_id === null || coupon.product_id === input.product_id

        if (
          now >= validFrom &&
          (validUntil === null || now <= validUntil) &&
          withinLimit &&
          appliesToProduct
        ) {
          if (coupon.discount_type === 'percentage') {
            discountAmount = (product.price * coupon.discount_value) / 100
            if (coupon.max_discount) discountAmount = Math.min(discountAmount, coupon.max_discount)
          } else {
            discountAmount = coupon.discount_value
          }
        }
      }
    }

    const finalAmount = Math.max(0, product.price - discountAmount)

    // Calculate installment amount
    const installmentCount = input.installment_plan === 'full' ? 1 : parseInt(input.installment_plan)
    const installmentAmount = parseFloat((finalAmount / installmentCount).toFixed(2))

    // Create pending order
    const { data: order, error: orderError } = await admin
      .from('orders')
      .insert({
        user_id:          user?.id ?? null,
        guest_email:      user ? null : input.customer.email,
        guest_name:       user ? null : input.customer.name,
        guest_phone:      user ? null : input.customer.phone,
        product_id:       input.product_id,
        original_amount:  product.price,
        paid_amount:      installmentAmount, // first payment amount
        coupon_code:      input.coupon_code ?? null,
        discount_amount:  discountAmount,
        payment_method:   input.payment_method,
        payment_gateway:  'paymob',
        installment_plan: input.installment_plan,
        status:           'pending',
      })
      .select('id')
      .single()

    if (orderError || !order) {
      console.error('[checkout] order insert failed:', orderError)
      return NextResponse.json(
        { error: { code: 'ORDER_FAILED', message: 'Failed to create order' } },
        { status: 500 }
      )
    }

    // Initiate payment
    const paymentData = {
      orderId:    order.id,
      amount:     installmentAmount,
      currency:   'EGP',
      customer:   input.customer,
      productTitle: product.title,
    }

    const paymentUrl = await initiatePaymob(paymentData, input.payment_method)

    return NextResponse.json({ success: true, data: { payment_url: paymentUrl, order_id: order.id } })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: error.issues } },
        { status: 400 }
      )
    }
    console.error('[checkout] unexpected error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    )
  }
}
