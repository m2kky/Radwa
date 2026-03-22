/**
 * Shared post-payment logic
 *
 * Called by Paymob webhook after verifying HMAC.
 * Creates download tokens and sends email.
 * Idempotent — safe to call multiple times for same transaction.
 */
import { createAdminClient } from '@/lib/supabase/server'
import { sendDownloadEmail } from '@/lib/email'
import { v4 as uuidv4 } from 'uuid'

interface ConfirmPaymentParams {
  gatewayOrderId:  string
  gatewayTxnId:    string
  amountCents:     number
}

export async function confirmPayment({
  gatewayOrderId,
  gatewayTxnId,
  amountCents,
}: ConfirmPaymentParams): Promise<void> {
  const admin = createAdminClient()

  // Find pending order by gateway order ID
  const { data: order } = await admin
    .from('orders')
    .select('*, products(title, files)')
    .eq('gateway_order_id', gatewayOrderId)
    .eq('status', 'pending')
    .maybeSingle()

  if (!order) {
    // Already processed or not found — idempotent, just return
    return
  }

  // Verify amount matches (prevent partial payment attacks)
  const expectedCents = Math.round(order.paid_amount * 100)
  if (amountCents < expectedCents) {
    console.error('[confirmPayment] amount mismatch', { expected: expectedCents, received: amountCents })
    return
  }

  // Mark order completed
  await admin
    .from('orders')
    .update({
      status:          'completed',
      gateway_txn_id:  gatewayTxnId,
      completed_at:    new Date().toISOString(),
    })
    .eq('id', order.id)

  // Increment coupon usage
  if (order.coupon_code) {
    try {
      const { error: rpcError } = await admin.rpc('increment_coupon_usage', {
        coupon_code_input: order.coupon_code,
      })

      if (rpcError) {
        // Fallback if RPC is not installed on target DB.
        const { data: couponRow } = await admin
          .from('coupons')
          .select('usage_count')
          .eq('code', order.coupon_code)
          .maybeSingle()

        if (couponRow) {
          await admin
            .from('coupons')
            .update({ usage_count: couponRow.usage_count + 1 })
            .eq('code', order.coupon_code)
        }
      }
    } catch (couponError) {
      // Coupon usage tracking should not block content delivery.
      console.error('[confirmPayment] coupon usage update failed', couponError)
    }
  }

  const email = order.guest_email ?? await getUserEmail(admin, order.user_id)
  if (!email) return

  // Create TWO tokens:
  // 1. Temporary (15 min) — for success page immediate download
  // 2. Permanent (no expiry) — for email link
  const tempToken      = uuidv4()
  const permanentToken = uuidv4()

  const fifteenMinutes = new Date(Date.now() + 15 * 60 * 1000).toISOString()

  await admin.from('download_tokens').insert([
    {
      token:          tempToken,
      order_id:       order.id,
      product_id:     order.product_id,
      user_id:        order.user_id ?? null,
      email,
      max_downloads:  3,
      expires_at:     fifteenMinutes,   // temporary
    },
    {
      token:          permanentToken,
      order_id:       order.id,
      product_id:     order.product_id,
      user_id:        order.user_id ?? null,
      email,
      max_downloads:  999,
      expires_at:     null,             // permanent
    },
  ])

  // Send email with permanent token
  await sendDownloadEmail({
    to:           email,
    productTitle: order.products.title,
    downloadUrl:  `${process.env.NEXT_PUBLIC_APP_URL}/download/${permanentToken}`,
  })

  // Create installment schedule if needed
  if (order.installment_plan !== 'full' && order.user_id) {
    await createInstallmentSchedule(admin, order)
  }
}

async function getUserEmail(admin: ReturnType<typeof createAdminClient>, userId: string | null): Promise<string | null> {
  if (!userId) return null
  const { data } = await admin.auth.admin.getUserById(userId)
  return data.user?.email ?? null
}

async function createInstallmentSchedule(
  admin: ReturnType<typeof createAdminClient>,
  order: { id: string; user_id: string; paid_amount: number; installment_plan: string; original_amount: number; discount_amount: number }
) {
  const totalPayments = parseInt(order.installment_plan)
  const installmentAmount = parseFloat(((order.original_amount - order.discount_amount) / totalPayments).toFixed(2))

  // First payment already done — schedule remaining
  const remaining = []
  for (let i = 1; i < totalPayments; i++) {
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + i * 7) // weekly
    remaining.push({
      order_id:  order.id,
      user_id:   order.user_id,
      amount:    installmentAmount,
      due_date:  dueDate.toISOString().split('T')[0],
      status:    'pending',
    })
  }

  if (remaining.length > 0) {
    await admin.from('installment_payments').insert(remaining)
  }
}
