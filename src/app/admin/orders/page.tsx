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
      user_id,
      guest_email, guest_name, guest_phone,
      payment_method, payment_gateway, installment_plan,
      coupon_code, discount_amount,
      created_at, completed_at,
      product:products(title, slug),
      user:users(name, phone)
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  const orders = (data ?? []) as Array<{
    id: string
    status: string
    paid_amount: number
    currency: string
    user_id: string | null
    guest_email: string | null
    guest_name: string | null
    guest_phone: string | null
    payment_method: string | null
    payment_gateway: string | null
    installment_plan: string | null
    coupon_code: string | null
    discount_amount: number
    created_at: string
    completed_at: string | null
    product: { title: string; slug: string } | { title: string; slug: string }[] | null
    user: { name: string | null; phone: string | null } | { name: string | null; phone: string | null }[] | null
  }>

  const ids = Array.from(
    new Set(
      orders
        .filter((order) => order.user_id && !order.guest_email)
        .map((order) => order.user_id as string)
    )
  )

  const emailByUserId = new Map<string, string>()
  if (ids.length > 0) {
    const authResults = await Promise.allSettled(
      ids.map((id) => supabase.auth.admin.getUserById(id))
    )

    authResults.forEach((result, index) => {
      if (result.status !== 'fulfilled') return
      const email = result.value.data.user?.email
      if (!email) return
      emailByUserId.set(ids[index], email)
    })
  }

  return orders.map((order) => {
    const user = Array.isArray(order.user) ? order.user[0] : order.user
    const fallbackEmail = order.user_id ? emailByUserId.get(order.user_id) ?? null : null

    return {
      ...order,
      customer_name: order.guest_name || user?.name || '—',
      customer_phone: order.guest_phone || user?.phone || null,
      customer_email: order.guest_email || fallbackEmail,
    }
  })
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
