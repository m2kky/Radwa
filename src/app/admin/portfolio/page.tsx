import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'
import { Plus } from 'lucide-react'
import PortfolioManager from '@/components/admin/portfolio-manager'

async function getPortfolioItems() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('portfolio_items')
    .select('*')
    .order('created_at', { ascending: false })
  return data ?? []
}

export default async function AdminPortfolioPage() {
  const items = await getPortfolioItems()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">بورتفوليو & دراسات الحالة</h1>
          <p className="text-muted-foreground text-sm mt-1">إدارة المشاريع السابقة ودراسات الحالة للعملاء.</p>
        </div>
        <Link
          href="/admin/portfolio/new"
          className="flex items-center gap-2 bg-cyan-glow text-cold-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-cyan-glow/90 transition-colors"
        >
          <Plus size={16} />
          عمل جديد
        </Link>
      </div>

      <PortfolioManager initialItems={items} />
    </div>
  )
}
