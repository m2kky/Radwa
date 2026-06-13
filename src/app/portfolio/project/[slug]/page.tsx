import { createClient } from '@/lib/supabase/server'
import PortfolioDetail from '@/components/portfolio/portfolio-detail'
import { notFound } from 'next/navigation'

export const revalidate = 60

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('portfolio_items').select('title, description').eq('slug', slug).single()
  
  return {
    title: data ? `${data.title} | مشروع` : 'مشروع',
    description: data?.description,
  }
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: item } = await supabase
    .from('portfolio_items')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (!item || item.item_type !== 'project') return notFound()

  return <PortfolioDetail item={item} />
}
