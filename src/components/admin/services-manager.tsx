'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Pencil, Trash2 } from 'lucide-react'
import type { Service, ServiceLead, ServiceStatus } from '@/types'

const statusLabels: Record<ServiceStatus, string> = {
  draft: 'مسودة',
  published: 'منشور',
  archived: 'مؤرشف',
}

const statusClasses: Record<ServiceStatus, string> = {
  draft: 'bg-yellow-500/10 text-yellow-400',
  published: 'bg-emerald-500/10 text-emerald-400',
  archived: 'bg-zinc-500/10 text-zinc-400',
}

export default function ServicesManager({
  initialServices,
  leads,
}: {
  initialServices: Service[]
  leads: ServiceLead[]
}) {
  const router = useRouter()
  const [services, setServices] = useState(initialServices)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const remove = async (id: string) => {
    if (!window.confirm('حذف هذه الخدمة نهائيًا؟')) return
    setBusyId(id)
    setError(null)
    try {
      const res = await fetch(`/api/admin/services/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error?.message ?? 'فشل الحذف')
      }
      setServices((prev) => prev.filter((service) => service.id !== id))
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل الحذف')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-8">
      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-border bg-cold-dark">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-semibold text-foreground">الخدمات</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="px-6 py-3 text-right font-medium">الخدمة</th>
                <th className="px-6 py-3 text-right font-medium">CTA</th>
                <th className="px-6 py-3 text-right font-medium">الحالة</th>
                <th className="px-6 py-3 text-right font-medium">الترتيب</th>
                <th className="px-6 py-3 text-right font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {services.map((service) => (
                <tr key={service.id} className="hover:bg-white/[0.02]">
                  <td className="px-6 py-4">
                    <p className="font-medium text-foreground">{service.title}</p>
                    <p className="text-xs text-muted-foreground" dir="ltr">{service.slug}</p>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{service.cta_type}</td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses[service.status]}`}>
                      {statusLabels[service.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{service.sort_order}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Link href={`/admin/services/${service.id}/edit`} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-cyan-glow">
                        <Pencil size={14} />
                        تعديل
                      </Link>
                      <button
                        type="button"
                        onClick={() => remove(service.id)}
                        disabled={busyId === service.id}
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
        {services.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">لا توجد خدمات حتى الآن.</p>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-cold-dark">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-semibold text-foreground">طلبات الخدمات</h2>
          <p className="mt-1 text-xs text-muted-foreground">آخر البيانات المرسلة من فورم الخدمات.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="px-6 py-3 text-right font-medium">العميل</th>
                <th className="px-6 py-3 text-right font-medium">الخدمة</th>
                <th className="px-6 py-3 text-right font-medium">الشركة</th>
                <th className="px-6 py-3 text-right font-medium">الميزانية</th>
                <th className="px-6 py-3 text-right font-medium">التوقيت</th>
                <th className="px-6 py-3 text-right font-medium">الرسالة</th>
                <th className="px-6 py-3 text-right font-medium">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {leads.map((lead) => (
                <tr key={lead.id} className="align-top hover:bg-white/[0.02]">
                  <td className="px-6 py-4">
                    <p className="font-medium text-foreground">{lead.name}</p>
                    <p className="inline-flex items-center gap-1 text-xs text-muted-foreground" dir="ltr">
                      <Mail size={12} />
                      {lead.email}
                    </p>
                    <p className="text-xs text-muted-foreground" dir="ltr">{lead.phone}</p>
                  </td>
                  <td className="px-6 py-4 text-foreground">{lead.service_title || '-'}</td>
                  <td className="px-6 py-4 text-muted-foreground">{lead.company || '-'}</td>
                  <td className="px-6 py-4 text-muted-foreground">{lead.budget || '-'}</td>
                  <td className="px-6 py-4 text-muted-foreground">{lead.timeline || '-'}</td>
                  <td className="max-w-sm px-6 py-4 text-muted-foreground">{lead.message}</td>
                  <td className="px-6 py-4 text-xs text-muted-foreground">
                    {new Date(lead.created_at).toLocaleString('ar-EG')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {leads.length === 0 ? (
          <p className="py-10 text-center text-muted-foreground">لا توجد طلبات خدمات حتى الآن.</p>
        ) : null}
      </div>
    </div>
  )
}
