'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Pencil, Trash2, Globe, Loader2 } from 'lucide-react'
import type { PortfolioItem } from '@/types'
import { useRouter } from 'next/navigation'

export default function PortfolioManager({ initialItems }: { initialItems: PortfolioItem[] }) {
  const [items, setItems] = useState(initialItems)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const router = useRouter()

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا العمل نهائياً؟')) return

    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/portfolio/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setItems(prev => prev.filter(i => i.id !== id))
      router.refresh()
    } catch {
      alert('حدث خطأ أثناء الحذف')
    } finally {
      setDeletingId(null)
    }
  }

  const toggleStatus = async (item: PortfolioItem) => {
    try {
      const res = await fetch(`/api/admin/portfolio/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: !item.is_published }),
      })
      if (!res.ok) throw new Error('Failed to update')
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_published: !i.is_published } : i))
      router.refresh()
    } catch {
      alert('حدث خطأ أثناء التحديث')
    }
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 bg-cold-black rounded-lg border border-border">
        <p className="text-muted-foreground mb-4">لا توجد أعمال حتى الآن.</p>
        <Link
          href="/admin/portfolio/new"
          className="inline-flex items-center gap-2 bg-cyan-glow text-cold-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-cyan-glow/90"
        >
          إضافة أول عمل
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-cold-black rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-right text-sm">
          <thead className="text-xs text-muted-foreground bg-black/20 border-b border-border">
            <tr>
              <th className="px-6 py-4 font-medium">العمل</th>
              <th className="px-6 py-4 font-medium">النوع</th>
              <th className="px-6 py-4 font-medium">التصنيف</th>
              <th className="px-6 py-4 font-medium">الحالة</th>
              <th className="px-6 py-4 font-medium">تاريخ الإضافة</th>
              <th className="px-6 py-4 font-medium w-24">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {item.thumbnail_url && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={item.thumbnail_url} alt={item.title} className="w-10 h-10 rounded object-cover" />
                    )}
                    <div>
                      <p className="font-medium text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground" dir="ltr">{item.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-muted-foreground">
                  {item.item_type === 'project' ? 'مشروع' : 'دراسة حالة'}
                </td>
                <td className="px-6 py-4 text-muted-foreground">
                  {item.category || '-'}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => toggleStatus(item)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                      item.is_published 
                        ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' 
                        : 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20'
                    }`}
                  >
                    {item.is_published ? <Globe size={12} /> : <Pencil size={12} />}
                    {item.is_published ? 'منشور' : 'مسودة'}
                  </button>
                </td>
                <td className="px-6 py-4 text-muted-foreground" dir="ltr">
                  {new Date(item.created_at).toLocaleDateString('en-GB')}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/portfolio/${item.id}/edit`}
                      className="p-2 text-muted-foreground hover:text-cyan-glow hover:bg-cyan-glow/10 rounded-lg transition-colors"
                      title="تعديل"
                    >
                      <Pencil size={16} />
                    </Link>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      className="p-2 text-muted-foreground hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                      title="حذف"
                    >
                      {deletingId === item.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
