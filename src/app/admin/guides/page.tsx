import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/server'
import GuidesManager from '@/components/admin/guides-manager'
import type { Guide } from '@/types'

async function getGuides(): Promise<Guide[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('guides')
    .select('*')
    .order('created_at', { ascending: false })
  return (data ?? []) as Guide[]
}

export default async function AdminGuidesPage() {
  const guides = await getGuides()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">Guides & Templates</h1>
          <p className="mt-1 text-sm text-muted-foreground">إدارة الموارد المجانية القابلة للتحميل.</p>
        </div>
        <Link href="/admin/guides/new" className="inline-flex items-center gap-2 rounded-lg bg-cyan-glow px-4 py-2 text-sm font-semibold text-cold-black hover:bg-cyan-glow/90">
          <Plus size={16} />
          مورد جديد
        </Link>
      </div>

      <GuidesManager initialGuides={guides} />
    </div>
  )
}
