/**
 * Admin Stats API
 *
 * Returns revenue totals and order counts for the admin dashboard.
 *
 * @endpoint GET /api/admin/stats
 * @auth Required (admin via middleware)
 * @phase Phase 5: Admin
 * @author Agent (Antigravity)
 * @created 2026-02-15
 */
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest) {
  try {
    const supabase = createAdminClient()

    const [ordersRes, revenueRes, productsRes] = await Promise.all([
      supabase.from('orders').select('status'),
      supabase.from('orders').select('paid_amount').eq('status', 'completed'),
      supabase.from('products').select('id', { count: 'exact', head: true }),
    ])

    const totalRevenue = (revenueRes.data ?? []).reduce(
      (sum: number, o: { paid_amount: number }) => sum + o.paid_amount,
      0
    )

    const ordersByStatus = (ordersRes.data ?? []).reduce(
      (acc: Record<string, number>, o: { status: string }) => {
        acc[o.status] = (acc[o.status] ?? 0) + 1
        return acc
      },
      {}
    )

    return NextResponse.json({
      success: true,
      data: {
        totalRevenue,
        totalOrders: (ordersRes.data ?? []).length,
        completedOrders: ordersByStatus['completed'] ?? 0,
        pendingOrders: ordersByStatus['pending'] ?? 0,
        totalProducts: productsRes.count ?? 0,
      },
    })
  } catch (error) {
    console.error('[Admin Stats] Error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch stats' } },
      { status: 500 }
    )
  }
}
