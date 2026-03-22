/**
 * Admin Coupons Page
 *
 * Lists all coupons and provides a form to create new ones.
 *
 * @phase Phase 5: Admin
 * @author Agent (Antigravity)
 * @created 2026-02-15
 */
import { createAdminClient } from '@/lib/supabase/server'
import CouponsManager from '@/components/admin/coupons-manager'
import type { Coupon } from '@/types'

async function getCoupons(): Promise<Coupon[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false })
  return data ?? []
}

export default async function AdminCouponsPage() {
  const coupons = await getCoupons()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-serif font-bold text-foreground">الكوبونات</h1>
      <CouponsManager initialCoupons={coupons} />
    </div>
  )
}
