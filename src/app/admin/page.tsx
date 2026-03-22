/**
 * Admin Dashboard Page
 *
 * Shows key stats: revenue, orders, products.
 *
 * @endpoint GET /admin
 * @auth Required
 * @phase Phase 5: Admin
 * @author Agent (Antigravity)
 * @created 2026-02-15
 */
import { createAdminClient } from '@/lib/supabase/server'
import { TrendingUp, ShoppingBag, Package, Clock } from 'lucide-react'

interface Stats {
  totalRevenue: number
  totalOrders: number
  completedOrders: number
  pendingOrders: number
  totalProducts: number
}

async function getStats(): Promise<Stats> {
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
  const byStatus = (ordersRes.data ?? []).reduce(
    (acc: Record<string, number>, o: { status: string }) => {
      acc[o.status] = (acc[o.status] ?? 0) + 1
      return acc
    },
    {}
  )

  return {
    totalRevenue,
    totalOrders: (ordersRes.data ?? []).length,
    completedOrders: byStatus['completed'] ?? 0,
    pendingOrders: byStatus['pending'] ?? 0,
    totalProducts: productsRes.count ?? 0,
  }
}

async function getRecentOrders() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('orders')
    .select('id, guest_name, guest_email, paid_amount, status, created_at, product:products(title)')
    .order('created_at', { ascending: false })
    .limit(8)
  return data ?? []
}

const statusColors: Record<string, string> = {
  completed: 'text-emerald-400 bg-emerald-400/10',
  pending: 'text-yellow-400 bg-yellow-400/10',
  failed: 'text-red-400 bg-red-400/10',
  refunded: 'text-zinc-400 bg-zinc-400/10',
}

const statusLabels: Record<string, string> = {
  completed: 'مكتمل',
  pending: 'معلق',
  failed: 'فشل',
  refunded: 'مسترد',
}

export default async function AdminDashboard() {
  const [stats, recentOrders] = await Promise.all([getStats(), getRecentOrders()])

  const statCards = [
    { label: 'إجمالي الإيرادات', value: `${stats.totalRevenue.toLocaleString()} EGP`, icon: TrendingUp, color: 'text-cyan-glow' },
    { label: 'إجمالي الطلبات', value: stats.totalOrders, icon: ShoppingBag, color: 'text-blue-400' },
    { label: 'طلبات مكتملة', value: stats.completedOrders, icon: ShoppingBag, color: 'text-emerald-400' },
    { label: 'طلبات معلقة', value: stats.pendingOrders, icon: Clock, color: 'text-yellow-400' },
    { label: 'المنتجات', value: stats.totalProducts, icon: Package, color: 'text-purple-400' },
  ]

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-serif font-bold text-foreground">الداشبورد</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-cold-dark border border-border rounded-xl p-5">
            <card.icon size={20} className={`mb-3 ${card.color}`} />
            <p className="text-2xl font-bold text-foreground">{card.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-cold-dark border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-foreground">آخر الطلبات</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-right px-6 py-3 font-medium">العميل</th>
                <th className="text-right px-6 py-3 font-medium">المنتج</th>
                <th className="text-right px-6 py-3 font-medium">المبلغ</th>
                <th className="text-right px-6 py-3 font-medium">الحالة</th>
                <th className="text-right px-6 py-3 font-medium">التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order: {
                id: string
                guest_name: string | null
                guest_email: string | null
                paid_amount: number
                status: string
                created_at: string
                product: { title: string } | { title: string }[] | null
              }) => {
                const product = Array.isArray(order.product) ? order.product[0] : order.product
                return (
                <tr key={order.id} className="border-b border-border/50 hover:bg-white/2 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-foreground">{order.guest_name ?? '—'}</p>
                    <p className="text-xs text-muted-foreground">{order.guest_email}</p>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {product?.title ?? '—'}
                  </td>
                  <td className="px-6 py-4 font-medium text-foreground">
                    {order.paid_amount.toLocaleString()} EGP
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status] ?? ''}`}>
                      {statusLabels[order.status] ?? order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground text-xs">
                    {new Date(order.created_at).toLocaleDateString('ar-EG')}
                  </td>
                </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
