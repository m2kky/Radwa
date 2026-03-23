'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2 } from 'lucide-react'

interface BlogRow {
  id: string
  slug: string
  title: string
  category: string | null
  status: 'draft' | 'published'
  is_featured: boolean
  published_at: string | null
}

export default function BlogManager({ initialPosts }: { initialPosts: BlogRow[] }) {
  const router = useRouter()
  const [posts, setPosts] = useState<BlogRow[]>(initialPosts)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const allSelected = useMemo(
    () => posts.length > 0 && selectedIds.length === posts.length,
    [posts, selectedIds]
  )

  const toggleSelect = (id: string, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? Array.from(new Set([...prev, id])) : prev.filter((item) => item !== id)
    )
  }

  const toggleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? posts.map((post) => post.id) : [])
  }

  const deleteOne = async (id: string) => {
    const confirmed = window.confirm('هل أنت متأكد من حذف هذا المقال؟')
    if (!confirmed) return

    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/blog/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const payload = await res.json().catch(() => null)
        throw new Error(payload?.error?.message ?? 'فشل حذف المقال')
      }

      setPosts((prev) => prev.filter((post) => post.id !== id))
      setSelectedIds((prev) => prev.filter((item) => item !== id))
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل حذف المقال')
    } finally {
      setBusy(false)
    }
  }

  const bulkDelete = async () => {
    if (selectedIds.length === 0) return
    const confirmed = window.confirm(`حذف ${selectedIds.length} مقال نهائيًا؟`)
    if (!confirmed) return

    setBusy(true)
    setError(null)
    try {
      const targets = [...selectedIds]
      const results = await Promise.allSettled(
        targets.map((id) => fetch(`/api/admin/blog/${id}`, { method: 'DELETE' }))
      )

      const failed = results.filter((r) => r.status === 'rejected').length
      const fulfilled = results
        .filter((r): r is PromiseFulfilledResult<Response> => r.status === 'fulfilled')
        .map((r) => r.value)
      const failedHttp = fulfilled.filter((res) => !res.ok).length

      if (failed > 0 || failedHttp > 0) {
        throw new Error('تم حذف جزء من المقالات فقط. أعد المحاولة.')
      }

      setPosts((prev) => prev.filter((post) => !targets.includes(post.id)))
      setSelectedIds([])
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل الحذف الجماعي')
    } finally {
      setBusy(false)
    }
  }

  const bulkSetStatus = async (status: 'draft' | 'published') => {
    if (selectedIds.length === 0) return

    setBusy(true)
    setError(null)
    try {
      const targets = [...selectedIds]
      const results = await Promise.allSettled(
        targets.map((id) =>
          fetch(`/api/admin/blog/${id}`, {
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
        throw new Error('تعذر تحديث حالة بعض المقالات')
      }

      setPosts((prev) =>
        prev.map((post) => (targets.includes(post.id) ? { ...post, status } : post))
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

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {selectedIds.length > 0 && (
          <div className="px-4 py-3 border-b border-border bg-white/5 flex flex-wrap items-center gap-2">
            <span className="text-sm text-foreground">
              تم تحديد {selectedIds.length} مقال
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
              onClick={bulkDelete}
              disabled={busy}
              className="px-3 py-1.5 rounded-lg text-xs border border-red-500/40 text-red-300 hover:bg-red-500/10 disabled:opacity-60"
            >
              حذف جماعي
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b border-border">
              <tr className="text-muted-foreground text-xs uppercase tracking-wider">
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                    className="accent-cyan-glow"
                    aria-label="تحديد الكل"
                  />
                </th>
                <th className="text-right px-4 py-3">العنوان</th>
                <th className="text-right px-4 py-3">التصنيف</th>
                <th className="text-right px-4 py-3">الحالة</th>
                <th className="text-right px-4 py-3">تاريخ النشر</th>
                <th className="text-right px-4 py-3">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(post.id)}
                      onChange={(e) => toggleSelect(post.id, e.target.checked)}
                      className="accent-cyan-glow"
                      aria-label={`تحديد ${post.title}`}
                    />
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {post.title}
                    {post.is_featured && <span className="mr-2 text-xs text-primary">★ مميز</span>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{post.category ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${post.status === 'published' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                      {post.status === 'published' ? 'منشور' : 'مسودة'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {post.published_at ? new Date(post.published_at).toLocaleDateString('ar-EG') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-4">
                      <Link
                        href={`/admin/blog/${post.id}/edit`}
                        className="inline-flex items-center gap-1 text-xs text-cyan-glow hover:underline"
                      >
                        <Pencil size={13} />
                        تعديل
                      </Link>
                      <button
                        type="button"
                        onClick={() => deleteOne(post.id)}
                        disabled={busy}
                        className="inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-300 disabled:opacity-60"
                      >
                        <Trash2 size={13} />
                        حذف
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {posts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">لا توجد مقالات بعد</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
