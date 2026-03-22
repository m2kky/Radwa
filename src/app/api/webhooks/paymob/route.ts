/**
 * Paymob Webhook Handler
 *
 * Verifies HMAC signature then delegates to confirmPayment.
 * Idempotent — safe to receive duplicate callbacks.
 *
 * @endpoint POST /api/webhooks/paymob
 * @auth None (verified via HMAC)
 */
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/server'
import { confirmPayment } from '@/lib/payments/confirm'

interface PaymobSourceData {
  pan?: string
  sub_type?: string
  type?: string
}

interface PaymobOrder {
  id: string | number
  merchant_order_id: string
}

interface PaymobTransaction {
  amount_cents: number
  created_at: string
  currency: string
  error_occured: boolean
  has_parent_transaction: boolean
  id: string | number
  integration_id: string | number
  is_3d_secure: boolean
  is_auth: boolean
  is_capture: boolean
  is_refunded: boolean
  is_standalone_payment: boolean
  is_voided: boolean
  order: PaymobOrder
  owner: string | number
  pending: boolean
  source_data?: PaymobSourceData
  success: boolean
}

function isPaymobTransaction(value: unknown): value is PaymobTransaction {
  if (!value || typeof value !== 'object') return false

  const tx = value as Partial<PaymobTransaction>
  if (typeof tx.amount_cents !== 'number') return false
  if (typeof tx.created_at !== 'string') return false
  if (typeof tx.currency !== 'string') return false
  if (!tx.order || typeof tx.order !== 'object') return false

  const order = tx.order as Partial<PaymobOrder>
  if (typeof order.id === 'undefined') return false
  if (typeof order.merchant_order_id !== 'string') return false

  return true
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const hmacSecret =
    process.env.PAYMOB_HMAC_SECRET ||
    process.env.PAYMOB_HMAC ||
    process.env.PAYMOB_SECRET

  if (!hmacSecret) {
    console.error('[paymob webhook] HMAC secret not set')
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }

  // Verify HMAC
  const receivedHmac = req.nextUrl.searchParams.get('hmac')
  if (!receivedHmac) {
    return NextResponse.json({ error: 'Missing HMAC' }, { status: 401 })
  }

  let payload: unknown
  try {
    payload = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  if (!payload || typeof payload !== 'object' || !('obj' in payload)) {
    return NextResponse.json({ error: 'Invalid payload structure' }, { status: 400 })
  }

  const obj = (payload as { obj: unknown }).obj
  if (!isPaymobTransaction(obj)) {
    return NextResponse.json({ error: 'Invalid payload structure' }, { status: 400 })
  }

  // Paymob HMAC concatenation order (from docs)
  const hmacString = [
    obj.amount_cents,
    obj.created_at,
    obj.currency,
    obj.error_occured,
    obj.has_parent_transaction,
    obj.id,
    obj.integration_id,
    obj.is_3d_secure,
    obj.is_auth,
    obj.is_capture,
    obj.is_refunded,
    obj.is_standalone_payment,
    obj.is_voided,
    obj.order?.id,
    obj.owner,
    obj.pending,
    obj.source_data?.pan,
    obj.source_data?.sub_type,
    obj.source_data?.type,
    obj.success,
  ].join('')

  const expectedHmac = crypto
    .createHmac('sha512', hmacSecret)
    .update(hmacString)
    .digest('hex')

  if (expectedHmac !== receivedHmac.toLowerCase()) {
    console.error('[paymob webhook] HMAC mismatch')
    return NextResponse.json({ error: 'Invalid HMAC' }, { status: 401 })
  }

  // Only process successful transactions
  if (!obj.success || obj.pending) {
    return NextResponse.json({ received: true })
  }

  const admin = createAdminClient()
  const merchantOrderId: string = obj.order.merchant_order_id

  // Installment payment — merchant_order_id starts with 'inst_'
  if (merchantOrderId.startsWith('inst_')) {
    const installmentId = merchantOrderId.replace('inst_', '')

    await admin
      .from('installment_payments')
      .update({
        status:          'paid',
        paid_at:         new Date().toISOString(),
        gateway_order_id: String(obj.order.id),
        gateway_txn_id:   String(obj.id),
      })
      .eq('id', installmentId)
      .eq('status', 'pending')

    console.log('[paymob webhook] installment paid', installmentId)
    return NextResponse.json({ received: true })
  }

  // Regular order payment
  await admin
    .from('orders')
    .update({ gateway_order_id: String(obj.order.id) })
    .eq('id', merchantOrderId)
    .eq('status', 'pending')

  await confirmPayment({
    gatewayOrderId: String(obj.order.id),
    gatewayTxnId:   String(obj.id),
    amountCents:    obj.amount_cents,
  })

  return NextResponse.json({ received: true })
}
