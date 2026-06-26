'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Download, Pencil, Trash2 } from 'lucide-react'
import type { Guide, GuideStatus } from '@/types'

const statusLabels: Record<GuideStatus, string> = {
  draft: 'مسودة',
  published: 'منشور',
  archived: 'مؤرشف',
}

const statusClasses: Record<GuideStatus, string> = {
  draft: 'bg-yellow-500/10 text-yellow-400',
  published: 'bg-emerald-500/10 text-emerald-400',
  archived: 'bg-zinc-500/10 text-zinc-400',
}

export default function GuidesManager({ initialGuides }: { initialGuides: Guide[] }) {
  const router = useRouter()
  const [guides, setGuides] = useState(initialGuides)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const remove = async (id: string) => {
    if (!window.confirm('حذف هذا المورد نهائيًا؟')) return
    setBusyId(id)
    setError(null)
    try {
      const res = await fetch(`/api/admin/guides/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error?.message ?? 'فشل الحذف')
      }
      setGuides((prev) => prev.filter((guide) => guide.id !== id))
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل الحذف')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-border bg-cold-dark">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="px-6 py-3 text-right font-medium">المورد</th>
                <th className="px-6 py-3 text-right font-medium">التصنيف</th>
                <th className="px-6 py-3 text-right font-medium">الحالة</th>
                <th className="px-6 py-3 text-right font-medium">التحميلات</th>
                <th className="px-6 py-3 text-right font-medium">تاريخ الإضافة</th>
                <th className="px-6 py-3 text-right font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {guides.map((guide) => (
                <tr key={guide.id} className="hover:bg-white/[0.02]">
                  <td className="px-6 py-4">
                    <p className="font-medium text-foreground">{guide.title}</p>
                    <p className="text-xs text-muted-foreground" dir="ltr">{guide.slug}</p>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{guide.category || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses[guide.status]}`}>
                      {statusLabels[guide.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Download size={14} />
                      {guide.download_count.toLocaleString('ar-EG')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-muted-foreground">
                    {new Date(guide.created_at).toLocaleDateString('ar-EG')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Link href={`/admin/guides/${guide.id}/edit`} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-cyan-glow">
                        <Pencil size={14} />
                        تعديل
                      </Link>
                      <button
                        type="button"
                        onClick={() => remove(guide.id)}
                        disabled={busyId === guide.id}
                        className="inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
                      >
                        <Trash2 size={14} />
                        حذف
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {guides.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">لا توجد Guides أو Templates حتى الآن.</p>
        ) : null}
      </div>
    </div>
  )
}
