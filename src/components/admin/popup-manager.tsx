'use client'

import { useMemo, useState } from 'react'

interface PopupData {
  id?: string
  title: string
  message: string
  cta_text: string
  cta_url: string
  image_url: string
  is_active: boolean
  show_once: boolean
  start_at: string
  end_at: string
}

const inputClass =
  'w-full bg-cold-black border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cyan-glow/50 transition-colors'

const labelClass = 'block text-sm font-medium text-muted-foreground mb-1.5'

function toLocalDateTime(value: string | null | undefined): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function toIso(value: string): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

export default function PopupManager({
  initialPopup,
}: {
  initialPopup: Record<string, unknown> | null
}) {
  const initialForm = useMemo<PopupData>(() => ({
    id: typeof initialPopup?.id === 'string' ? initialPopup.id : undefined,
    title: typeof initialPopup?.title === 'string' ? initialPopup.title : '',
    message: typeof initialPopup?.message === 'string' ? initialPopup.message : '',
    cta_text: typeof initialPopup?.cta_text === 'string' ? initialPopup.cta_text : '',
    cta_url: typeof initialPopup?.cta_url === 'string' ? initialPopup.cta_url : '',
    image_url: typeof initialPopup?.image_url === 'string' ? initialPopup.image_url : '',
    is_active: Boolean(initialPopup?.is_active),
    show_once: typeof initialPopup?.show_once === 'boolean' ? initialPopup.show_once : true,
    start_at: toLocalDateTime(typeof initialPopup?.start_at === 'string' ? initialPopup.start_at : null),
    end_at: toLocalDateTime(typeof initialPopup?.end_at === 'string' ? initialPopup.end_at : null),
  }), [initialPopup])

  const [form, setForm] = useState<PopupData>(initialForm)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const set = <K extends keyof PopupData>(key: K, value: PopupData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const save = async (nextActive?: boolean) => {
    setLoading(true)
    setMessage(null)
    setError(null)

    try {
      const payload = {
        id: form.id,
        title: form.title.trim(),
        message: form.message.trim(),
        cta_text: form.cta_text.trim() || null,
        cta_url: form.cta_url.trim() || null,
        image_url: form.image_url.trim() || null,
        is_active: typeof nextActive === 'boolean' ? nextActive : form.is_active,
        show_once: form.show_once,
        start_at: toIso(form.start_at),
        end_at: toIso(form.end_at),
      }

      const res = await fetch('/api/admin/popup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message ?? 'فشل حفظ الإعدادات')

      const saved = json.data as Record<string, unknown>
      setForm((prev) => ({
        ...prev,
        id: typeof saved?.id === 'string' ? saved.id : prev.id,
        is_active: Boolean(saved?.is_active),
      }))
      setMessage('تم حفظ إعدادات الـ popup بنجاح')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء الحفظ')
    } finally {
      setLoading(false)
    }
  }

  const remove = async () => {
    if (!form.id) return
    const confirmed = window.confirm('هل تريد حذف هذا الـ popup نهائيًا؟')
    if (!confirmed) return

    setLoading(true)
    setMessage(null)
    setError(null)

    try {
      const res = await fetch('/api/admin/popup', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: form.id }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error?.message ?? 'فشل حذف الـ popup')

      setForm({
        id: undefined,
        title: '',
        message: '',
        cta_text: '',
        cta_url: '',
        image_url: '',
        is_active: false,
        show_once: true,
        start_at: '',
        end_at: '',
      })
      setMessage('تم حذف الـ popup بنجاح')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء الحذف')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-cold-dark border border-border rounded-xl p-5 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Popup الزوار</h2>
        <p className="text-xs text-muted-foreground mt-1">يتظهر لزوار الموقع على الصفحات العامة فقط.</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-2 rounded-lg text-sm">{error}</div>
      )}
      {message && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-2 rounded-lg text-sm">{message}</div>
      )}

      <div>
        <label className={labelClass}>العنوان *</label>
        <input
          className={inputClass}
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="عنوان الرسالة"
        />
      </div>

      <div>
        <label className={labelClass}>المحتوى *</label>
        <textarea
          className={`${inputClass} min-h-24`}
          value={form.message}
          onChange={(e) => set('message', e.target.value)}
          placeholder="محتوى الـ popup..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>نص الزر (اختياري)</label>
          <input
            className={inputClass}
            value={form.cta_text}
            onChange={(e) => set('cta_text', e.target.value)}
            placeholder="اشترِ الآن"
          />
        </div>
        <div>
          <label className={labelClass}>رابط الزر (اختياري)</label>
          <input
            className={inputClass}
            value={form.cta_url}
            onChange={(e) => set('cta_url', e.target.value)}
            placeholder="https://..."
            dir="ltr"
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>رابط الصورة (اختياري)</label>
        <input
          className={inputClass}
          value={form.image_url}
          onChange={(e) => set('image_url', e.target.value)}
          placeholder="https://..."
          dir="ltr"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>بداية الظهور (اختياري)</label>
          <input
            type="datetime-local"
            className={inputClass}
            value={form.start_at}
            onChange={(e) => set('start_at', e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass}>نهاية الظهور (اختياري)</label>
          <input
            type="datetime-local"
            className={inputClass}
            value={form.end_at}
            onChange={(e) => set('end_at', e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => set('is_active', e.target.checked)}
            className="accent-cyan-glow"
          />
          <span className="text-sm text-foreground">مفعل الآن</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.show_once}
            onChange={(e) => set('show_once', e.target.checked)}
            className="accent-cyan-glow"
          />
          <span className="text-sm text-foreground">إخفاء بعد الإغلاق لنفس الزائر</span>
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => save()}
          disabled={loading}
          className="bg-cyan-glow text-cold-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-cyan-glow/90 disabled:opacity-50"
        >
          {loading ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
        </button>
        <button
          type="button"
          onClick={() => save(false)}
          disabled={loading}
          className="border border-border text-muted-foreground hover:text-foreground px-4 py-2 rounded-lg text-sm"
        >
          تعطيل الـ Popup
        </button>
        {form.id && (
          <button
            type="button"
            onClick={remove}
            disabled={loading}
            className="border border-red-500/40 text-red-400 hover:bg-red-500/10 px-4 py-2 rounded-lg text-sm"
          >
            حذف الـ Popup
          </button>
        )}
      </div>
    </div>
  )
}
