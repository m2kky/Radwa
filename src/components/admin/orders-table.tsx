/**
 * Orders Table Component
 *
 * Client component — supports filtering by status.
 *
 * @phase Phase 5: Admin
 * @author Agent (Antigravity)
 * @created 2026-02-15
 */
'use client'

import { useState } from 'react'

interface Order {
  id: string
  status: string
  paid_amount: number
  currency: string
  customer_email: string | null
  customer_name: string | null
  customer_phone: string | null
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
}

const STATUS_FILTERS = ['الكل', 'completed', 'pending', 'failed', 'refunded']

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

export default function OrdersTable({ orders }: { orders: Order[] }) {
  const [filter, setFilter] = useState('الكل')

  const filtered = filter === 'الكل' ? orders : orders.filter((o) => o.status === filter)

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
              filter === f
                ? 'bg-cyan-glow text-cold-black font-semibold'
                : 'bg-cold-dark border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {statusLabels[f] ?? f}
            <span className="mr-1.5 text-xs opacity-70">
              ({f === 'الكل' ? orders.length : orders.filter((o) => o.status === f).length})
            </span>
          </button>
        ))}
      </div>

      <div className="bg-cold-dark border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-right px-6 py-3 font-medium">العميل</th>
                <th className="text-right px-6 py-3 font-medium">المنتج</th>
                <th className="text-right px-6 py-3 font-medium">المبلغ</th>
                <th className="text-right px-6 py-3 font-medium">الدفع</th>
                <th className="text-right px-6 py-3 font-medium">الحالة</th>
                <th className="text-right px-6 py-3 font-medium">التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => {
                const product = Array.isArray(order.product) ? order.product[0] : order.product
                return (
                <tr key={order.id} className="border-b border-border/50 hover:bg-white/2 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-foreground">{order.customer_name ?? '—'}</p>
                    <p className="text-xs text-muted-foreground">{order.customer_email ?? '—'}</p>
                    {order.customer_phone && (
                      <p className="text-xs text-muted-foreground">{order.customer_phone}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {product?.title ?? '—'}
                    {order.installment_plan && order.installment_plan !== 'full' && (
                      <span className="block text-xs text-cyan-glow/70">تقسيط {order.installment_plan}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-foreground">{order.paid_amount.toLocaleString()} EGP</p>
                    {order.coupon_code && (
                      <p className="text-xs text-cyan-glow/70">كوبون: {order.coupon_code}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground text-xs">
                    <p>{order.payment_gateway ?? '—'}</p>
                    <p>{order.payment_method ?? ''}</p>
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
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-12">لا توجد طلبات</p>
        )}
      </div>
    </div>
  )
}
