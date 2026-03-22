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
import { ImagePlus, Loader2, Plus, X } from 'lucide-react'
import type { Product, ProductFile } from '@/types'

type FormProduct = Partial<Pick<
  Product,
  'slug' | 'type' | 'title' | 'description' | 'thumbnail_url' |
  'price' | 'compare_at_price' | 'installments_enabled' | 'files' | 'is_featured' |
  'status' | 'meta_title' | 'meta_description'
>>

interface Props {
  id?: string
  defaultValues?: FormProduct
}

function normalizeFiles(files: ProductFile[] | null | undefined): ProductFile[] {
  if (!files || files.length === 0) return []
  return files.map((f) => ({
    name: f?.name || '',
    storage_path: f?.storage_path || '',
    size: typeof f?.size === 'number' && Number.isFinite(f.size) ? Math.max(0, Math.round(f.size)) : 0,
  }))
}

function deriveNameFromPath(path: string, fallback = 'file'): string {
  const trimmed = path.trim()
  if (!trimmed) return fallback

  const clean = trimmed.split('?')[0].split('#')[0]
  const parts = clean.split('/')
  const candidate = parts[parts.length - 1]?.trim()
  return candidate && candidate.length > 0 ? candidate : fallback
}

export default function ProductForm({ id, defaultValues = {} }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadingThumb, setUploadingThumb] = useState(false)
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
    files: normalizeFiles(defaultValues.files),
  })

  const set = (key: keyof FormProduct, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const productFiles = normalizeFiles(form.files)

  const addManualFile = () => {
    set('files', [...productFiles, { name: '', storage_path: '', size: 0 }])
  }

  const updateFile = (index: number, patch: Partial<ProductFile>) => {
    const next = [...productFiles]
    next[index] = { ...next[index], ...patch }
    set('files', next)
  }

  const removeFile = (index: number) => {
    const next = productFiles.filter((_, i) => i !== index)
    set('files', next)
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)
    try {
      const data = new FormData()
      data.append('file', file)
      data.append('slug', form.slug?.trim() || form.title?.trim() || 'product')

      const res = await fetch('/api/admin/products/upload', {
        method: 'POST',
        body: data,
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error?.message ?? 'فشل رفع الملف')

      set('files', [...productFiles, body.data])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل رفع الملف')
    } finally {
      setUploading(false)
      event.target.value = ''
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
      data.append('folder', `products/${form.slug?.trim() || 'general'}`)

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const filesPayload = productFiles
        .filter((f) => f.storage_path.trim().length > 0)
        .map((f) => ({
          name: f.name.trim() || deriveNameFromPath(f.storage_path, 'file'),
          storage_path: f.storage_path.trim(),
          size: Number.isFinite(f.size) ? Math.max(0, Math.round(f.size)) : 0,
        }))

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
          files: filesPayload.length > 0 ? filesPayload : null,
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
        <div className="flex flex-col md:flex-row gap-2">
          <input
            value={form.thumbnail_url ?? ''}
            onChange={(e) => set('thumbnail_url', e.target.value)}
            className={inputClass}
            placeholder="https://... أو /api/media?path=..."
            dir="ltr"
          />
          <label className="inline-flex items-center justify-center gap-2 bg-cold-black border border-border px-3 py-2 rounded-lg text-xs text-foreground cursor-pointer hover:border-cyan-glow/40 transition-colors whitespace-nowrap">
            {uploadingThumb ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
            {uploadingThumb ? 'جاري رفع الصورة...' : 'رفع صورة'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleThumbnailUpload}
              disabled={uploadingThumb}
            />
          </label>
        </div>
      </div>

      <div className="border border-border rounded-xl p-4 space-y-4 bg-cold-dark/40">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-foreground">ملفات المنتج</p>
            <p className="text-xs text-muted-foreground mt-1">
              تقدر تضيف رابط مباشر (Cloudflare/R2) فقط بدون رفع، أو ترفع الملف مباشرة.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-2 bg-cold-black border border-border px-3 py-2 rounded-lg text-xs text-foreground cursor-pointer hover:border-cyan-glow/40 transition-colors">
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              {uploading ? 'جاري الرفع...' : 'رفع ملف'}
              <input
                type="file"
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </label>

            <button
              type="button"
              onClick={addManualFile}
              className="inline-flex items-center gap-1.5 bg-cyan-glow text-cold-black px-3 py-2 rounded-lg text-xs font-semibold hover:bg-cyan-glow/90 transition-colors"
            >
              <Plus size={14} />
              إضافة رابط
            </button>
          </div>
        </div>

        {productFiles.length === 0 ? (
          <p className="text-xs text-muted-foreground">لا يوجد ملفات مضافة.</p>
        ) : (
          <div className="space-y-3">
            {productFiles.map((file, idx) => (
              <div key={`${file.storage_path}-${idx}`} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                <div className="md:col-span-3">
                  <label className={labelClass}>اسم الملف</label>
                  <input
                    value={file.name}
                    onChange={(e) => updateFile(idx, { name: e.target.value })}
                    className={inputClass}
                    placeholder="course.pdf"
                  />
                </div>

                <div className="md:col-span-6">
                  <label className={labelClass}>Storage Path / URL</label>
                  <input
                    value={file.storage_path}
                    onChange={(e) => updateFile(idx, { storage_path: e.target.value })}
                    className={inputClass}
                    placeholder="products/my-product/file.pdf or https://..."
                    dir="ltr"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>الحجم (bytes)</label>
                  <input
                    type="number"
                    min={0}
                    value={file.size}
                    onChange={(e) => updateFile(idx, { size: Number(e.target.value || 0) })}
                    className={inputClass}
                    dir="ltr"
                  />
                </div>

                <div className="md:col-span-1">
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="w-full h-10 border border-border rounded-lg text-red-400 hover:bg-red-500/10 transition-colors inline-flex items-center justify-center"
                    title="حذف الملف"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
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
