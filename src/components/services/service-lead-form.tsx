'use client'

import { useState } from 'react'
import { CheckCircle, Loader2 } from 'lucide-react'

interface ServiceLeadFormProps {
  slug: string
  serviceTitle: string
}

interface FormData {
  name: string
  email: string
  phone: string
  company: string
  budget: string
  timeline: string
  message: string
}

const initialForm: FormData = {
  name: '',
  email: '',
  phone: '',
  company: '',
  budget: '',
  timeline: '',
  message: '',
}

const inputClass =
  'w-full rounded-xl border border-border bg-cold-black px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none'

export default function ServiceLeadForm({ slug, serviceTitle }: ServiceLeadFormProps) {
  const [form, setForm] = useState<FormData>(initialForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const set = (key: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const res = await fetch(`/api/services/${encodeURIComponent(slug)}/lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          source_path: window.location.pathname,
        }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error?.message ?? 'تعذر إرسال الطلب')
      setSuccess(true)
      setForm(initialForm)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر إرسال الطلب')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
        <CheckCircle className="mx-auto mb-3 h-9 w-9 text-emerald-400" />
        <h3 className="text-lg font-bold text-foreground">تم إرسال الطلب</h3>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">
          وصلتنا تفاصيل طلبك بخصوص {serviceTitle}. سنراجعها ونرد عليك قريبًا.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <div>
        <h3 className="text-lg font-bold text-foreground">احكي لنا عن احتياجك</h3>
        <p className="mt-1 text-sm text-muted-foreground">املأ البيانات وسنرد عليك بخطوة مناسبة.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <input required value={form.name} onChange={(e) => set('name', e.target.value)} className={inputClass} placeholder="الاسم" />
        <input required type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className={inputClass} placeholder="email@example.com" dir="ltr" />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <input required value={form.phone} onChange={(e) => set('phone', e.target.value)} className={inputClass} placeholder="رقم الموبايل" dir="ltr" />
        <input value={form.company} onChange={(e) => set('company', e.target.value)} className={inputClass} placeholder="الشركة / المشروع" />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <input value={form.budget} onChange={(e) => set('budget', e.target.value)} className={inputClass} placeholder="الميزانية المتوقعة" />
        <input value={form.timeline} onChange={(e) => set('timeline', e.target.value)} className={inputClass} placeholder="التوقيت المتوقع" />
      </div>
      <textarea
        required
        rows={5}
        value={form.message}
        onChange={(e) => set('message', e.target.value)}
        className={`${inputClass} resize-none`}
        placeholder="اكتب تفاصيل الاحتياج، الأهداف، وأي سياق مهم..."
      />

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : null}
        {loading ? 'جاري الإرسال...' : 'إرسال الطلب'}
      </button>
    </form>
  )
}
