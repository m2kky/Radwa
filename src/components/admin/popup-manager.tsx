'use client'

import { Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  normalizePopupActions,
  normalizePopupVariant,
  popupActionStyleValues,
  popupActionTypeValues,
  popupVariantValues,
  type PopupActionStyle,
  type PopupActionType,
  type PopupVariant,
} from '@/lib/popup'

interface PopupActionForm {
  id: string
  label: string
  action: PopupActionType
  url: string
  style: PopupActionStyle
  new_tab: boolean
  copy_text: string
}

interface PopupData {
  id?: string
  title: string
  message: string
  image_url: string
  variant: PopupVariant
  discount_code: string
  discount_note: string
  actions: PopupActionForm[]
  collect_name: boolean
  collect_email: boolean
  collect_phone: boolean
  lead_title: string
  lead_submit_text: string
  lead_success_message: string
  is_active: boolean
  show_once: boolean
  start_at: string
  end_at: string
}

interface PopupLeadRow {
  id: string
  popup_id: string | null
  name: string | null
  email: string | null
  phone: string | null
  source_path: string | null
  created_at: string
}

const inputClass =
  'w-full bg-cold-black border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cyan-glow/50 transition-colors'

const labelClass = 'block text-sm font-medium text-muted-foreground mb-1.5'

const actionTypeLabels: Record<PopupActionType, string> = {
  link: 'فتح رابط',
  copy_code: 'نسخ كود',
  close: 'إغلاق الـ popup',
}

const actionStyleLabels: Record<PopupActionStyle, string> = {
  primary: 'أساسي',
  secondary: 'ثانوي',
  ghost: 'شفاف',
}

const popupVariantLabels: Record<PopupVariant, string> = {
  spotlight: 'Spotlight',
  minimal: 'Minimal',
  split: 'Split Banner',
}

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

function cleanText(value: string): string | null {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function parseString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function parseLeads(input: Array<Record<string, unknown>> | undefined): PopupLeadRow[] {
  if (!Array.isArray(input)) return []

  return input
    .map((row) => {
      const id = parseString(row.id)
      const createdAt = parseString(row.created_at)
      if (!id || !createdAt) return null

      return {
        id,
        popup_id: typeof row.popup_id === 'string' ? row.popup_id : null,
        name: typeof row.name === 'string' ? row.name : null,
        email: typeof row.email === 'string' ? row.email : null,
        phone: typeof row.phone === 'string' ? row.phone : null,
        source_path: typeof row.source_path === 'string' ? row.source_path : null,
        created_at: createdAt,
      }
    })
    .filter((row): row is PopupLeadRow => row !== null)
}

function createAction(index: number): PopupActionForm {
  return {
    id: `action-${index}`,
    label: '',
    action: 'link',
    url: '',
    style: 'primary',
    new_tab: false,
    copy_text: '',
  }
}

function normalizeActionsForForm(initialPopup: Record<string, unknown> | null): PopupActionForm[] {
  const normalized = normalizePopupActions(initialPopup?.actions, {
    ctaText: typeof initialPopup?.cta_text === 'string' ? initialPopup.cta_text : null,
    ctaUrl: typeof initialPopup?.cta_url === 'string' ? initialPopup.cta_url : null,
  })

  return normalized.map((action, index) => ({
    id: action.id || `action-${index + 1}`,
    label: action.label,
    action: action.action,
    url: action.url ?? '',
    style: action.style,
    new_tab: action.new_tab,
    copy_text: action.copy_text ?? '',
  }))
}

function variantPreviewClasses(variant: PopupVariant): string {
  if (variant === 'minimal') {
    return 'border border-border bg-cold-black'
  }
  if (variant === 'split') {
    return 'border border-cyan-glow/30 bg-gradient-to-br from-cold-black to-cyan-glow/10'
  }
  return 'border border-cyan-glow/30 bg-gradient-to-br from-cold-dark to-cyan-glow/20'
}

function actionButtonClasses(style: PopupActionStyle): string {
  if (style === 'secondary') {
    return 'border border-border text-foreground hover:bg-white/5'
  }
  if (style === 'ghost') {
    return 'text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent'
  }
  return 'bg-cyan-glow text-cold-black hover:bg-cyan-glow/90'
}

function PopupPreview({ form }: { form: PopupData }) {
  const previewCode = cleanText(form.discount_code)
  const previewActions = form.actions.filter((action) => cleanText(action.label))

  return (
    <div className={`rounded-2xl p-4 md:p-5 shadow-2xl ${variantPreviewClasses(form.variant)}`}>
      <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-2">Live Preview</p>
      <h3 className="text-lg md:text-xl font-bold text-foreground">{form.title || 'عنوان الـ Popup'}</h3>
      <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">
        {form.message || 'محتوى الرسالة سيظهر هنا...'}
      </p>

      {previewCode && (
        <div className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3">
          <p className="text-[11px] text-emerald-300 mb-2">{form.discount_note || 'كود خصم خاص'}</p>
          <div className="flex items-center justify-between gap-2">
            <code className="text-emerald-200 font-bold text-base md:text-lg tracking-wider" dir="ltr">
              {previewCode}
            </code>
            <button
              type="button"
              className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md border border-emerald-300/40 text-emerald-200"
            >
              نسخ
            </button>
          </div>
        </div>
      )}

      {(form.collect_name || form.collect_email || form.collect_phone) && (
        <div className="mt-4 space-y-2 rounded-xl border border-border bg-cold-black/50 p-3">
          <p className="text-xs text-foreground">{form.lead_title || 'اترك بياناتك ونبعتلك التفاصيل'}</p>
          {form.collect_name ? <input className={inputClass} placeholder="الاسم" disabled /> : null}
          {form.collect_email ? <input className={inputClass} placeholder="name@email.com" dir="ltr" disabled /> : null}
          {form.collect_phone ? <input className={inputClass} placeholder="01xxxxxxxxx" dir="ltr" disabled /> : null}
          <button
            type="button"
            className="w-full bg-cyan-glow text-cold-black rounded-lg py-2 text-sm font-semibold opacity-80"
          >
            {form.lead_submit_text || 'إرسال'}
          </button>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {previewActions.length > 0 ? (
          previewActions.map((action, index) => (
            <button
              type="button"
              key={`${action.id}-${index}`}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${actionButtonClasses(action.style)}`}
            >
              {action.label}
            </button>
          ))
        ) : (
          <button
            type="button"
            className="px-3 py-2 rounded-lg text-xs font-medium border border-border text-muted-foreground"
          >
            أضف زرار من قسم الأكشنز
          </button>
        )}
      </div>
    </div>
  )
}

function PopupLeadsTable({ rows }: { rows: PopupLeadRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        لا توجد بيانات مجمعة من الـ popup حتى الآن.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            <th className="text-right px-3 py-2 font-medium">الاسم</th>
            <th className="text-right px-3 py-2 font-medium">الإيميل</th>
            <th className="text-right px-3 py-2 font-medium">الموبايل</th>
            <th className="text-right px-3 py-2 font-medium">الصفحة</th>
            <th className="text-right px-3 py-2 font-medium">التاريخ</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((lead) => (
            <tr key={lead.id} className="border-b border-border/50 align-top">
              <td className="px-3 py-2 text-foreground">{lead.name ?? '—'}</td>
              <td className="px-3 py-2 text-foreground" dir="ltr">{lead.email ?? '—'}</td>
              <td className="px-3 py-2 text-foreground" dir="ltr">{lead.phone ?? '—'}</td>
              <td className="px-3 py-2 text-muted-foreground">{lead.source_path ?? '—'}</td>
              <td className="px-3 py-2 text-muted-foreground">
                {new Date(lead.created_at).toLocaleString('ar-EG')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function PopupManager({
  initialPopup,
  initialLeads,
}: {
  initialPopup: Record<string, unknown> | null
  initialLeads?: Array<Record<string, unknown>>
}) {
  const leads = useMemo(() => parseLeads(initialLeads), [initialLeads])

  const initialForm = useMemo<PopupData>(() => ({
    id: typeof initialPopup?.id === 'string' ? initialPopup.id : undefined,
    title: parseString(initialPopup?.title),
    message: parseString(initialPopup?.message),
    image_url: parseString(initialPopup?.image_url),
    variant: normalizePopupVariant(initialPopup?.variant),
    discount_code: parseString(initialPopup?.discount_code),
    discount_note: parseString(initialPopup?.discount_note),
    actions: normalizeActionsForForm(initialPopup),
    collect_name: Boolean(initialPopup?.collect_name),
    collect_email: Boolean(initialPopup?.collect_email),
    collect_phone: Boolean(initialPopup?.collect_phone),
    lead_title: parseString(initialPopup?.lead_title),
    lead_submit_text: parseString(initialPopup?.lead_submit_text),
    lead_success_message: parseString(initialPopup?.lead_success_message),
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

  const updateAction = <K extends keyof PopupActionForm>(
    index: number,
    key: K,
    value: PopupActionForm[K]
  ) => {
    setForm((prev) => ({
      ...prev,
      actions: prev.actions.map((action, actionIndex) => (
        actionIndex === index ? { ...action, [key]: value } : action
      )),
    }))
  }

  const addAction = () => {
    if (form.actions.length >= 4) return
    setForm((prev) => ({
      ...prev,
      actions: [...prev.actions, createAction(prev.actions.length + 1)],
    }))
  }

  const removeAction = (index: number) => {
    setForm((prev) => ({
      ...prev,
      actions: prev.actions.filter((_, actionIndex) => actionIndex !== index),
    }))
  }

  const resetForm = () => {
    setForm({
      id: undefined,
      title: '',
      message: '',
      image_url: '',
      variant: 'spotlight',
      discount_code: '',
      discount_note: '',
      actions: [],
      collect_name: false,
      collect_email: false,
      collect_phone: false,
      lead_title: '',
      lead_submit_text: '',
      lead_success_message: '',
      is_active: false,
      show_once: true,
      start_at: '',
      end_at: '',
    })
  }

  const save = async (nextActive?: boolean) => {
    setLoading(true)
    setMessage(null)
    setError(null)

    try {
      if (!form.title.trim() || !form.message.trim()) {
        throw new Error('العنوان والمحتوى مطلوبين')
      }

      if (form.collect_name && !form.collect_email && !form.collect_phone) {
        throw new Error('مع حقل الاسم لازم تختار إيميل أو موبايل على الأقل')
      }

      const actionsPayload = form.actions
        .map((action, index) => {
          const label = action.label.trim()
          const url = action.url.trim()
          const copyText = action.copy_text.trim()
          const hasAnyValue = Boolean(label || url || copyText)

          if (!hasAnyValue) return null
          if (!label) throw new Error(`زر رقم ${index + 1} محتاج نص`)
          if (action.action === 'link' && !url) throw new Error(`زر "${label}" محتاج رابط`)

          return {
            id: action.id.trim() || `action-${index + 1}`,
            label,
            action: action.action,
            url: action.action === 'link' ? url : null,
            style: action.style,
            new_tab: action.action === 'link' ? action.new_tab : false,
            copy_text: action.action === 'copy_code' ? (copyText || null) : null,
          }
        })
        .filter((action): action is NonNullable<typeof action> => action !== null)

      const payload = {
        id: form.id,
        title: form.title.trim(),
        message: form.message.trim(),
        image_url: cleanText(form.image_url),
        variant: form.variant,
        discount_code: cleanText(form.discount_code),
        discount_note: cleanText(form.discount_note),
        actions: actionsPayload,
        collect_name: form.collect_name,
        collect_email: form.collect_email,
        collect_phone: form.collect_phone,
        lead_title: cleanText(form.lead_title),
        lead_submit_text: cleanText(form.lead_submit_text),
        lead_success_message: cleanText(form.lead_success_message),
        cta_text: null,
        cta_url: null,
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

      resetForm()
      setMessage('تم حذف الـ popup بنجاح')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء الحذف')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-5">
        <div className="bg-cold-dark border border-border rounded-xl p-5 space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Popup الزوار</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Popup احترافي مع أكتر من شكل، أكتر من زرار، وكمان جمع بيانات الزوار.
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-2 rounded-lg text-sm">{error}</div>
          )}
          {message && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-2 rounded-lg text-sm">{message}</div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <label className={labelClass}>شكل الـ Popup</label>
              <select
                className={inputClass}
                value={form.variant}
                onChange={(e) => set('variant', e.target.value as PopupVariant)}
              >
                {popupVariantValues.map((variant) => (
                  <option key={variant} value={variant}>
                    {popupVariantLabels[variant]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>المحتوى *</label>
            <textarea
              className={`${inputClass} min-h-28`}
              value={form.message}
              onChange={(e) => set('message', e.target.value)}
              placeholder="محتوى الـ popup..."
            />
          </div>

          <div>
            <label className={labelClass}>رابط الصورة (اختياري)</label>
            <input
              className={inputClass}
              value={form.image_url}
              onChange={(e) => set('image_url', e.target.value)}
              placeholder="https://... أو /image.jpg"
              dir="ltr"
            />
          </div>

          <div className="rounded-xl border border-border p-4 space-y-3">
            <p className="text-sm font-semibold text-foreground">تمييز كود الخصم</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>الكود</label>
                <input
                  className={inputClass}
                  value={form.discount_code}
                  onChange={(e) => set('discount_code', e.target.value)}
                  placeholder="SAVE10"
                  dir="ltr"
                />
              </div>
              <div>
                <label className={labelClass}>وصف الكود</label>
                <input
                  className={inputClass}
                  value={form.discount_note}
                  onChange={(e) => set('discount_note', e.target.value)}
                  placeholder="خصم خاص لفترة محدودة"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-foreground">أزرار الـ Popup</p>
              <button
                type="button"
                onClick={addAction}
                disabled={form.actions.length >= 4}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-xs text-foreground hover:bg-white/5 disabled:opacity-50"
              >
                <Plus size={14} />
                زرار جديد
              </button>
            </div>

            {form.actions.length === 0 ? (
              <p className="text-xs text-muted-foreground">أضف زرار أو أكتر (حد أقصى 4).</p>
            ) : (
              <div className="space-y-3">
                {form.actions.map((action, index) => (
                  <div key={`${action.id}-${index}`} className="rounded-lg border border-border p-3 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-muted-foreground">زرار #{index + 1}</p>
                      <button
                        type="button"
                        onClick={() => removeAction(index)}
                        className="inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-300"
                      >
                        <Trash2 size={14} />
                        حذف
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className={labelClass}>نص الزر *</label>
                        <input
                          className={inputClass}
                          value={action.label}
                          onChange={(e) => updateAction(index, 'label', e.target.value)}
                          placeholder="اشترك الآن"
                        />
                      </div>
                      <div>
                        <label className={labelClass}>نوع الأكشن</label>
                        <select
                          className={inputClass}
                          value={action.action}
                          onChange={(e) => updateAction(index, 'action', e.target.value as PopupActionType)}
                        >
                          {popupActionTypeValues.map((type) => (
                            <option key={type} value={type}>
                              {actionTypeLabels[type]}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>ستايل الزر</label>
                        <select
                          className={inputClass}
                          value={action.style}
                          onChange={(e) => updateAction(index, 'style', e.target.value as PopupActionStyle)}
                        >
                          {popupActionStyleValues.map((style) => (
                            <option key={style} value={style}>
                              {actionStyleLabels[style]}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {action.action === 'link' ? (
                      <div className="space-y-2">
                        <div>
                          <label className={labelClass}>الرابط *</label>
                          <input
                            className={inputClass}
                            value={action.url}
                            onChange={(e) => updateAction(index, 'url', e.target.value)}
                            placeholder="https://... أو /shop"
                            dir="ltr"
                          />
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer text-xs text-foreground">
                          <input
                            type="checkbox"
                            checked={action.new_tab}
                            onChange={(e) => updateAction(index, 'new_tab', e.target.checked)}
                            className="accent-cyan-glow"
                          />
                          فتح في تبويب جديد
                        </label>
                      </div>
                    ) : null}

                    {action.action === 'copy_code' ? (
                      <div>
                        <label className={labelClass}>النص المنسوخ (اختياري)</label>
                        <input
                          className={inputClass}
                          value={action.copy_text}
                          onChange={(e) => updateAction(index, 'copy_text', e.target.value)}
                          placeholder="لو فاضي هينسخ discount code"
                          dir="ltr"
                        />
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border p-4 space-y-3">
            <p className="text-sm font-semibold text-foreground">جمع بيانات الزوار</p>
            <div className="flex flex-wrap items-center gap-5">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={form.collect_name}
                  onChange={(e) => set('collect_name', e.target.checked)}
                  className="accent-cyan-glow"
                />
                حقل الاسم
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={form.collect_email}
                  onChange={(e) => set('collect_email', e.target.checked)}
                  className="accent-cyan-glow"
                />
                حقل الإيميل
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={form.collect_phone}
                  onChange={(e) => set('collect_phone', e.target.checked)}
                  className="accent-cyan-glow"
                />
                حقل الموبايل
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>عنوان الفورم</label>
                <input
                  className={inputClass}
                  value={form.lead_title}
                  onChange={(e) => set('lead_title', e.target.value)}
                  placeholder="اكتب بياناتك ونبعتلك العرض"
                />
              </div>
              <div>
                <label className={labelClass}>نص زر الإرسال</label>
                <input
                  className={inputClass}
                  value={form.lead_submit_text}
                  onChange={(e) => set('lead_submit_text', e.target.value)}
                  placeholder="إرسال"
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>رسالة النجاح بعد الإرسال</label>
              <input
                className={inputClass}
                value={form.lead_success_message}
                onChange={(e) => set('lead_success_message', e.target.value)}
                placeholder="تم حفظ بياناتك بنجاح"
              />
            </div>
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

        <div className="space-y-5">
          <div className="bg-cold-dark border border-border rounded-xl p-4">
            <PopupPreview form={form} />
          </div>

          <div className="bg-cold-dark border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">آخر بيانات تم جمعها</h3>
              <p className="text-xs text-muted-foreground mt-1">من زوار الـ popup</p>
            </div>
            <PopupLeadsTable rows={leads} />
          </div>
        </div>
      </div>
    </div>
  )
}
