import PopupManager from '@/components/admin/popup-manager'
import { createAdminClient } from '@/lib/supabase/server'

export const metadata = { title: 'Popup الزوار' }

async function getLatestPopup() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('site_popups')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return data ?? null
}

export default async function AdminPopupPage() {
  const popup = await getLatestPopup()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground">Popup الزوار</h1>
        <p className="text-sm text-muted-foreground mt-1">
          من هنا تقدر تضيف/تعدل Popup يظهر لزوار الموقع وتتحكم في وقته وزر الـ CTA.
        </p>
      </div>
      <PopupManager initialPopup={popup as Record<string, unknown> | null} />
    </div>
  )
}
