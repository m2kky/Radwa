'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, CreditCard, Smartphone } from 'lucide-react'
import { trackEvent } from '@/lib/analytics'
import type { Product } from '@/types'

const schema = z.object({
  name:         z.string().min(2, 'الاسم مطلوب'),
  email:        z.string().email('إيميل غير صحيح'),
  phone:        z.string().min(10, 'رقم الهاتف مطلوب'),
  coupon_code:  z.string().optional(),
})

type FormData = z.infer<typeof schema>

type Method  = 'card' | 'wallet'
type Plan    = 'full' | '2' | '4'

const PAYMOB_METHODS  = [
  { id: 'card'   as Method, label: 'بطاقة بنكية',  icon: CreditCard },
  { id: 'wallet' as Method, label: 'محفظة إلكترونية', icon: Smartphone },
]

export function CheckoutForm({ product }: { product: Product }) {
  const [method,   setMethod]   = useState<Method>('card')
  const [plan,     setPlan]     = useState<Plan>('full')
  const [couponOk, setCouponOk] = useState<number | null>(null) // discount amount
  const [couponLoading, setCouponLoading] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  const { register, handleSubmit, getValues, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const installmentCount = plan === 'full' ? 1 : parseInt(plan)
  const basePrice = couponOk !== null ? product.price - couponOk : product.price
  const perInstallment = basePrice / installmentCount

  async function checkCoupon() {
    const code = getValues('coupon_code')
    if (!code) return
    setCouponLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/checkout/check-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim(),
          product_id: product.id,
          amount: product.price,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setCouponOk(null)
        setError(data?.error?.message ?? 'كود الخصم غير صالح')
        return
      }
      const discountAmount = typeof data?.data?.discount_amount === 'number'
        ? data.data.discount_amount
        : null
      setCouponOk(discountAmount)
      trackEvent('apply_coupon', {
        coupon: code.trim().toUpperCase(),
        value: discountAmount ?? 0,
        currency: 'EGP',
      })
    } catch {
      setCouponOk(null)
      setError('تعذر التحقق من الكوبون الآن')
    } finally {
      setCouponLoading(false)
    }
  }

  async function onSubmit(values: FormData) {
    setLoading(true)
    setError(null)
    try {
      trackEvent('begin_checkout', {
        currency: 'EGP',
        value: basePrice,
        payment_type: method,
        installment_plan: plan,
        items: [
          {
            item_id: product.id,
            item_name: product.title,
            price: product.price,
            quantity: 1,
          },
        ],
      })

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id:       product.id,
          payment_method:   method,
          installment_plan: plan,
          coupon_code:      values.coupon_code || undefined,
          customer: {
            name:  values.name,
            email: values.email,
            phone: values.phone,
          },
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message ?? 'حدث خطأ')
      window.location.href = data.data.payment_url
    } catch (e) {
      setError(e instanceof Error ? e.message : 'حدث خطأ غير متوقع')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">

      {/* Customer Info */}
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">الاسم</Label>
            <Input id="name" placeholder="اسمك الكامل" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="phone">رقم الهاتف</Label>
            <Input id="phone" placeholder="01xxxxxxxxx" dir="ltr" {...register('phone')} />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">الإيميل</Label>
          <Input id="email" type="email" placeholder="email@example.com" dir="ltr" {...register('email')} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
      </div>

      {/* Installment Plan */}
      {product.installments_enabled && (
        <div className="flex flex-col gap-2">
          <Label>طريقة الدفع</Label>
          <div className="grid grid-cols-3 gap-2">
            {(['full', '2', '4'] as Plan[]).map(p => {
              const labels = { full: 'دفعة واحدة', '2': 'قسطين', '4': '4 أقساط' }
              return (
                <button
                  key={p}
                  type="button"
                  disabled={loading}
                  onClick={() => setPlan(p)}
                  className={`py-2.5 px-3 rounded-lg border text-sm font-medium transition-all ${
                    plan === p
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/40'
                  }`}
                >
                  {labels[p]}
                </button>
              )
            })}
          </div>
          {plan !== 'full' && (
            <p className="text-xs text-muted-foreground">
              {perInstallment.toLocaleString('ar-EG')} ج × {installmentCount} = {basePrice.toLocaleString('ar-EG')} ج
            </p>
          )}
          <p className="text-xs text-muted-foreground leading-relaxed">
            التقسيط يتطلب تسجيل الدخول ورفع طلب تفعيل الهوية.
            {' '}
            <Link href="/dashboard/kyc" className="text-primary hover:underline">
              قدم طلب التقسيط من هنا
            </Link>
            {' '}
            أو
            {' '}
            <Link href="/login" className="text-primary hover:underline">
              سجل دخولك
            </Link>
            .
          </p>
        </div>
      )}

      {/* Payment Gateway */}
      <div className="flex flex-col gap-3">
        <Label>وسيلة الدفع عبر Paymob</Label>
        <div className="rounded-xl border border-border p-4">
          <div className="flex gap-2">
            {PAYMOB_METHODS.map((m) => (
              <button
                key={m.id}
                type="button"
                disabled={loading}
                onClick={() => setMethod(m.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-all ${
                  method === m.id
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground'
                }`}
              >
                {m.icon && <m.icon className="w-3 h-3" />}
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Coupon */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="coupon">كود خصم (اختياري)</Label>
        <div className="flex gap-2">
          <Input
            id="coupon"
            placeholder="RADWA25"
            dir="ltr"
            className="uppercase"
            {...register('coupon_code')}
          />
          <Button
            type="button"
            variant="outline"
            onClick={checkCoupon}
            disabled={loading || couponLoading}
            className="shrink-0"
          >
            {couponLoading ? (
              <><Loader2 className="w-4 h-4 animate-spin ml-2" /> جاري الفحص...</>
            ) : 'تطبيق'}
          </Button>
        </div>
        {couponOk !== null && (
          <p className="text-xs text-primary">✓ خصم {couponOk.toLocaleString('ar-EG')} ج تم تطبيقه</p>
        )}
      </div>

      {/* Summary */}
      <div className="rounded-xl bg-card border border-border p-4 flex items-center justify-between">
        <span className="text-muted-foreground text-sm">
          {plan === 'full' ? 'الإجمالي' : `القسط الأول من ${installmentCount}`}
        </span>
        <span className="text-2xl font-bold text-primary">
          {perInstallment.toLocaleString('ar-EG')} ج
        </span>
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-3">{error}</p>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="w-full h-14 text-lg font-bold bg-primary text-primary-foreground hover:bg-primary/90"
      >
        {loading ? (
          <><Loader2 className="w-5 h-5 animate-spin ml-2" /> جاري التحويل...</>
        ) : (
          `ادفع ${perInstallment.toLocaleString('ar-EG')} ج`
        )}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        بالضغط على الدفع توافق على شروط الاستخدام. الدفع آمن ومشفر.
      </p>

      {loading && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-cold-dark border border-border rounded-2xl p-6 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-cyan-glow" />
            <p className="text-foreground font-semibold">جاري تحويلك لبوابة الدفع</p>
            <p className="text-sm text-muted-foreground mt-2">من فضلك لا تغلق الصفحة أو ترجع للخلف.</p>
          </div>
        </div>
      )}
    </form>
  )
}
