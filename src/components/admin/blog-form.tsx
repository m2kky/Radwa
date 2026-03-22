/**
 * Blog Form Component
 *
 * Shared form for creating and editing blog posts.
 *
 * @phase Phase 2: Blog Admin
 * @author Agent (Antigravity)
 * @created 2026-02-15
 */
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface FormData {
  slug: string
  title: string
  excerpt: string
  content: string
  thumbnail_url: string
  category: string
  is_featured: boolean
  status: 'draft' | 'published'
}

interface Props {
  id?: string
  defaultValues?: Partial<FormData>
}

export default function BlogForm({ id, defaultValues = {} }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState<FormData>({
    slug: '', title: '', excerpt: '', content: '',
    thumbnail_url: '', category: '', is_featured: false, status: 'draft',
    ...defaultValues,
  })

  const set = (key: keyof FormData, value: unknown) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const url    = id ? `/api/admin/blog/${id}` : '/api/admin/blog'
      const method = id ? 'PATCH' : 'POST'
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, thumbnail_url: form.thumbnail_url || '' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message ?? 'حدث خطأ')
      router.push('/admin/blog')
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
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>العنوان *</label>
          <input required value={form.title} onChange={e => set('title', e.target.value)} className={inputClass} placeholder="عنوان المقال" />
        </div>
        <div>
          <label className={labelClass}>الـ Slug *</label>
          <input required value={form.slug} onChange={e => set('slug', e.target.value)} className={inputClass} placeholder="post-slug" dir="ltr" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>التصنيف</label>
          <input value={form.category} onChange={e => set('category', e.target.value)} className={inputClass} placeholder="تسويق، استراتيجية..." />
        </div>
        <div>
          <label className={labelClass}>الحالة</label>
          <select value={form.status} onChange={e => set('status', e.target.value)} className={inputClass}>
            <option value="draft">مسودة</option>
            <option value="published">منشور</option>
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>المقتطف</label>
        <textarea rows={2} value={form.excerpt} onChange={e => set('excerpt', e.target.value)} className={inputClass} placeholder="وصف مختصر..." />
      </div>

      <div>
        <label className={labelClass}>رابط الصورة</label>
        <input value={form.thumbnail_url} onChange={e => set('thumbnail_url', e.target.value)} className={inputClass} placeholder="https://..." dir="ltr" />
      </div>

      <div>
        <label className={labelClass}>المحتوى (HTML)</label>
        <textarea rows={12} value={form.content} onChange={e => set('content', e.target.value)} className={`${inputClass} font-mono text-xs`} placeholder="<p>محتوى المقال...</p>" dir="ltr" />
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.is_featured} onChange={e => set('is_featured', e.target.checked)} className="accent-cyan-glow" />
        <span className="text-sm text-foreground">مقال مميز</span>
      </label>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading}
          className="bg-cyan-glow text-cold-black px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-cyan-glow/90 disabled:opacity-50 transition-colors">
          {loading ? 'جاري الحفظ...' : id ? 'حفظ التعديلات' : 'نشر المقال'}
        </button>
        <button type="button" onClick={() => router.back()}
          className="px-6 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground border border-border hover:border-foreground/20 transition-colors">
          إلغاء
        </button>
      </div>
    </form>
  )
}
