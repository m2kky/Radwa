'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Upload, X } from 'lucide-react'
import RichTextEditor from '@/components/admin/rich-text-editor'
import MediaUploadField from '@/components/admin/media-upload-field'
import type { Guide, GuideStatus } from '@/types'

type GuideFormData = Partial<Pick<
  Guide,
  | 'slug'
  | 'title'
  | 'excerpt'
  | 'content_body'
  | 'thumbnail_url'
  | 'file_storage_path'
  | 'file_name'
  | 'file_size'
  | 'category'
  | 'tags'
  | 'status'
  | 'is_featured'
  | 'meta_title'
  | 'meta_description'
>>

interface Props {
  id?: string
  defaultValues?: GuideFormData
}

const MAX_GUIDE_FILE_SIZE = 200 * 1024 * 1024

function normalizeTags(tags: string[] | null | undefined): string[] {
  return Array.isArray(tags) ? tags.filter(Boolean) : []
}

export default function GuideForm({ id, defaultValues = {} }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tagsInput, setTagsInput] = useState(normalizeTags(defaultValues.tags).join(', '))
  const [form, setForm] = useState<GuideFormData>({
    slug: '',
    title: '',
    excerpt: '',
    content_body: '',
    thumbnail_url: '',
    file_storage_path: '',
    file_name: '',
    file_size: 0,
    category: '',
    status: 'draft',
    is_featured: false,
    meta_title: '',
    meta_description: '',
    ...defaultValues,
    tags: normalizeTags(defaultValues.tags),
  })

  const set = (key: keyof GuideFormData, value: unknown) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > MAX_GUIDE_FILE_SIZE) {
      setError('أقصى حجم للملف هو 200MB')
      event.target.value = ''
      return
    }

    setUploadingFile(true)
    setError(null)
    try {
      const contentType = file.type || 'application/octet-stream'
      const signRes = await fetch('/api/admin/guides/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: file.name,
          size: file.size,
          content_type: contentType,
          slug: form.slug?.trim() || form.title?.trim() || 'guide',
        }),
      })
      const signBody = await signRes.json()
      if (!signRes.ok) throw new Error(signBody.error?.message ?? 'فشل تجهيز رابط الرفع')

      const uploadRes = await fetch(signBody.data.upload_url, {
        method: 'PUT',
        headers: { 'Content-Type': signBody.data.content_type || contentType },
        body: file,
      })
      if (!uploadRes.ok) throw new Error('فشل رفع الملف إلى R2')

      set('file_storage_path', signBody.data.storage_path)
      set('file_name', signBody.data.name || file.name)
      set('file_size', signBody.data.size || file.size)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل رفع الملف')
    } finally {
      setUploadingFile(false)
      event.target.value = ''
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const url = id ? `/api/admin/guides/${id}` : '/api/admin/guides'
      const method = id ? 'PATCH' : 'POST'
      const payload = {
        ...form,
        tags: tagsInput.split(',').map((tag) => tag.trim()).filter(Boolean),
        excerpt: form.excerpt || null,
        content_body: form.content_body || null,
        thumbnail_url: form.thumbnail_url || null,
        file_storage_path: form.file_storage_path || null,
        file_name: form.file_name || null,
        file_size: Number(form.file_size || 0),
        category: form.category || null,
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
      router.push('/admin/guides')
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
          <label className={labelClass}>العنوان *</label>
          <input required value={form.title || ''} onChange={(e) => set('title', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Slug *</label>
          <input required value={form.slug || ''} onChange={(e) => set('slug', e.target.value)} className={inputClass} dir="ltr" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className={labelClass}>الحالة</label>
          <select value={form.status || 'draft'} onChange={(e) => set('status', e.target.value as GuideStatus)} className={inputClass}>
            <option value="draft">مسودة</option>
            <option value="published">منشور</option>
            <option value="archived">مؤرشف</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>التصنيف</label>
          <input value={form.category || ''} onChange={(e) => set('category', e.target.value)} className={inputClass} placeholder="Template, Guide..." />
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
          folder={`guides/${form.slug?.trim() || 'general'}`}
          inputClassName={inputClass}
        />
      </div>

      <div className="rounded-xl border border-border bg-cold-dark/40 p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-foreground">ملف التحميل</p>
            <p className="mt-1 text-xs text-muted-foreground">ارفع ملف R2 أو ضع Storage Path / URL يدويًا.</p>
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-cold-black px-3 py-2 text-xs text-foreground transition-colors hover:border-cyan-glow/40">
            {uploadingFile ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {uploadingFile ? 'جاري الرفع...' : 'رفع ملف'}
            <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploadingFile} />
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-12">
          <div className="md:col-span-4">
            <label className={labelClass}>اسم الملف</label>
            <input value={form.file_name || ''} onChange={(e) => set('file_name', e.target.value)} className={inputClass} placeholder="guide.pdf" />
          </div>
          <div className="md:col-span-6">
            <label className={labelClass}>Storage Path / URL</label>
            <input value={form.file_storage_path || ''} onChange={(e) => set('file_storage_path', e.target.value)} className={inputClass} dir="ltr" />
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>الحجم</label>
            <input type="number" min={0} value={form.file_size || 0} onChange={(e) => set('file_size', Number(e.target.value || 0))} className={inputClass} dir="ltr" />
          </div>
        </div>

        {form.file_storage_path ? (
          <button
            type="button"
            onClick={() => {
              set('file_storage_path', '')
              set('file_name', '')
              set('file_size', 0)
            }}
            className="inline-flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300"
          >
            <X size={14} />
            حذف الملف من النموذج
          </button>
        ) : null}
      </div>

      <div>
        <label className={labelClass}>الوسوم</label>
        <input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} className={inputClass} placeholder="افصل بينهم بفاصلة" />
      </div>

      <div>
        <label className={labelClass}>المحتوى (Rich Text)</label>
        <RichTextEditor
          value={form.content_body || ''}
          onChange={(value) => set('content_body', value)}
          placeholder="اكتب تفاصيل المورد وطريقة استخدامه..."
        />
      </div>

      <label className="flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={Boolean(form.is_featured)}
          onChange={(e) => set('is_featured', e.target.checked)}
          className="h-4 w-4 accent-cyan-glow"
        />
        <span className="text-sm text-foreground">مميز في أعلى القائمة</span>
      </label>

      <div className="border-t border-border pt-6 space-y-4">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">SEO</p>
        <input value={form.meta_title || ''} onChange={(e) => set('meta_title', e.target.value)} className={inputClass} placeholder="Meta title" />
        <textarea rows={2} value={form.meta_description || ''} onChange={(e) => set('meta_description', e.target.value)} className={inputClass} placeholder="Meta description" />
      </div>

      <div className="flex gap-3 border-t border-border pt-4">
        <button type="submit" disabled={loading} className="rounded-lg bg-cyan-glow px-6 py-2.5 text-sm font-semibold text-cold-black transition-colors hover:bg-cyan-glow/90 disabled:opacity-50">
          {loading ? 'جاري الحفظ...' : id ? 'حفظ التعديلات' : 'إضافة Guide'}
        </button>
        <button type="button" onClick={() => router.back()} className="rounded-lg border border-border px-6 py-2.5 text-sm text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground">
          إلغاء
        </button>
      </div>
    </form>
  )
}
