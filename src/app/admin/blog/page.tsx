/**
 * Admin Blog List Page
 *
 * @phase Phase 2: Blog Admin
 * @author Agent (Antigravity)
 * @created 2026-02-15
 */
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'

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

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border">
            <tr className="text-muted-foreground text-xs uppercase tracking-wider">
              <th className="text-right px-4 py-3">العنوان</th>
              <th className="text-right px-4 py-3">التصنيف</th>
              <th className="text-right px-4 py-3">الحالة</th>
              <th className="text-right px-4 py-3">تاريخ النشر</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {posts?.map(post => (
              <tr key={post.id} className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3 font-medium">
                  {post.title}
                  {post.is_featured && <span className="mr-2 text-xs text-primary">★ مميز</span>}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{post.category ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${post.status === 'published' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                    {post.status === 'published' ? 'منشور' : 'مسودة'}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">
                  {post.published_at ? new Date(post.published_at).toLocaleDateString('ar-EG') : '—'}
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/blog/${post.id}/edit`}
                    className="text-xs text-cyan-glow hover:underline">
                    تعديل
                  </Link>
                </td>
              </tr>
            ))}
            {!posts?.length && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">لا توجد مقالات بعد</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
