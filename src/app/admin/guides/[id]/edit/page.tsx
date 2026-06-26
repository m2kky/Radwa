import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import GuideForm from '@/components/admin/guide-form'
import type { Guide } from '@/types'

async function getGuide(id: string): Promise<Guide | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('guides')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  return data as Guide | null
}

export default async function EditGuidePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const guide = await getGuide(id)
  if (!guide) notFound()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground">تعديل Guide / Template</h1>
        <p className="mt-1 text-sm text-muted-foreground">تحديث المحتوى وملف التحميل.</p>
      </div>

      <GuideForm id={id} defaultValues={guide} />
    </div>
  )
}
