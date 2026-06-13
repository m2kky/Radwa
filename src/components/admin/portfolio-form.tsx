'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ImagePlus, Loader2 } from 'lucide-react'
import RichTextEditor from '@/components/admin/rich-text-editor'
import type { PortfolioItem } from '@/types'

interface Props {
  id?: string
  defaultValues?: Partial<PortfolioItem>
}

export default function PortfolioForm({ id, defaultValues = {} }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploadingThumb, setUploadingThumb] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState<Partial<PortfolioItem>>({
    slug: '', title: '', description: '', item_type: 'project',
    thumbnail_url: '', category: '', tags: [], client_name: '',
    year: '', role: '', project_url: '', content_body: '', 
    testimonial: '', is_published: false,
    ...defaultValues,
  })

  // To handle tags as a comma-separated string in the input
  const [tagsInput, setTagsInput] = useState((defaultValues.tags || []).join(', '))

  const set = (key: keyof PortfolioItem, value: unknown) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const url = id ? `/api/admin/portfolio/${id}` : '/api/admin/portfolio'
      const method = id ? 'PATCH' : 'POST'
      
      const payload = {
        ...form,
        tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean),
        thumbnail_url: form.thumbnail_url || null,
        metrics: form.metrics ? form.metrics : null,
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message ?? data.error ?? 'حدث خطأ')
      router.push('/admin/portfolio')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ')
    } finally {
      setLoading(false)
    }
  }

  const handleThumbnailUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadingThumb(true)
    setError(null)
    try {
      const data = new FormData()
      data.append('file', file)
      data.append('folder', `portfolio/${form.slug?.trim() || 'general'}`)

      const res = await fetch('/api/admin/media/upload', {
        method: 'POST',
        body: data,
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error?.message ?? 'فشل رفع الصورة')
      set('thumbnail_url', body.data?.url || '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل رفع الصورة')
    } finally {
      setUploadingThumb(false)
      event.target.value = ''
    }
  }

  const inputClass = 'w-full bg-cold-black border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cyan-glow/50 transition-colors'
  const labelClass = 'block text-sm font-medium text-muted-foreground mb-1.5'

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>عنوان العمل *</label>
          <input required value={form.title || ''} onChange={e => set('title', e.target.value)} className={inputClass} placeholder="اسم المشروع" />
        </div>
        <div>
          <label className={labelClass}>الرابط (Slug) *</label>
          <input required value={form.slug || ''} onChange={e => set('slug', e.target.value)} className={inputClass} placeholder="project-slug" dir="ltr" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>النوع *</label>
          <select value={form.item_type || 'project'} onChange={e => set('item_type', e.target.value)} className={inputClass}>
            <option value="project">مشروع (Project)</option>
            <option value="case_study">دراسة حالة (Case Study)</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>التصنيف</label>
          <input value={form.category || ''} onChange={e => set('category', e.target.value)} className={inputClass} placeholder="مثال: تسويق، تصميم..." />
        </div>
      </div>

      <div>
        <label className={labelClass}>وصف قصير *</label>
        <textarea required rows={2} value={form.description || ''} onChange={e => set('description', e.target.value)} className={inputClass} placeholder="وصف يظهر في الكروت..." />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>اسم العميل</label>
          <input value={form.client_name || ''} onChange={e => set('client_name', e.target.value)} className={inputClass} placeholder="اسم العميل" />
        </div>
        <div>
          <label className={labelClass}>السنة</label>
          <input value={form.year || ''} onChange={e => set('year', e.target.value)} className={inputClass} placeholder="2024" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>دورك في العمل</label>
          <input value={form.role || ''} onChange={e => set('role', e.target.value)} className={inputClass} placeholder="مستشار تسويق، مدير محتوى..." />
        </div>
        <div>
          <label className={labelClass}>رابط المشروع المباشر</label>
          <input value={form.project_url || ''} onChange={e => set('project_url', e.target.value)} className={inputClass} placeholder="https://..." dir="ltr" />
        </div>
      </div>

      <div>
        <label className={labelClass}>الوسوم (Tags)</label>
        <input value={tagsInput} onChange={e => setTagsInput(e.target.value)} className={inputClass} placeholder="افصل بينهم بفاصلة: استراتيجية، إدارة، محتوى..." />
      </div>

      <div>
        <label className={labelClass}>الصورة الرئيسية (Thumbnail/Hero)</label>
        <div className="flex flex-col md:flex-row gap-2">
          <input value={form.thumbnail_url || ''} onChange={e => set('thumbnail_url', e.target.value)} className={inputClass} placeholder="رابط الصورة..." dir="ltr" />
          <label className="inline-flex items-center justify-center gap-2 bg-cold-black border border-border px-3 py-2 rounded-lg text-xs text-foreground cursor-pointer hover:border-cyan-glow/40 transition-colors whitespace-nowrap">
            {uploadingThumb ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
            {uploadingThumb ? 'جاري الرفع...' : 'رفع صورة'}
            <input type="file" accept="image/*" className="hidden" onChange={handleThumbnailUpload} disabled={uploadingThumb} />
          </label>
        </div>
      </div>

      {form.item_type === 'case_study' && (
        <div>
          <label className={labelClass}>رأي العميل (Testimonial)</label>
          <textarea rows={3} value={form.testimonial || ''} onChange={e => set('testimonial', e.target.value)} className={inputClass} placeholder="ماذا قال العميل عن هذا العمل..." />
        </div>
      )}

      <div>
        <label className={labelClass}>التفاصيل (Rich Text)</label>
        <RichTextEditor
          value={form.content_body || ''}
          onChange={(value) => set('content_body', value)}
          placeholder="اكتب تفاصيل المشروع، التحديات، والاستراتيجية هنا..."
        />
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.is_published} onChange={e => set('is_published', e.target.checked)} className="accent-cyan-glow w-4 h-4" />
        <span className="text-sm font-medium text-foreground">نشر العمل (يظهر للجمهور)</span>
      </label>

      <div className="flex gap-3 pt-4 border-t border-border">
        <button type="submit" disabled={loading}
          className="bg-cyan-glow text-cold-black px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-cyan-glow/90 disabled:opacity-50 transition-colors">
          {loading ? 'جاري الحفظ...' : id ? 'حفظ التعديلات' : 'إضافة العمل'}
        </button>
        <button type="button" onClick={() => router.back()}
          className="px-6 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground border border-border hover:border-foreground/20 transition-colors">
          إلغاء
        </button>
      </div>
    </form>
  )
}
