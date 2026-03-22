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

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('20') && digits.length === 12) {
    return `0${digits.slice(2)}`
  }
  if (digits.startsWith('2') && digits.length === 12) {
    return `0${digits.slice(1)}`
  }
  if (digits.startsWith('01') && digits.length === 11) {
    return digits
  }
  return digits.length >= 10 ? digits : '01000000000'
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
  const iframeIdCard = process.env.PAYMOB_IFRAME_ID
  const iframeId = iframeIdCard

  if (!apiKey) {
    throw new Error('Paymob environment variables not configured')
  }

  if (method === 'card' && !iframeId) {
    throw new Error('Paymob card iframe id not configured')
  }

  if (!integrationId) {
    throw new Error(`Paymob ${method} integration id not configured`)
  }

  const parsedIntegrationId = Number.parseInt(integrationId, 10)
  if (Number.isNaN(parsedIntegrationId)) {
    throw new Error('Invalid Paymob integration id')
  }

  const safePhone = normalizePhone(data.customer.phone)
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

  if (method === 'wallet') {
    // Wallet flow in Paymob does not use iframe.
    // It requires the wallet mobile number and returns a redirect URL.
    const walletRes = await fetch('https://accept.paymob.com/api/acceptance/payments/pay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: {
          identifier: safePhone,
          subtype: 'WALLET',
        },
        payment_token: paymentToken,
      }),
    })

    const walletJson = await walletRes.json().catch(() => null)
    const redirectUrl =
      walletJson?.redirect_url ??
      walletJson?.redirection_url ??
      walletJson?.iframe_redirection_url ??
      walletJson?.data?.redirect_url ??
      walletJson?.data?.redirection_url ??
      null

    if (!walletRes.ok || !redirectUrl) {
      const walletMessage =
        walletJson?.message ??
        walletJson?.['data.message'] ??
        walletJson?.error ??
        ''
      throw new Error(
        `Paymob wallet pay failed (${walletRes.status})${walletMessage ? `: ${walletMessage}` : ''}`
      )
    }

    return redirectUrl
  }

  return `https://accept.paymob.com/api/acceptance/iframes/${iframeId}?payment_token=${paymentToken}`
}
