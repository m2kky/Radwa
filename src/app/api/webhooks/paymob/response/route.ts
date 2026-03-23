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
import { createAdminClient } from '@/lib/supabase/server'

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

function getFailureParams(searchParams: URLSearchParams): URLSearchParams {
  const out = new URLSearchParams()
  const code =
    searchParams.get('txn_response_code') ||
    searchParams.get('response_code') ||
    searchParams.get('error')
  const message =
    searchParams.get('message') ||
    searchParams.get('error_message') ||
    searchParams.get('data.message')
  const transactionId = searchParams.get('id') || searchParams.get('txn_id')

  if (code) out.set('code', code)
  if (message) out.set('reason', message)
  if (transactionId) out.set('txn', transactionId)
  return out
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams
  const orderId = pickOrderId(params)
  const failureParams = getFailureParams(params)

  if (!orderId) {
    return NextResponse.redirect(new URL('/shop?payment=missing_order', req.nextUrl.origin))
  }

  const hasSuccessFlag = params.has('success')
  const success = isTruthy(params.get('success'))
  const pending = isTruthy(params.get('pending'))

  // Installment callback uses merchant_order_id = inst_{installment_id}
  if (orderId.startsWith('inst_')) {
    return NextResponse.redirect(
      new URL(`/dashboard?installment_paid=1&installment_id=${encodeURIComponent(orderId.slice(5))}`, req.nextUrl.origin)
    )
  }

  // Booking callback uses merchant_order_id = book_{booking_id}
  if (orderId.startsWith('book_')) {
    const bookingId = orderId.slice(5)
    const admin = createAdminClient()
    const { data: booking } = await admin
      .from('bookings')
      .select('event_types(slug)')
      .eq('id', bookingId)
      .maybeSingle()

    const eventType = Array.isArray(booking?.event_types)
      ? booking?.event_types[0]
      : booking?.event_types
    const slug = typeof eventType?.slug === 'string' ? eventType.slug : null
    const base = slug ? `/book/${slug}` : '/book'

    if (pending) {
      return NextResponse.redirect(
        new URL(`${base}?booking_pending=1&booking=${encodeURIComponent(bookingId)}`, req.nextUrl.origin)
      )
    }

    if (hasSuccessFlag && !success) {
      const query = new URLSearchParams({
        booking_failed: '1',
        booking: bookingId,
      })
      for (const [key, value] of failureParams.entries()) {
        query.set(key, value)
      }
      return NextResponse.redirect(
        new URL(`${base}?${query.toString()}`, req.nextUrl.origin)
      )
    }

    return NextResponse.redirect(
      new URL(`${base}?booking_paid=1&booking=${encodeURIComponent(bookingId)}`, req.nextUrl.origin)
    )
  }

  if (pending) {
    return NextResponse.redirect(
      new URL(`/shop?payment=pending&order=${encodeURIComponent(orderId)}`, req.nextUrl.origin)
    )
  }

  if (hasSuccessFlag && !success) {
    const query = new URLSearchParams({
      payment: 'failed',
      order: orderId,
    })
    for (const [key, value] of failureParams.entries()) {
      query.set(key, value)
    }
    return NextResponse.redirect(
      new URL(`/shop?${query.toString()}`, req.nextUrl.origin)
    )
  }

  return NextResponse.redirect(
    new URL(`/success?order=${encodeURIComponent(orderId)}`, req.nextUrl.origin)
  )
}
