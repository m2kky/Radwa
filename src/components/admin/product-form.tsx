/**
 * Product Form Component
 *
 * Shared form for creating and editing products.
 * Handles POST (new) and PATCH (edit) based on presence of `id` prop.
 *
 * @phase Phase 5: Admin
 * @author Agent (Antigravity)
 * @created 2026-02-15
 */
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Product } from '@/types'

type FormProduct = Partial<Pick<
  Product,
  'slug' | 'type' | 'title' | 'description' | 'thumbnail_url' |
  'price' | 'compare_at_price' | 'installments_enabled' | 'is_featured' |
  'status' | 'meta_title' | 'meta_description'
>>

interface Props {
  id?: string
  defaultValues?: FormProduct
}

export default function ProductForm({ id, defaultValues = {} }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState<FormProduct>({
    slug: '',
    type: 'digital',
    title: '',
    description: '',
    thumbnail_url: '',
    price: 0,
    compare_at_price: undefined,
    installments_enabled: false,
    is_featured: false,
    status: 'draft',
    meta_title: '',
    meta_description: '',
    ...defaultValues,
  })

  const set = (key: keyof FormProduct, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const url = id ? `/api/admin/products/${id}` : '/api/admin/products'
      const method = id ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          compare_at_price: form.compare_at_price ? Number(form.compare_at_price) : null,
          thumbnail_url: form.thumbnail_url || null,
          meta_title: form.meta_title || null,
          meta_description: form.meta_description || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message ?? 'حدث خطأ')

      router.push('/admin/products')
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
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>العنوان *</label>
          <input
            required
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            className={inputClass}
            placeholder="اسم المنتج"
          />
        </div>
        <div>
          <label className={labelClass}>الـ Slug *</label>
          <input
            required
            value={form.slug}
            onChange={(e) => set('slug', e.target.value)}
            className={inputClass}
            placeholder="product-slug"
            dir="ltr"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>النوع</label>
          <select
            value={form.type}
            onChange={(e) => set('type', e.target.value)}
            className={inputClass}
          >
            <option value="digital">رقمي</option>
            <option value="course">كورس</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>الحالة</label>
          <select
            value={form.status}
            onChange={(e) => set('status', e.target.value)}
            className={inputClass}
          >
            <option value="draft">مسودة</option>
            <option value="published">منشور</option>
            <option value="archived">مؤرشف</option>
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>الوصف</label>
        <textarea
          rows={4}
          value={form.description ?? ''}
          onChange={(e) => set('description', e.target.value)}
          className={inputClass}
          placeholder="وصف المنتج..."
        />
      </div>

      <div>
        <label className={labelClass}>رابط الصورة</label>
        <input
          value={form.thumbnail_url ?? ''}
          onChange={(e) => set('thumbnail_url', e.target.value)}
          className={inputClass}
          placeholder="https://..."
          dir="ltr"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>السعر (EGP) *</label>
          <input
            required
            type="number"
            min={0}
            value={form.price}
            onChange={(e) => set('price', e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>السعر الأصلي (اختياري)</label>
          <input
            type="number"
            min={0}
            value={form.compare_at_price ?? ''}
            onChange={(e) => set('compare_at_price', e.target.value || undefined)}
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.installments_enabled}
            onChange={(e) => set('installments_enabled', e.target.checked)}
            className="accent-cyan-glow"
          />
          <span className="text-sm text-foreground">تفعيل التقسيط</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_featured}
            onChange={(e) => set('is_featured', e.target.checked)}
            className="accent-cyan-glow"
          />
          <span className="text-sm text-foreground">منتج مميز</span>
        </label>
      </div>

      <div className="border-t border-border pt-6 space-y-4">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">SEO</p>
        <div>
          <label className={labelClass}>Meta Title</label>
          <input
            value={form.meta_title ?? ''}
            onChange={(e) => set('meta_title', e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Meta Description</label>
          <textarea
            rows={2}
            value={form.meta_description ?? ''}
            onChange={(e) => set('meta_description', e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-cyan-glow text-cold-black px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-cyan-glow/90 disabled:opacity-50 transition-colors"
        >
          {loading ? 'جاري الحفظ...' : id ? 'حفظ التعديلات' : 'إنشاء المنتج'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground border border-border hover:border-foreground/20 transition-colors"
        >
          إلغاء
        </button>
      </div>
    </form>
  )
}
