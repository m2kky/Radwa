/**
 * Admin KYC Page
 *
 * Lists user KYC submissions and allows approve/reject actions.
 */
import { createAdminClient } from '@/lib/supabase/server'
import KycManager from '@/components/admin/kyc-manager'

interface KycRequest {
  id: string
  name: string
  phone: string | null
  installment_status: 'pending' | 'approved' | 'rejected'
  id_front_url: string | null
  id_back_url: string | null
  photo_url: string | null
  rejection_reason: string | null
  created_at: string
  updated_at: string
}

async function getKycRequests(): Promise<KycRequest[]> {
  const admin = createAdminClient()

  const { data } = await admin
    .from('users')
    .select(`
      id,
      name,
      phone,
      installment_status,
      id_front_url,
      id_back_url,
      photo_url,
      rejection_reason,
      created_at,
      updated_at
    `)
    .neq('installment_status', 'none')
    .order('updated_at', { ascending: false })

  return (data ?? []) as KycRequest[]
}

export default async function AdminKycPage() {
  const requests = await getKycRequests()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground">طلبات KYC</h1>
        <p className="text-sm text-muted-foreground mt-1">
          راجع مستندات الهوية ثم اقبل أو ارفض طلب التقسيط.
        </p>
      </div>

      <KycManager initialRequests={requests} />
    </div>
  )
}
