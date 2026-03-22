/**
 * Paymob Payment Initiator
 * Handles card and wallet payment methods
 */
import { createAdminClient } from '@/lib/supabase/server'

interface PaymentData {
  orderId:      string
  amount:       number
  currency:     string
  customer:     { name: string; email: string; phone: string }
  productTitle: string
}

/**
 * Creates a Paymob order and returns the iframe payment URL
 */
export async function initiatePaymob(
  data: PaymentData,
  method: 'card' | 'wallet'
): Promise<string> {
  const apiKey = process.env.PAYMOB_API_KEY!
  const integrationIdCard = process.env.PAYMOB_INTEGRATION_ID_CARD!
  const integrationIdWallet = process.env.PAYMOB_INTEGRATION_ID_WALLET
  const integrationId = method === 'wallet'
    ? (integrationIdWallet || integrationIdCard)
    : integrationIdCard
  const iframeId = process.env.PAYMOB_IFRAME_ID!

  if (!apiKey || !integrationId || !iframeId) {
    throw new Error('Paymob environment variables not configured')
  }

  // Step 1: Auth token
  const authRes = await fetch('https://accept.paymob.com/api/auth/tokens', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: apiKey }),
  })
  const { token: authToken } = await authRes.json()

  // Step 2: Create order
  const orderRes = await fetch('https://accept.paymob.com/api/ecommerce/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      auth_token:      authToken,
      delivery_needed: false,
      amount_cents:    Math.round(data.amount * 100),
      currency:        data.currency,
      merchant_order_id: data.orderId,
      items: [{
        name:        data.productTitle,
        amount_cents: Math.round(data.amount * 100),
        description: data.productTitle,
        quantity:    1,
      }],
    }),
  })
  const paymobOrder = await orderRes.json()

  // Store gateway order ID
  const admin = createAdminClient()
  await admin
    .from('orders')
    .update({ gateway_order_id: String(paymobOrder.id) })
    .eq('id', data.orderId)

  // Step 3: Payment key
  const [firstName, ...rest] = data.customer.name.split(' ')
  const paymentKeyRes = await fetch('https://accept.paymob.com/api/acceptance/payment_keys', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      auth_token:     authToken,
      amount_cents:   Math.round(data.amount * 100),
      expiration:     3600,
      order_id:       paymobOrder.id,
      billing_data: {
        first_name:   firstName,
        last_name:    rest.join(' ') || firstName,
        email:        data.customer.email,
        phone_number: data.customer.phone,
        country:      'EG',
        city:         'NA',
        street:       'NA',
        building:     'NA',
        floor:        'NA',
        apartment:    'NA',
      },
      currency:       data.currency,
      integration_id: parseInt(integrationId),
      lock_order_when_paid: true,
    }),
  })
  const { token: paymentToken } = await paymentKeyRes.json()

  return `https://accept.paymob.com/api/acceptance/iframes/${iframeId}?payment_token=${paymentToken}`
}
