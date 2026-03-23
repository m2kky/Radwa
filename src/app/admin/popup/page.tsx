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

async function getPopupLeads() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('popup_leads')
    .select('id, popup_id, name, email, phone, source_path, created_at')
    .order('created_at', { ascending: false })
    .limit(100)

  return data ?? []
}

export default async function AdminPopupPage() {
  const [popup, leads] = await Promise.all([getLatestPopup(), getPopupLeads()])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground">Popup الزوار</h1>
        <p className="text-sm text-muted-foreground mt-1">
          من هنا تقدر تضيف/تعدل Popup يظهر لزوار الموقع، وتتحكم في شكله، الأكشنز، وجمع بيانات الزوار.
        </p>
      </div>
      <PopupManager
        initialPopup={popup as Record<string, unknown> | null}
        initialLeads={leads as Array<Record<string, unknown>>}
      />
    </div>
  )
}
