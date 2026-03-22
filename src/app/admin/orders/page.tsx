/**
 * Admin Orders Page
 *
 * Lists all orders with filtering by status.
 *
 * @phase Phase 5: Admin
 * @author Agent (Antigravity)
 * @created 2026-02-15
 */
import { createAdminClient } from '@/lib/supabase/server'
import OrdersTable from '@/components/admin/orders-table'

async function getOrders() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('orders')
    .select(`
      id, status, paid_amount, currency,
      guest_email, guest_name, guest_phone,
      payment_method, payment_gateway, installment_plan,
      coupon_code, discount_amount,
      created_at, completed_at,
      product:products(title, slug)
    `)
    .order('created_at', { ascending: false })
    .limit(100)
  return data ?? []
}

export default async function AdminOrdersPage() {
  const orders = await getOrders()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-serif font-bold text-foreground">الطلبات</h1>
      <OrdersTable orders={orders} />
    </div>
  )
}
