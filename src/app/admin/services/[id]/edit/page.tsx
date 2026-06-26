import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import ServiceForm from '@/components/admin/service-form'
import type { Service } from '@/types'

async function getService(id: string): Promise<Service | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('services')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  return data as Service | null
}

export default async function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const service = await getService(id)
  if (!service) notFound()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground">تعديل خدمة</h1>
        <p className="mt-1 text-sm text-muted-foreground">تحديث تفاصيل الخدمة والـ CTA.</p>
      </div>

      <ServiceForm id={id} defaultValues={service} />
    </div>
  )
}
