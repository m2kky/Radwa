import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import PortfolioForm from '@/components/admin/portfolio-form'

async function getPortfolioItem(id: string) {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('portfolio_items')
    .select('*')
    .eq('id', id)
    .single()
  return data
}

export default async function EditPortfolioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const item = await getPortfolioItem(id)

  if (!item) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground">تعديل العمل</h1>
        <p className="text-sm text-muted-foreground mt-1">تحديث تفاصيل المشروع أو دراسة الحالة.</p>
      </div>

      <PortfolioForm id={id} defaultValues={item} />
    </div>
  )
}
