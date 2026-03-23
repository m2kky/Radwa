/**
 * Coupons Manager Component
 *
 * Client component — lists coupons, toggle active, create new coupon.
 *
 * @phase Phase 5: Admin
 * @author Agent (Antigravity)
 * @created 2026-02-15
 */
'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import type { Coupon } from '@/types'

interface NewCoupon {
  code: string
  discount_type: 'percentage' | 'fixed'
  discount_value: string
  min_amount: string
  max_discount: string
  max_uses: string
  valid_from: string
  valid_until: string
}

const EMPTY: NewCoupon = {
  code: '',
  discount_type: 'percentage',
  discount_value: '',
  min_amount: '',
  max_discount: '',
  max_uses: '',
  valid_from: new Date().toISOString().slice(0, 16),
  valid_until: '',
}

export default function CouponsManager({ initialCoupons }: { initialCoupons: Coupon[] }) {
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<NewCoupon>(EMPTY)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (k: keyof NewCoupon, v: string) => setForm((p) => ({ ...p, [k]: v }))

  const toPayload = (forEdit: boolean) => ({
    code: form.code.toUpperCase().trim(),
    discount_type: form.discount_type,
    discount_value: Number(form.discount_value),
    min_amount: form.min_amount
      ? Number(form.min_amount)
      : forEdit
        ? null
        : undefined,
    max_discount: form.max_discount
      ? Number(form.max_discount)
      : forEdit
        ? null
        : undefined,
    max_uses: form.max_uses
      ? Number(form.max_uses)
      : forEdit
        ? null
        : undefined,
    valid_from: new Date(form.valid_from).toISOString(),
    valid_until: form.valid_until
      ? new Date(form.valid_until).toISOString()
      : forEdit
        ? null
        : undefined,
  })

  const resetForm = () => {
    setForm(EMPTY)
    setShowForm(false)
    setEditingId(null)
    setError(null)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const isEdit = Boolean(editingId)
      const payload = toPayload(isEdit)
      const res = await fetch('/api/admin/coupons', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isEdit
            ? { id: editingId, ...payload }
            : { ...payload, is_active: true }
        ),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message ?? 'حدث خطأ')
      if (isEdit) {
        setCoupons((prev) =>
          prev.map((coupon) => (coupon.id === editingId ? data.data : coupon))
        )
      } else {
        setCoupons([data.data, ...coupons])
      }
      resetForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ')
    } finally {
      setLoading(false)
    }
  }

  const toggleActive = async (id: string, is_active: boolean) => {
    setCoupons((prev) => prev.map((c) => (c.id === id ? { ...c, is_active } : c)))
    await fetch('/api/admin/coupons', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_active }),
    })
  }

  const startEdit = (coupon: Coupon) => {
    setEditingId(coupon.id)
    setShowForm(true)
    setError(null)
    setForm({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: String(coupon.discount_value),
      min_amount: coupon.min_amount ? String(coupon.min_amount) : '',
      max_discount: coupon.max_discount ? String(coupon.max_discount) : '',
      max_uses: coupon.max_uses ? String(coupon.max_uses) : '',
      valid_from: new Date(coupon.valid_from).toISOString().slice(0, 16),
      valid_until: coupon.valid_until
        ? new Date(coupon.valid_until).toISOString().slice(0, 16)
        : '',
    })
  }

  const toggleSelect = (id: string, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? Array.from(new Set([...prev, id])) : prev.filter((item) => item !== id)
    )
  }

  const toggleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? coupons.map((coupon) => coupon.id) : [])
  }

  const removeCoupon = async (id: string) => {
    const confirmed = window.confirm('هل أنت متأكد من حذف هذا الكوبون؟')
    if (!confirmed) return

    setActionLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) {
        const payload = await res.json().catch(() => null)
        throw new Error(payload?.error?.message ?? 'فشل حذف الكوبون')
      }

      setCoupons((prev) => prev.filter((coupon) => coupon.id !== id))
      setSelectedIds((prev) => prev.filter((item) => item !== id))
      if (editingId === id) resetForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل حذف الكوبون')
    } finally {
      setActionLoading(false)
    }
  }

  const bulkSetActive = async (is_active: boolean) => {
    if (selectedIds.length === 0) return

    setActionLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds, is_active }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error?.message ?? 'فشل تحديث الكوبونات')

      const selected = new Set(selectedIds)
      setCoupons((prev) =>
        prev.map((coupon) =>
          selected.has(coupon.id) ? { ...coupon, is_active } : coupon
        )
      )
      setSelectedIds([])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تحديث الكوبونات')
    } finally {
      setActionLoading(false)
    }
  }

  const bulkDelete = async () => {
    if (selectedIds.length === 0) return
    const confirmed = window.confirm(`حذف ${selectedIds.length} كوبون نهائيًا؟`)
    if (!confirmed) return

    setActionLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error?.message ?? 'فشل الحذف الجماعي')

      const selected = new Set(selectedIds)
      setCoupons((prev) => prev.filter((coupon) => !selected.has(coupon.id)))
      setSelectedIds([])
      if (editingId && selected.has(editingId)) resetForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل الحذف الجماعي')
    } finally {
      setActionLoading(false)
    }
  }

  const inputClass = 'w-full bg-cold-black border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cyan-glow/50'
  const labelClass = 'block text-xs font-medium text-muted-foreground mb-1'
  const allSelected = coupons.length > 0 && selectedIds.length === coupons.length

  return (
    <div className="space-y-6">
      {/* Create button */}
      <button
        onClick={() => {
          if (showForm) {
            resetForm()
          } else {
            setShowForm(true)
            setEditingId(null)
          }
        }}
        className="flex items-center gap-2 bg-cyan-glow text-cold-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-cyan-glow/90 transition-colors"
      >
        <Plus size={16} />
        {showForm ? 'إغلاق النموذج' : 'كوبون جديد'}
      </button>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleSave} className="bg-cold-dark border border-border rounded-xl p-6 space-y-4 max-w-2xl">
          <h2 className="font-semibold text-foreground">
            {editingId ? 'تعديل الكوبون' : 'إنشاء كوبون جديد'}
          </h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>كود الكوبون *</label>
              <input
                required
                value={form.code}
                onChange={(e) => set('code', e.target.value)}
                className={inputClass}
                placeholder="SAVE20"
                dir="ltr"
              />
            </div>
            <div>
              <label className={labelClass}>نوع الخصم</label>
              <select
                value={form.discount_type}
                onChange={(e) => set('discount_type', e.target.value)}
                className={inputClass}
              >
                <option value="percentage">نسبة مئوية %</option>
                <option value="fixed">مبلغ ثابت EGP</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className={labelClass}>قيمة الخصم *</label>
              <input
                required
                type="number"
                min={0}
                value={form.discount_value}
                onChange={(e) => set('discount_value', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>الحد الأدنى للطلب</label>
              <input
                type="number"
                min={0}
                value={form.min_amount}
                onChange={(e) => set('min_amount', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>أقصى خصم</label>
              <input
                type="number"
                min={0}
                value={form.max_discount}
                onChange={(e) => set('max_discount', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>أقصى عدد استخدامات</label>
              <input
                type="number"
                min={1}
                value={form.max_uses}
                onChange={(e) => set('max_uses', e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>صالح من *</label>
              <input
                required
                type="datetime-local"
                value={form.valid_from}
                onChange={(e) => set('valid_from', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>صالح حتى</label>
              <input
                type="datetime-local"
                value={form.valid_until}
                onChange={(e) => set('valid_until', e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="bg-cyan-glow text-cold-black px-5 py-2 rounded-lg text-sm font-semibold hover:bg-cyan-glow/90 disabled:opacity-50 transition-colors"
            >
              {loading ? 'جاري الحفظ...' : editingId ? 'حفظ التعديلات' : 'إنشاء'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-5 py-2 rounded-lg text-sm text-muted-foreground border border-border hover:text-foreground transition-colors"
            >
              إلغاء
            </button>
          </div>
        </form>
      )}

      {/* Coupons table */}
      <div className="bg-cold-dark border border-border rounded-xl overflow-hidden">
        {selectedIds.length > 0 && (
          <div className="px-4 py-3 border-b border-border bg-white/5 flex flex-wrap items-center gap-2">
            <span className="text-sm text-foreground">
              تم تحديد {selectedIds.length} كوبون
            </span>
            <button
              type="button"
              onClick={() => bulkSetActive(true)}
              disabled={actionLoading}
              className="px-3 py-1.5 rounded-lg text-xs border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 disabled:opacity-60"
            >
              تفعيل
            </button>
            <button
              type="button"
              onClick={() => bulkSetActive(false)}
              disabled={actionLoading}
              className="px-3 py-1.5 rounded-lg text-xs border border-yellow-500/40 text-yellow-300 hover:bg-yellow-500/10 disabled:opacity-60"
            >
              تعطيل
            </button>
            <button
              type="button"
              onClick={bulkDelete}
              disabled={actionLoading}
              className="px-3 py-1.5 rounded-lg text-xs border border-red-500/40 text-red-300 hover:bg-red-500/10 disabled:opacity-60"
            >
              حذف جماعي
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                    className="accent-cyan-glow"
                    aria-label="تحديد الكل"
                  />
                </th>
                <th className="text-right px-6 py-3 font-medium">الكود</th>
                <th className="text-right px-6 py-3 font-medium">الخصم</th>
                <th className="text-right px-6 py-3 font-medium">الاستخدام</th>
                <th className="text-right px-6 py-3 font-medium">الصلاحية</th>
                <th className="text-right px-6 py-3 font-medium">مفعّل</th>
                <th className="text-right px-6 py-3 font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id} className="border-b border-border/50 hover:bg-white/2 transition-colors">
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(c.id)}
                      onChange={(e) => toggleSelect(c.id, e.target.checked)}
                      className="accent-cyan-glow"
                      aria-label={`تحديد ${c.code}`}
                    />
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-cyan-glow">{c.code}</td>
                  <td className="px-6 py-4 text-foreground">
                    {c.discount_type === 'percentage'
                      ? `${c.discount_value}%`
                      : `${c.discount_value} EGP`}
                    {c.min_amount && (
                      <span className="block text-xs text-muted-foreground">حد أدنى: {c.min_amount} EGP</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {c.usage_count}
                    {c.max_uses ? ` / ${c.max_uses}` : ''}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground text-xs">
                    {c.valid_until
                      ? new Date(c.valid_until).toLocaleDateString('ar-EG')
                      : 'بلا انتهاء'}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleActive(c.id, !c.is_active)}
                      className={`w-10 h-5 rounded-full transition-colors relative ${c.is_active ? 'bg-cyan-glow' : 'bg-zinc-700'}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${c.is_active ? 'right-0.5' : 'left-0.5'}`} />
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => startEdit(c)}
                        className="text-xs text-cyan-glow hover:underline"
                      >
                        تعديل
                      </button>
                      <button
                        type="button"
                        onClick={() => removeCoupon(c.id)}
                        disabled={actionLoading}
                        className="inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-300 disabled:opacity-60"
                      >
                        <Trash2 size={13} />
                        حذف
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {coupons.length === 0 && (
          <p className="text-center text-muted-foreground py-12">لا توجد كوبونات بعد</p>
        )}
      </div>
    </div>
  )
}
