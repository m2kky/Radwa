/**
 * Admin Orders API
 *
 * GET /api/admin/orders — list all orders with product info
 *
 * @auth Required (admin via middleware)
 * @phase Phase 5: Admin
 * @author Agent (Antigravity)
 * @created 2026-02-15
 */
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') ?? '1')
    const limit = 20
    const from = (page - 1) * limit

    const supabase = createAdminClient()

    let query = supabase
      .from('orders')
      .select(`
        id, status, paid_amount, currency, coupon_code,
        guest_email, guest_name, guest_phone,
        payment_method, payment_gateway, installment_plan,
        created_at, completed_at,
        product:products(id, title, slug)
      `)
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1)

    if (status) query = query.eq('status', status)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ success: true, data, pagination: { page, limit } })
  } catch (error) {
    console.error('[Admin Orders GET]', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch orders' } },
      { status: 500 }
    )
  }
}
