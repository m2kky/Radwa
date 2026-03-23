/**
 * Success Page
 *
 * Shown after payment redirect. Reads temp token from URL,
 * displays download button valid for 15 minutes.
 *
 * @endpoint GET /success?token=<temp_token>
 * @auth Not required
 * @phase Phase 3: Post-Payment
 * @author Agent (Antigravity)
 * @created 2026-02-15
 */
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import PurchaseTracker from '@/components/analytics/purchase-tracker'

interface Props {
  searchParams: Promise<{ token?: string; order?: string }>
}

export default async function SuccessPage({ searchParams }: Props) {
  const { token: queryToken, order } = await searchParams

  const admin = createAdminClient()

  let tokenRow: {
    token: string
    order_id: string
    product_id: string
    expires_at: string | null
    download_count: number
    max_downloads: number
    products: { title: string } | { title: string }[] | null
  } | null = null

  if (queryToken) {
    const { data } = await admin
      .from('download_tokens')
      .select('token, order_id, product_id, expires_at, download_count, max_downloads, products(title)')
      .eq('token', queryToken)
      .maybeSingle()
    tokenRow = data
  } else if (order) {
    const { data } = await admin
      .from('download_tokens')
      .select('token, order_id, product_id, expires_at, download_count, max_downloads, products(title)')
      .eq('order_id', order)
      .not('expires_at', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    tokenRow = data
  } else {
    return <ErrorState message="رابط غير صالح" />
  }

  if (!tokenRow && order) {
    const { data: orderRow } = await admin
      .from('orders')
      .select('status')
      .eq('id', order)
      .maybeSingle()

    if (orderRow?.status === 'pending') {
      return <PendingState />
    }
  }

  if (!tokenRow) {
    return <ErrorState message="الرابط غير موجود أو منتهي الصلاحية" />
  }

  const product = Array.isArray(tokenRow.products) ? tokenRow.products[0] : tokenRow.products

  const { data: orderRow } = await admin
    .from('orders')
    .select('id, paid_amount, currency, coupon_code')
    .eq('id', tokenRow.order_id)
    .maybeSingle()

  const isExpired = tokenRow.expires_at && new Date(tokenRow.expires_at) < new Date()
  const isExhausted = tokenRow.download_count >= tokenRow.max_downloads

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      {orderRow ? (
        <PurchaseTracker
          orderId={orderRow.id}
          amount={orderRow.paid_amount}
          currency={orderRow.currency ?? 'EGP'}
          productId={tokenRow.product_id}
          productName={product?.title ?? undefined}
          coupon={orderRow.coupon_code}
        />
      ) : null}
      <div className="max-w-md w-full text-center space-y-6">
        <div className="text-5xl">🎉</div>
        <h1 className="text-2xl font-bold font-serif">تم الدفع بنجاح!</h1>
        <p className="text-muted-foreground">
          شكراً لشرائك <span className="text-foreground font-medium">{product?.title ?? 'منتجك'}</span>
        </p>

        {isExpired || isExhausted ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              انتهت صلاحية زرار التحميل المؤقت. تحقق من إيميلك للحصول على رابط التحميل الدائم.
            </p>
            <Link href="/dashboard">
              <Button variant="outline" className="w-full">الذهاب للداشبورد</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <a href={`/download/${tokenRow.token}?from=success`}>
              <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                تحميل الآن
              </Button>
            </a>
            <p className="text-xs text-muted-foreground">
              هذا الزرار صالح لمدة 15 دقيقة فقط. تم إرسال رابط دائم على إيميلك.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}

function PendingState() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-4">
        <p className="text-muted-foreground">
          الدفع قيد التأكيد الآن. جرّب تحديث الصفحة خلال دقيقة أو تحقق من بريدك الإلكتروني.
        </p>
        <Link href="/dashboard">
          <Button variant="outline" className="w-full">الذهاب للداشبورد</Button>
        </Link>
      </div>
    </main>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <p className="text-muted-foreground">{message}</p>
        <Link href="/shop">
          <Button variant="outline">العودة للمتجر</Button>
        </Link>
      </div>
    </main>
  )
}
