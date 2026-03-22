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

export async function GET(req: NextRequest) {
  const orderId = pickOrderId(req.nextUrl.searchParams)

  if (!orderId) {
    return NextResponse.redirect(new URL('/shop?payment=missing_order', req.nextUrl.origin))
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
