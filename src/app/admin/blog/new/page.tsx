/**
 * Admin New Blog Post Page
 *
 * @phase Phase 2: Blog Admin
 * @author Agent (Antigravity)
 * @created 2026-02-15
 */
import BlogForm from '@/components/admin/blog-form'

export const metadata = { title: 'مقال جديد' }

export default function NewBlogPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">مقال جديد</h1>
      <BlogForm />
    </div>
  )
}
