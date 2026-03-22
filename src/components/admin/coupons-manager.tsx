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
import { Plus } from 'lucide-react'
import type { Coupon } from '@/types'

interface NewCoupon {
  code: string
  discount_type: 'percentage' | 'fixed'
  discount_value: string
  min_amount: string
  max_uses: string
  valid_from: string
  valid_until: string
}

const EMPTY: NewCoupon = {
  code: '',
  discount_type: 'percentage',
  discount_value: '',
  min_amount: '',
  max_uses: '',
  valid_from: new Date().toISOString().slice(0, 16),
  valid_until: '',
}

export default function CouponsManager({ initialCoupons }: { initialCoupons: Coupon[] }) {
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<NewCoupon>(EMPTY)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (k: keyof NewCoupon, v: string) => setForm((p) => ({ ...p, [k]: v }))

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: form.code.toUpperCase(),
          discount_type: form.discount_type,
          discount_value: Number(form.discount_value),
          min_amount: form.min_amount ? Number(form.min_amount) : undefined,
          max_uses: form.max_uses ? Number(form.max_uses) : undefined,
          valid_from: new Date(form.valid_from).toISOString(),
          valid_until: form.valid_until ? new Date(form.valid_until).toISOString() : undefined,
          is_active: true,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message ?? 'حدث خطأ')
      setCoupons([data.data, ...coupons])
      setForm(EMPTY)
      setShowForm(false)
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

  const inputClass = 'w-full bg-cold-black border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cyan-glow/50'
  const labelClass = 'block text-xs font-medium text-muted-foreground mb-1'

  return (
    <div className="space-y-6">
      {/* Create button */}
      <button
        onClick={() => setShowForm(!showForm)}
        className="flex items-center gap-2 bg-cyan-glow text-cold-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-cyan-glow/90 transition-colors"
      >
        <Plus size={16} />
        كوبون جديد
      </button>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-cold-dark border border-border rounded-xl p-6 space-y-4 max-w-2xl">
          <h2 className="font-semibold text-foreground">إنشاء كوبون جديد</h2>

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

          <div className="grid grid-cols-3 gap-4">
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
              {loading ? 'جاري الإنشاء...' : 'إنشاء'}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setError(null) }}
              className="px-5 py-2 rounded-lg text-sm text-muted-foreground border border-border hover:text-foreground transition-colors"
            >
              إلغاء
            </button>
          </div>
        </form>
      )}

      {/* Coupons table */}
      <div className="bg-cold-dark border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="text-right px-6 py-3 font-medium">الكود</th>
              <th className="text-right px-6 py-3 font-medium">الخصم</th>
              <th className="text-right px-6 py-3 font-medium">الاستخدام</th>
              <th className="text-right px-6 py-3 font-medium">الصلاحية</th>
              <th className="text-right px-6 py-3 font-medium">مفعّل</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.id} className="border-b border-border/50 hover:bg-white/2 transition-colors">
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
              </tr>
            ))}
          </tbody>
        </table>
        {coupons.length === 0 && (
          <p className="text-center text-muted-foreground py-12">لا توجد كوبونات بعد</p>
        )}
      </div>
    </div>
  )
}
