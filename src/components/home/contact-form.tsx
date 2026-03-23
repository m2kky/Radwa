/**
 * ContactForm Section
 *
 * Contact form with persistent submission to the backend.
 * Uses native HTML elements (no shadcn Form) since v2 doesn't have form/textarea components.
 *
 * @phase Phase 4 (updated): Public Pages
 * @author Agent (Antigravity)
 * @created 2026-02-15
 */
'use client'

import { useState } from 'react'
import { z } from 'zod'
import { Loader2, CheckCircle } from 'lucide-react'
import { trackEvent } from '@/lib/analytics'

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  company: z.string().optional(),
  service: z.string().min(1),
  message: z.string().min(10),
})

type FormData = z.infer<typeof schema>

const inputClass = 'w-full bg-white/5 border border-white/10 text-ice-white rounded-xl px-4 h-12 text-sm placeholder:text-white/20 focus:outline-none focus:border-cyan-glow/50 transition-colors'
const selectClass = `${inputClass} cursor-pointer`

interface ContactFormProps {
  contactEmail?: string
  contactPhone?: string
}

export default function ContactForm({
  contactEmail,
  contactPhone,
}: ContactFormProps) {
  const [form, setForm] = useState<Partial<FormData>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const set = (k: keyof FormData, v: string) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = schema.safeParse(form)
    if (!result.success) {
      const errs: Record<string, string> = {}
      result.error.issues.forEach(i => { errs[i.path[0] as string] = i.message })
      setErrors(errs)
      return
    }
    setErrors({})
    setSubmitError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message ?? 'فشل إرسال الطلب')
      trackEvent('generate_lead', {
        form_name: 'contact_form',
        service: result.data.service,
      })
      setSuccess(true)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'فشل إرسال الطلب')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <section className="py-24 mx-4 md:mx-10 mb-20">
        <div className="max-w-4xl mx-auto bg-cold-dark/40 backdrop-blur-md border border-white/10 rounded-3xl p-12 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-serif font-bold text-ice-white mb-2">تسلمنا رسالتك بنجاح!</h3>
          <p className="text-ice-white/70 mb-8 max-w-xs">سأقوم بمراجعة طلبك والرد عليك خلال 24 إلى 48 ساعة.</p>
          <button onClick={() => { setSuccess(false); setForm({}) }}
            className="bg-cyan-glow text-cold-black px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-cyan-glow/90 transition-colors"
          >
            إرسال رسالة جديدة
          </button>
        </div>
      </section>
    )
  }

  return (
    <section id="contact" className="py-24 bg-cold-dark/20 backdrop-blur-[80px] border border-white/5 rounded-[3rem] mx-4 md:mx-10 mb-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-ice-white mb-4">لنبني معاً قصة نجاحك</h2>
          <p className="text-ice-white/70 text-lg">شاركني رؤيتك أو تساؤلاتك، وسأتواصل معك في أقرب فرصة.</p>
          {(contactEmail || contactPhone) && (
            <p className="text-sm text-cyan-glow/80 mt-3" dir="ltr">
              {contactEmail ? `Email: ${contactEmail}` : ''}
              {contactEmail && contactPhone ? ' | ' : ''}
              {contactPhone ? `Phone: ${contactPhone}` : ''}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-cold-dark/40 backdrop-blur-md p-8 md:p-10 rounded-3xl border border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-ice-white mb-1.5">الاسم</label>
              <input value={form.name ?? ''} onChange={e => set('name', e.target.value)} placeholder="الاسم الكامل" className={inputClass} />
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-sm text-ice-white mb-1.5">البريد الإلكتروني</label>
              <input type="email" value={form.email ?? ''} onChange={e => set('email', e.target.value)} placeholder="you@example.com" className={inputClass} dir="ltr" />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-ice-white mb-1.5">الشركة (اختياري)</label>
              <input value={form.company ?? ''} onChange={e => set('company', e.target.value)} placeholder="اسم شركتك" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm text-ice-white mb-1.5">أرغب في الحصول على</label>
              <select value={form.service ?? ''} onChange={e => set('service', e.target.value)} className={selectClass}>
                <option value="" disabled>اختر الخدمة</option>
                <option value="strategy">استشارة استراتيجية</option>
                <option value="training">تمكين فرق العمل</option>
                <option value="audit">مراجعة شاملة للأداء التسويقي</option>
                <option value="other">خدمة أخرى</option>
              </select>
              {errors.service && <p className="text-red-400 text-xs mt-1">{errors.service}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm text-ice-white mb-1.5">الرسالة</label>
            <textarea
              value={form.message ?? ''}
              onChange={e => set('message', e.target.value)}
              placeholder="حدثني عن مشروعك..."
              rows={5}
              className="w-full bg-white/5 border border-white/10 text-ice-white rounded-xl px-4 py-3 text-sm placeholder:text-white/20 focus:outline-none focus:border-cyan-glow/50 transition-colors resize-none"
            />
            {errors.message && <p className="text-red-400 text-xs mt-1">{errors.message}</p>}
          </div>

          {submitError && (
            <p className="text-red-400 text-sm">{submitError}</p>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-cyan-glow text-cold-black h-12 rounded-xl text-base font-bold hover:bg-cyan-glow/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> جاري الإرسال...</> : 'إرسال طلبك'}
          </button>
        </form>
      </div>
    </section>
  )
}
