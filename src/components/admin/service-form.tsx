'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import RichTextEditor from '@/components/admin/rich-text-editor'
import MediaUploadField from '@/components/admin/media-upload-field'
import type { Service, ServiceCtaType, ServiceStatus } from '@/types'

type ServiceFormData = Partial<Pick<
  Service,
  | 'slug'
  | 'title'
  | 'excerpt'
  | 'content_body'
  | 'thumbnail_url'
  | 'status'
  | 'sort_order'
  | 'cta_type'
  | 'cta_label'
  | 'cta_url'
  | 'meta_title'
  | 'meta_description'
>>

interface Props {
  id?: string
  defaultValues?: ServiceFormData
}

export default function ServiceForm({ id, defaultValues = {} }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<ServiceFormData>({
    slug: '',
    title: '',
    excerpt: '',
    content_body: '',
    thumbnail_url: '',
    status: 'draft',
    sort_order: 0,
    cta_type: 'book',
    cta_label: 'ابدأ الآن',
    cta_url: '',
    meta_title: '',
    meta_description: '',
    ...defaultValues,
  })

  const set = (key: keyof ServiceFormData, value: unknown) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const url = id ? `/api/admin/services/${id}` : '/api/admin/services'
      const method = id ? 'PATCH' : 'POST'
      const payload = {
        ...form,
        excerpt: form.excerpt || null,
        content_body: form.content_body || null,
        thumbnail_url: form.thumbnail_url || null,
        sort_order: Number(form.sort_order || 0),
        cta_label: form.cta_label || 'ابدأ الآن',
        cta_url: form.cta_url || null,
        meta_title: form.meta_title || null,
        meta_description: form.meta_description || null,
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error?.message ?? 'حدث خطأ')
      router.push('/admin/services')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full bg-cold-black border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cyan-glow/50 transition-colors'
  const labelClass = 'block text-sm font-medium text-muted-foreground mb-1.5'

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className={labelClass}>اسم الخدمة *</label>
          <input required value={form.title || ''} onChange={(e) => set('title', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Slug *</label>
          <input required value={form.slug || ''} onChange={(e) => set('slug', e.target.value)} className={inputClass} dir="ltr" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className={labelClass}>الحالة</label>
          <select value={form.status || 'draft'} onChange={(e) => set('status', e.target.value as ServiceStatus)} className={inputClass}>
            <option value="draft">مسودة</option>
            <option value="published">منشور</option>
            <option value="archived">مؤرشف</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>ترتيب الظهور</label>
          <input type="number" value={form.sort_order || 0} onChange={(e) => set('sort_order', Number(e.target.value || 0))} className={inputClass} dir="ltr" />
        </div>
        <div>
          <label className={labelClass}>نوع CTA</label>
          <select value={form.cta_type || 'book'} onChange={(e) => set('cta_type', e.target.value as ServiceCtaType)} className={inputClass}>
            <option value="book">صفحة الحجز</option>
            <option value="link">رابط خارجي/داخلي</option>
            <option value="form">فورم تفصيلي</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className={labelClass}>نص زر CTA</label>
          <input value={form.cta_label || ''} onChange={(e) => set('cta_label', e.target.value)} className={inputClass} placeholder="ابدأ الآن" />
        </div>
        <div>
          <label className={labelClass}>رابط CTA</label>
          <input value={form.cta_url || ''} onChange={(e) => set('cta_url', e.target.value)} className={inputClass} placeholder={form.cta_type === 'book' ? '/book' : 'https://...'} dir="ltr" />
        </div>
      </div>

      <div>
        <label className={labelClass}>وصف مختصر</label>
        <textarea rows={3} value={form.excerpt || ''} onChange={(e) => set('excerpt', e.target.value)} className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>الصورة</label>
        <MediaUploadField
          value={form.thumbnail_url || ''}
          onChange={(value) => set('thumbnail_url', value)}
          folder={`services/${form.slug?.trim() || 'general'}`}
          inputClassName={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>تفاصيل الخدمة (Rich Text)</label>
        <RichTextEditor
          value={form.content_body || ''}
          onChange={(value) => set('content_body', value)}
          placeholder="اكتب تفاصيل الخدمة، لمن تناسب، وما الذي سيحصل عليه العميل..."
        />
      </div>

      <div className="border-t border-border pt-6 space-y-4">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">SEO</p>
        <input value={form.meta_title || ''} onChange={(e) => set('meta_title', e.target.value)} className={inputClass} placeholder="Meta title" />
        <textarea rows={2} value={form.meta_description || ''} onChange={(e) => set('meta_description', e.target.value)} className={inputClass} placeholder="Meta description" />
      </div>

      <div className="flex gap-3 border-t border-border pt-4">
        <button type="submit" disabled={loading} className="rounded-lg bg-cyan-glow px-6 py-2.5 text-sm font-semibold text-cold-black transition-colors hover:bg-cyan-glow/90 disabled:opacity-50">
          {loading ? 'جاري الحفظ...' : id ? 'حفظ التعديلات' : 'إضافة خدمة'}
        </button>
        <button type="button" onClick={() => router.back()} className="rounded-lg border border-border px-6 py-2.5 text-sm text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground">
          إلغاء
        </button>
      </div>
    </form>
  )
}
