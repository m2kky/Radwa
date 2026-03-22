/**
 * Paymob Response Callback
 *
 * Browser redirect endpoint configured in Paymob dashboard.
 * Extracts merchant order id from query params and redirects
 * to the unified success page in this app.
 *
 * @endpoint GET /api/webhooks/paymob/response
 * @auth None
 */
import { NextRequest, NextResponse } from 'next/server'

function pickOrderId(searchParams: URLSearchParams): string | null {
  const candidates = [
    searchParams.get('merchant_order_id'),
    searchParams.get('merchant_order'),
    searchParams.get('order'),
  ]

  for (const id of candidates) {
    if (id && id.trim().length > 0) return id
  }

  return null
}

function isTruthy(value: string | null): boolean {
  if (!value) return false
  const normalized = value.trim().toLowerCase()
  return normalized === 'true' || normalized === '1'
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams
  const orderId = pickOrderId(params)

  if (!orderId) {
    return NextResponse.redirect(new URL('/shop?payment=missing_order', req.nextUrl.origin))
  }

  const hasSuccessFlag = params.has('success')
  const success = isTruthy(params.get('success'))
  const pending = isTruthy(params.get('pending'))

  if (pending) {
    return NextResponse.redirect(
      new URL(`/shop?payment=pending&order=${encodeURIComponent(orderId)}`, req.nextUrl.origin)
    )
  }

  if (hasSuccessFlag && !success) {
    return NextResponse.redirect(
      new URL(`/shop?payment=failed&order=${encodeURIComponent(orderId)}`, req.nextUrl.origin)
    )
  }

  // Installment callback uses merchant_order_id = inst_{installment_id}
  if (orderId.startsWith('inst_')) {
    return NextResponse.redirect(
      new URL(`/dashboard?installment_paid=1&installment_id=${encodeURIComponent(orderId.slice(5))}`, req.nextUrl.origin)
    )
  }

  return NextResponse.redirect(
    new URL(`/success?order=${encodeURIComponent(orderId)}`, req.nextUrl.origin)
  )
}
