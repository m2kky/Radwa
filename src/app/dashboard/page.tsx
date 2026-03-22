/**
 * Dashboard Page
 *
 * Shows purchases (with download links) and pending installments.
 *
 * @endpoint GET /dashboard
 * @auth Required
 * @phase Phase 3 + Phase 2 (installments)
 * @author Agent (Antigravity)
 * @created 2026-02-15
 * @updated 2026-02-15
 */
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import InstallmentPayButton from '@/components/features/installment-pay-button'

export const metadata = { title: 'مشترياتي' }

function getCairoDateString(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Cairo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const admin = createAdminClient()

  interface OrderRow {
    id: string
    created_at: string
    paid_amount: number
    installment_plan: string
    status: string
    products: { title: string } | { title: string }[] | null
    download_tokens: { token: string; expires_at: string | null }[]
  }

  interface InstallmentRow {
    id: string
    order_id: string
    amount: number
    due_date: string
    status: string
    orders: { products: { title: string } | { title: string }[] | null } | null
  }

  const profileQuery = admin
    .from('users')
    .select('installment_status, rejection_reason')
    .eq('id', user.id)
    .maybeSingle()

  const ordersQuery = admin
      .from('orders')
      .select('id, created_at, paid_amount, installment_plan, status, products(title), download_tokens(token, expires_at)')
      .eq('user_id', user.id)
      .in('status', ['completed', 'suspended'])
      .order('created_at', { ascending: false })
      .returns<OrderRow[]>()

  const installmentsQuery = admin
      .from('installment_payments')
      .select('id, order_id, amount, due_date, status, orders(products(title))')
      .eq('user_id', user.id)
      .in('status', ['pending', 'overdue'])
      .order('due_date', { ascending: true })
      .returns<InstallmentRow[]>()

  const [{ data: profile }, { data: orders }, { data: installments }] = await Promise.all([
    profileQuery,
    ordersQuery,
    installmentsQuery,
  ])

  const installmentStatus = profile?.installment_status ?? 'none'
  const rejectionReason = profile?.rejection_reason
  const today = getCairoDateString()
  const blockedOrderIds = new Set(
    (installments ?? [])
      .filter((inst) => inst.status === 'overdue' || inst.due_date < today)
      .map((inst) => inst.order_id)
  )

  return (
    <main className="container max-w-3xl mx-auto px-4 py-12 space-y-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">مشترياتي</h1>
        <form action="/api/auth/logout" method="POST">
          <Button variant="ghost" size="sm" type="submit">خروج</Button>
        </form>
      </div>

      {installmentStatus !== 'approved' && (
        <section className="rounded-lg border border-border bg-card p-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            {installmentStatus === 'pending'
              ? 'طلب تفعيل التقسيط قيد المراجعة حاليًا.'
              : installmentStatus === 'rejected'
                ? `تم رفض طلب التفعيل${rejectionReason ? `: ${rejectionReason}` : ''}.`
                : 'التقسيط يتطلب رفع بيانات التحقق أولًا.'}
          </p>
          <Link href="/dashboard/kyc">
            <Button size="sm" variant="outline">تفعيل التقسيط</Button>
          </Link>
        </section>
      )}

      {/* Pending installments */}
      {installments && installments.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-primary uppercase tracking-widest">أقساط متبقية</h2>
          {installments.map(inst => {
            const installmentProduct = inst.orders
              ? (Array.isArray(inst.orders.products) ? inst.orders.products[0] : inst.orders.products)
              : null
            const isOverdue = inst.status === 'overdue' || inst.due_date < today

            return (
              <div key={inst.id} className={`bg-card rounded-lg p-4 flex items-center justify-between gap-4 ${
                isOverdue ? 'border border-red-500/40' : 'border border-primary/30'
              }`}>
                <div className="space-y-1">
                  <p className="font-medium">{installmentProduct?.title ?? '—'}</p>
                  <p className="text-sm text-muted-foreground">
                    {inst.amount} ج.م · تاريخ الاستحقاق: {new Date(inst.due_date).toLocaleDateString('ar-EG')}
                  </p>
                  {isOverdue && (
                    <p className="text-xs text-red-400">متأخر السداد - تم إيقاف التحميل مؤقتًا حتى الدفع</p>
                  )}
                </div>
                <InstallmentPayButton installmentId={inst.id} amount={inst.amount} />
              </div>
            )
          })}
        </section>
      )}

      {/* Purchases */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">مشترياتي</h2>

        {!orders || orders.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <p className="text-muted-foreground">لا توجد مشتريات بعد</p>
            <Link href="/shop"><Button>تصفح المتجر</Button></Link>
          </div>
        ) : (
          orders.map(order => {
            const product = Array.isArray(order.products) ? order.products[0] : order.products
            const permanentToken = order.download_tokens?.find(t => t.expires_at === null)
            const isLockedByInstallment =
              order.installment_plan !== 'full' &&
              (blockedOrderIds.has(order.id) || order.status === 'suspended')
            return (
              <div key={order.id} className="bg-card border border-border rounded-lg p-5 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="font-medium">{product?.title ?? '—'}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString('ar-EG')}
                    {order.installment_plan !== 'full' && (
                      <span className="mr-2 text-primary">· أقساط ({order.installment_plan})</span>
                    )}
                  </p>
                  {isLockedByInstallment && (
                    <p className="text-xs text-red-400">المنتج مقفول مؤقتًا لوجود قسط متأخر</p>
                  )}
                </div>
                {permanentToken && !isLockedByInstallment ? (
                  <a href={`/download/${permanentToken.token}`}>
                    <Button size="sm">تحميل</Button>
                  </a>
                ) : isLockedByInstallment ? (
                  <Button size="sm" variant="outline" disabled>
                    مقفول لحين السداد
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground">لا يوجد ملف</span>
                )}
              </div>
            )
          })
        )}
      </section>
    </main>
  )
}
