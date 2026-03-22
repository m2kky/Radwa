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
  const apiKey = process.env.PAYMOB_API_KEY
  const integrationIdCard = process.env.PAYMOB_INTEGRATION_ID_CARD
  const integrationIdWallet = process.env.PAYMOB_INTEGRATION_ID_WALLET
  const integrationId = method === 'wallet' ? integrationIdWallet : integrationIdCard
  const iframeId = process.env.PAYMOB_IFRAME_ID

  if (!apiKey || !iframeId) {
    throw new Error('Paymob environment variables not configured')
  }

  if (!integrationId) {
    throw new Error(`Paymob ${method} integration id not configured`)
  }

  const parsedIntegrationId = Number.parseInt(integrationId, 10)
  if (Number.isNaN(parsedIntegrationId)) {
    throw new Error('Invalid Paymob integration id')
  }

  const normalizedPhone = data.customer.phone.replace(/\D/g, '')
  const safePhone = normalizedPhone.length >= 10 ? normalizedPhone : '01000000000'
  const safeName = data.customer.name.trim() || 'Customer'
  const [firstName, ...rest] = safeName.split(/\s+/)

  // Step 1: Auth token
  const authRes = await fetch('https://accept.paymob.com/api/auth/tokens', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: apiKey }),
  })
  const authJson = await authRes.json().catch(() => null)
  const authToken = authJson?.token
  if (!authRes.ok || !authToken) {
    throw new Error(`Paymob auth failed (${authRes.status})`)
  }

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
  const paymobOrder = await orderRes.json().catch(() => null)
  if (!orderRes.ok || !paymobOrder?.id) {
    throw new Error(`Paymob order creation failed (${orderRes.status})`)
  }

  // Store gateway order ID
  const admin = createAdminClient()
  await admin
    .from('orders')
    .update({ gateway_order_id: String(paymobOrder.id) })
    .eq('id', data.orderId)

  // Step 3: Payment key
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
        phone_number: safePhone,
        country:      'EG',
        city:         'NA',
        street:       'NA',
        building:     'NA',
        floor:        'NA',
        apartment:    'NA',
      },
      currency:       data.currency,
      integration_id: parsedIntegrationId,
      lock_order_when_paid: true,
    }),
  })
  const paymentJson = await paymentKeyRes.json().catch(() => null)
  const paymentToken = paymentJson?.token
  if (!paymentKeyRes.ok || !paymentToken) {
    throw new Error(`Paymob payment key failed (${paymentKeyRes.status})`)
  }

  return `https://accept.paymob.com/api/acceptance/iframes/${iframeId}?payment_token=${paymentToken}`
}
