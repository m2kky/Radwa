/**
 * Admin Blog List Page
 *
 * @phase Phase 2: Blog Admin
 * @author Agent (Antigravity)
 * @created 2026-02-15
 */
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'
import BlogManager from '@/components/admin/blog-manager'

export const metadata = { title: 'إدارة المدونة' }

export default async function AdminBlogPage() {
  const admin = createAdminClient()
  const { data: posts } = await admin
    .from('blog_posts')
    .select('id, slug, title, category, status, is_featured, published_at')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">المدونة</h1>
        <Link href="/admin/blog/new"
          className="bg-cyan-glow text-cold-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-cyan-glow/90 transition-colors">
          + مقال جديد
        </Link>
      </div>

      <BlogManager initialPosts={posts ?? []} />
    </div>
  )
}
