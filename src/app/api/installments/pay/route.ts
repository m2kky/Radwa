/**
 * Installment Payment API
 *
 * Initiates payment for the next pending installment.
 * Supports Paymob only (card/wallet).
 *
 * @endpoint POST /api/installments/pay
 * @auth Required
 * @body { installment_id: string, payment_method: 'card' | 'wallet' }
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { initiatePaymob } from '@/lib/payments/paymob'

const schema = z.object({
  installment_id:  z.string().uuid(),
  payment_method:  z.enum(['card', 'wallet']),
})

function normalizePhone(phone: string | null | undefined): string {
  const digits = (phone ?? '').replace(/\D/g, '')
  if (digits.length >= 10 && digits.length <= 15) return digits
  return '01000000000'
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 })
    }

    const body = await req.json()
    const { installment_id, payment_method } = schema.parse(body)

    const admin = createAdminClient()

    // Fetch installment — must belong to this user and be pending
    const { data: installment } = await admin
      .from('installment_payments')
      .select('*, orders(id, currency, products(title))')
      .eq('id', installment_id)
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .single()

    if (!installment) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Installment not found' } }, { status: 404 })
    }

    const { data: authUser } = await admin.auth.admin.getUserById(user.id)
    const email = authUser.user?.email
    if (!email) {
      return NextResponse.json(
        { error: { code: 'PROFILE_INCOMPLETE', message: 'User email is missing' } },
        { status: 400 }
      )
    }

    const { data: profile } = await admin
      .from('users')
      .select('name, phone')
      .eq('id', user.id)
      .maybeSingle()

    const name = (profile?.name ?? authUser.user?.user_metadata?.name ?? 'Customer').trim() || 'Customer'
    const phone = normalizePhone(profile?.phone)

    const paymentData = {
      orderId:      `inst_${installment.id}`,
      amount:       installment.amount,
      currency:     installment.orders.currency,
      customer:     { name, email, phone },
      productTitle: `قسط — ${installment.orders.products.title}`,
    }

    const paymentUrl = await initiatePaymob(paymentData, payment_method)

    return NextResponse.json({ success: true, data: { payment_url: paymentUrl } })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: error.issues } }, { status: 400 })
    }
    console.error('[installments/pay]', error)
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } }, { status: 500 })
  }
}
