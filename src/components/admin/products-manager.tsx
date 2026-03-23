'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2 } from 'lucide-react'
import ProductStatusToggle from '@/components/admin/product-status-toggle'
import type { ProductStatus } from '@/types'

interface ProductRow {
  id: string
  slug: string
  title: string
  price: number
  status: ProductStatus
  is_featured: boolean
  installments_enabled: boolean
}

const statusColors: Record<ProductStatus, string> = {
  published: 'text-emerald-400 bg-emerald-400/10',
  draft: 'text-yellow-400 bg-yellow-400/10',
  archived: 'text-zinc-400 bg-zinc-400/10',
}

const statusLabels: Record<ProductStatus, string> = {
  published: 'منشور',
  draft: 'مسودة',
  archived: 'مؤرشف',
}

export default function ProductsManager({ initialProducts }: { initialProducts: ProductRow[] }) {
  const router = useRouter()
  const [products, setProducts] = useState<ProductRow[]>(initialProducts)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const allSelected = useMemo(
    () => products.length > 0 && selectedIds.length === products.length,
    [products, selectedIds]
  )

  const selectedCount = selectedIds.length

  const toggleSelect = (id: string, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? Array.from(new Set([...prev, id])) : prev.filter((item) => item !== id)
    )
  }

  const toggleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? products.map((product) => product.id) : [])
  }

  const deleteOne = async (id: string) => {
    const confirmed = window.confirm('هل أنت متأكد من حذف هذا المنتج؟')
    if (!confirmed) return

    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const payload = await res.json().catch(() => null)
        throw new Error(payload?.error?.message ?? 'فشل حذف المنتج')
      }

      setProducts((prev) => prev.filter((product) => product.id !== id))
      setSelectedIds((prev) => prev.filter((item) => item !== id))
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل حذف المنتج')
    } finally {
      setBusy(false)
    }
  }

  const bulkDelete = async () => {
    if (selectedIds.length === 0) return
    const confirmed = window.confirm(`حذف ${selectedIds.length} منتج نهائيًا؟`)
    if (!confirmed) return

    setBusy(true)
    setError(null)
    try {
      const targets = [...selectedIds]
      const results = await Promise.allSettled(
        targets.map((id) => fetch(`/api/admin/products/${id}`, { method: 'DELETE' }))
      )
      const failed = results.filter((r) => r.status === 'rejected').length
      const fulfilled = results
        .filter((r): r is PromiseFulfilledResult<Response> => r.status === 'fulfilled')
        .map((r) => r.value)
      const failedHttp = fulfilled.filter((res) => !res.ok).length

      if (failed > 0 || failedHttp > 0) {
        throw new Error('تم حذف جزء من المنتجات فقط. أعد المحاولة للمتبقي.')
      }

      setProducts((prev) => prev.filter((product) => !targets.includes(product.id)))
      setSelectedIds([])
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل الحذف الجماعي')
    } finally {
      setBusy(false)
    }
  }

  const bulkSetStatus = async (status: ProductStatus) => {
    if (selectedIds.length === 0) return

    setBusy(true)
    setError(null)
    try {
      const targets = [...selectedIds]
      const results = await Promise.allSettled(
        targets.map((id) =>
          fetch(`/api/admin/products/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
          })
        )
      )

      const failed = results.filter((r) => r.status === 'rejected').length
      const fulfilled = results
        .filter((r): r is PromiseFulfilledResult<Response> => r.status === 'fulfilled')
        .map((r) => r.value)
      const failedHttp = fulfilled.filter((res) => !res.ok).length

      if (failed > 0 || failedHttp > 0) {
        throw new Error('تعذر تحديث حالة بعض المنتجات')
      }

      setProducts((prev) =>
        prev.map((product) =>
          targets.includes(product.id) ? { ...product, status } : product
        )
      )
      setSelectedIds([])
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تحديث الحالة')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="bg-cold-dark border border-border rounded-xl overflow-hidden">
        {selectedCount > 0 && (
          <div className="px-4 py-3 border-b border-border bg-white/5 flex flex-wrap items-center gap-2">
            <span className="text-sm text-foreground">
              تم تحديد {selectedCount} منتج
            </span>
            <button
              type="button"
              onClick={() => bulkSetStatus('published')}
              disabled={busy}
              className="px-3 py-1.5 rounded-lg text-xs border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 disabled:opacity-60"
            >
              نشر
            </button>
            <button
              type="button"
              onClick={() => bulkSetStatus('draft')}
              disabled={busy}
              className="px-3 py-1.5 rounded-lg text-xs border border-yellow-500/40 text-yellow-300 hover:bg-yellow-500/10 disabled:opacity-60"
            >
              تحويل لمسودة
            </button>
            <button
              type="button"
              onClick={() => bulkSetStatus('archived')}
              disabled={busy}
              className="px-3 py-1.5 rounded-lg text-xs border border-zinc-500/40 text-zinc-300 hover:bg-zinc-500/10 disabled:opacity-60"
            >
              أرشفة
            </button>
            <button
              type="button"
              onClick={bulkDelete}
              disabled={busy}
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
                <th className="text-right px-6 py-3 font-medium">المنتج</th>
                <th className="text-right px-6 py-3 font-medium">السعر</th>
                <th className="text-right px-6 py-3 font-medium">الحالة</th>
                <th className="text-right px-6 py-3 font-medium">تقسيط</th>
                <th className="text-right px-6 py-3 font-medium">مميز</th>
                <th className="text-right px-6 py-3 font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-border/50 hover:bg-white/2 transition-colors">
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(product.id)}
                      onChange={(e) => toggleSelect(product.id, e.target.checked)}
                      className="accent-cyan-glow"
                      aria-label={`تحديد ${product.title}`}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-foreground">{product.title}</p>
                    <p className="text-xs text-muted-foreground">{product.slug}</p>
                  </td>
                  <td className="px-6 py-4 text-foreground">{product.price.toLocaleString('ar-EG')} EGP</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[product.status]}`}>
                      {statusLabels[product.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <ProductStatusToggle
                      id={product.id}
                      field="installments_enabled"
                      value={product.installments_enabled}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <ProductStatusToggle
                      id={product.id}
                      field="is_featured"
                      value={product.is_featured}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-cyan-glow transition-colors"
                      >
                        <Pencil size={13} />
                        تعديل
                      </Link>
                      <button
                        type="button"
                        onClick={() => deleteOne(product.id)}
                        disabled={busy}
                        className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 disabled:opacity-60 transition-colors"
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

        {products.length === 0 && (
          <p className="text-center text-muted-foreground py-12">لا توجد منتجات بعد</p>
        )}
      </div>
    </div>
  )
}
