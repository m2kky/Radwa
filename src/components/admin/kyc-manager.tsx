/**
 * KYC Manager Component
 *
 * Client component for admin KYC review (approve/reject).
 */
'use client'

import { useMemo, useState } from 'react'
import { CheckIcon, X } from 'lucide-react'

type KycStatus = 'pending' | 'approved' | 'rejected'

interface KycRequest {
  id: string
  name: string
  phone: string | null
  installment_status: KycStatus
  id_front_url: string | null
  id_back_url: string | null
  photo_url: string | null
  rejection_reason: string | null
  created_at: string
  updated_at: string
}

const FILTERS: Array<'all' | KycStatus> = ['all', 'pending', 'approved', 'rejected']

const STATUS_LABEL: Record<'all' | KycStatus, string> = {
  all: 'الكل',
  pending: 'قيد المراجعة',
  approved: 'مقبول',
  rejected: 'مرفوض',
}

const STATUS_BADGE: Record<KycStatus, string> = {
  pending: 'text-yellow-400 bg-yellow-400/10',
  approved: 'text-emerald-400 bg-emerald-400/10',
  rejected: 'text-red-400 bg-red-400/10',
}

function getKycDocHref(pathOrUrl: string): string {
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl
  }
  return `/api/admin/kyc/file?path=${encodeURIComponent(pathOrUrl)}`
}

export default function KycManager({ initialRequests }: { initialRequests: KycRequest[] }) {
  const [requests, setRequests] = useState<KycRequest[]>(initialRequests)
  const [filter, setFilter] = useState<'all' | KycStatus>('pending')
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reasons, setReasons] = useState<Record<string, string>>({})

  const filtered = useMemo(() => {
    if (filter === 'all') return requests
    return requests.filter((r) => r.installment_status === filter)
  }, [filter, requests])

  const setReason = (id: string, value: string) => {
    setReasons((prev) => ({ ...prev, [id]: value }))
  }

  const updateStatus = async (id: string, status: KycStatus) => {
    if (status === 'rejected' && !(reasons[id] ?? '').trim()) {
      setError('سبب الرفض مطلوب')
      return
    }

    setLoadingId(id)
    setError(null)

    try {
      const res = await fetch(`/api/admin/kyc/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          rejection_reason: status === 'rejected' ? (reasons[id] ?? '').trim() : undefined,
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message ?? 'فشل تحديث الحالة')

      const updated: KycRequest = json.data
      setRequests((prev) => prev.map((r) => (r.id === id ? updated : r)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع')
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f) => {
          const count = f === 'all'
            ? requests.length
            : requests.filter((r) => r.installment_status === f).length
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
                filter === f
                  ? 'bg-cyan-glow text-cold-black font-semibold'
                  : 'bg-cold-dark border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {STATUS_LABEL[f]}
              <span className="mr-1.5 text-xs opacity-70">({count})</span>
            </button>
          )
        })}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="bg-cold-dark border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-right px-6 py-3 font-medium">المستخدم</th>
                <th className="text-right px-6 py-3 font-medium">المستندات</th>
                <th className="text-right px-6 py-3 font-medium">الحالة</th>
                <th className="text-right px-6 py-3 font-medium">سبب الرفض</th>
                <th className="text-right px-6 py-3 font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-b border-border/50 hover:bg-white/2 transition-colors align-top">
                  <td className="px-6 py-4">
                    <p className="font-medium text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.phone ?? 'بدون رقم هاتف'}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.updated_at).toLocaleString('ar-EG')}
                    </p>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {item.id_front_url && (
                        <a
                          href={getKycDocHref(item.id_front_url)}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-1 rounded-md text-xs bg-white/5 border border-border text-foreground hover:bg-white/10"
                        >
                          البطاقة (أمام)
                        </a>
                      )}
                      {item.id_back_url && (
                        <a
                          href={getKycDocHref(item.id_back_url)}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-1 rounded-md text-xs bg-white/5 border border-border text-foreground hover:bg-white/10"
                        >
                          البطاقة (خلف)
                        </a>
                      )}
                      {item.photo_url && (
                        <a
                          href={getKycDocHref(item.photo_url)}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-1 rounded-md text-xs bg-white/5 border border-border text-foreground hover:bg-white/10"
                        >
                          صورة شخصية
                        </a>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_BADGE[item.installment_status]}`}>
                      {STATUS_LABEL[item.installment_status]}
                    </span>
                  </td>

                  <td className="px-6 py-4 min-w-56">
                    {item.installment_status === 'rejected' ? (
                      <p className="text-xs text-red-300">{item.rejection_reason ?? '—'}</p>
                    ) : (
                      <textarea
                        placeholder="سبب الرفض (مطلوب عند الرفض)"
                        value={reasons[item.id] ?? ''}
                        onChange={(e) => setReason(item.id, e.target.value)}
                        className="w-full bg-cold-black border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cyan-glow/50 min-h-16"
                      />
                    )}
                  </td>

                  <td className="px-6 py-4">
                    {item.installment_status === 'pending' ? (
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => updateStatus(item.id, 'approved')}
                          disabled={loadingId === item.id}
                          className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 disabled:opacity-50"
                        >
                          <CheckIcon size={14} />
                          قبول
                        </button>
                        <button
                          onClick={() => updateStatus(item.id, 'rejected')}
                          disabled={loadingId === item.id}
                          className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium bg-red-500/15 text-red-300 hover:bg-red-500/25 disabled:opacity-50"
                        >
                          <X size={14} />
                          رفض
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">تمت المعالجة</p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-12">لا توجد طلبات KYC في هذا التصنيف</p>
        )}
      </div>
    </div>
  )
}
