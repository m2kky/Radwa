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
import Link from 'next/link'
import { TrendingUp, ShoppingBag, Package, Clock } from 'lucide-react'
import PopupManager from '@/components/admin/popup-manager'

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

async function getRecentContacts() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('contacts')
    .select('id, name, email, company, service, message, created_at')
    .order('created_at', { ascending: false })
    .limit(10)

  return data ?? []
}

async function getLatestPopup() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('site_popups')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return data ?? null
}

async function getRecentPopupLeads() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('popup_leads')
    .select('id, popup_id, name, email, phone, source_path, created_at')
    .order('created_at', { ascending: false })
    .limit(20)

  return data ?? []
}

interface BookingOverview {
  totalBookings: number
  upcomingBookings: number
  activeEventTypes: number
}

interface UpcomingBooking {
  id: string
  client_name: string
  booking_date: string
  start_time: string
  end_time: string
  event_types: { title: string } | null
}

async function getBookingOverview(): Promise<BookingOverview> {
  const supabase = createAdminClient()
  const today = new Date(new Date().toDateString())

  const [bookingsRes, eventTypesRes] = await Promise.all([
    supabase.from('bookings').select('id, booking_date'),
    supabase.from('event_types').select('id', { count: 'exact', head: true }).eq('is_active', true),
  ])

  const bookings = bookingsRes.data ?? []
  const upcomingBookings = bookings.filter((b) => new Date(b.booking_date) >= today).length

  return {
    totalBookings: bookings.length,
    upcomingBookings,
    activeEventTypes: eventTypesRes.count ?? 0,
  }
}

async function getUpcomingBookings(): Promise<UpcomingBooking[]> {
  const supabase = createAdminClient()
  const todayIso = new Date(new Date().toDateString()).toISOString().slice(0, 10)
  const { data } = await supabase
    .from('bookings')
    .select('id, client_name, booking_date, start_time, end_time, event_types(title)')
    .gte('booking_date', todayIso)
    .order('booking_date', { ascending: true })
    .order('start_time', { ascending: true })
    .limit(6)

  const rows = (data ?? []) as Array<{
    id: string
    client_name: string
    booking_date: string
    start_time: string
    end_time: string
    event_types: { title: string } | { title: string }[] | null
  }>

  return rows.map((row) => ({
    ...row,
    event_types: Array.isArray(row.event_types) ? (row.event_types[0] ?? null) : row.event_types,
  }))
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
  const [stats, recentOrders, recentContacts, latestPopup, recentPopupLeads, bookingOverview, upcomingBookings] = await Promise.all([
    getStats(),
    getRecentOrders(),
    getRecentContacts(),
    getLatestPopup(),
    getRecentPopupLeads(),
    getBookingOverview(),
    getUpcomingBookings(),
  ])

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

      <div className="bg-cold-dark border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-foreground">إدارة الحجوزات والاستشارات</h2>
            <p className="text-xs text-muted-foreground mt-1">تحكم سريع في نظام الحجز من مكان واحد.</p>
          </div>
          <Link
            href="/book"
            target="_blank"
            className="text-xs bg-cyan-glow/10 text-cyan-glow border border-cyan-glow/30 px-3 py-1.5 rounded-lg hover:bg-cyan-glow/20"
          >
            فتح صفحة الحجز
          </Link>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-cold-black border border-border rounded-lg px-4 py-3">
              <p className="text-xs text-muted-foreground">إجمالي الحجوزات</p>
              <p className="text-xl font-bold text-foreground mt-1">{bookingOverview.totalBookings}</p>
            </div>
            <div className="bg-cold-black border border-border rounded-lg px-4 py-3">
              <p className="text-xs text-muted-foreground">الحجوزات القادمة</p>
              <p className="text-xl font-bold text-foreground mt-1">{bookingOverview.upcomingBookings}</p>
            </div>
            <div className="bg-cold-black border border-border rounded-lg px-4 py-3">
              <p className="text-xs text-muted-foreground">أنواع الجلسات النشطة</p>
              <p className="text-xl font-bold text-foreground mt-1">{bookingOverview.activeEventTypes}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href="/admin/event-types" className="text-xs px-3 py-2 rounded-lg border border-border text-foreground hover:bg-white/5">أنواع الجلسات</Link>
            <Link href="/admin/availability" className="text-xs px-3 py-2 rounded-lg border border-border text-foreground hover:bg-white/5">التوفر الأسبوعي</Link>
            <Link href="/admin/bookings" className="text-xs px-3 py-2 rounded-lg border border-border text-foreground hover:bg-white/5">كل الحجوزات</Link>
            <Link href="/admin/booking-profile" className="text-xs px-3 py-2 rounded-lg border border-border text-foreground hover:bg-white/5">بروفايل الحجز</Link>
          </div>

          <div className="bg-cold-black border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">أقرب الحجوزات القادمة</h3>
            </div>
            {upcomingBookings.length > 0 ? (
              <div className="divide-y divide-border">
                {upcomingBookings.map((booking) => (
                  <div key={booking.id} className="px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                    <div>
                      <p className="text-foreground font-medium">{booking.client_name}</p>
                      <p className="text-xs text-muted-foreground">{booking.event_types?.title ?? 'جلسة'}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(booking.booking_date).toLocaleDateString('ar-EG')} | {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="px-4 py-6 text-sm text-muted-foreground text-center">لا توجد حجوزات قادمة حالياً.</p>
            )}
          </div>
        </div>
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

      <PopupManager
        initialPopup={latestPopup as Record<string, unknown> | null}
        initialLeads={recentPopupLeads as Array<Record<string, unknown>>}
      />

      <div className="bg-cold-dark border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-foreground">رسائل التواصل</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-right px-6 py-3 font-medium">الاسم</th>
                <th className="text-right px-6 py-3 font-medium">الإيميل</th>
                <th className="text-right px-6 py-3 font-medium">الخدمة</th>
                <th className="text-right px-6 py-3 font-medium">الرسالة</th>
                <th className="text-right px-6 py-3 font-medium">التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {recentContacts.map((contact: {
                id: string
                name: string
                email: string
                company: string | null
                service: string
                message: string
                created_at: string
              }) => (
                <tr key={contact.id} className="border-b border-border/50 hover:bg-white/2 transition-colors align-top">
                  <td className="px-6 py-4">
                    <p className="font-medium text-foreground">{contact.name}</p>
                    {contact.company ? (
                      <p className="text-xs text-muted-foreground">{contact.company}</p>
                    ) : null}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{contact.email}</td>
                  <td className="px-6 py-4 text-foreground">{contact.service}</td>
                  <td className="px-6 py-4 text-muted-foreground max-w-sm">{contact.message}</td>
                  <td className="px-6 py-4 text-muted-foreground text-xs">
                    {new Date(contact.created_at).toLocaleString('ar-EG')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {recentContacts.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">لا توجد رسائل تواصل حتى الآن</p>
        ) : null}
      </div>
    </div>
  )
}
