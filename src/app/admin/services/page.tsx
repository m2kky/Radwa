import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/server'
import ServicesManager from '@/components/admin/services-manager'
import type { Service, ServiceLead } from '@/types'

async function getServices(): Promise<Service[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('services')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
  return (data ?? []) as Service[]
}

async function getLeads(): Promise<ServiceLead[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('service_leads')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)
  return (data ?? []) as ServiceLead[]
}

export default async function AdminServicesPage() {
  const [services, leads] = await Promise.all([getServices(), getLeads()])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">الخدمات</h1>
          <p className="mt-1 text-sm text-muted-foreground">إدارة صفحة الخدمات وطلبات العملاء.</p>
        </div>
        <Link href="/admin/services/new" className="inline-flex items-center gap-2 rounded-lg bg-cyan-glow px-4 py-2 text-sm font-semibold text-cold-black hover:bg-cyan-glow/90">
          <Plus size={16} />
          خدمة جديدة
        </Link>
      </div>

      <ServicesManager initialServices={services} leads={leads} />
    </div>
  )
}
