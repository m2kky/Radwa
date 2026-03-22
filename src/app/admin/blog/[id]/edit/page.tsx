/**
 * Admin Edit Blog Post Page
 *
 * @phase Phase 2: Blog Admin
 * @author Agent (Antigravity)
 * @created 2026-02-15
 */
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import BlogForm from '@/components/admin/blog-form'

interface Props { params: Promise<{ id: string }> }

export const metadata = { title: 'تعديل المقال' }

export default async function EditBlogPage({ params }: Props) {
  const { id } = await params
  const admin = createAdminClient()
  const { data: post } = await admin.from('blog_posts').select('*').eq('id', id).single()

  if (!post) notFound()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">تعديل: {post.title}</h1>
      <BlogForm id={id} defaultValues={{
        slug:          post.slug,
        title:         post.title,
        excerpt:       post.excerpt ?? '',
        content:       post.content ?? '',
        thumbnail_url: post.thumbnail_url ?? '',
        category:      post.category ?? '',
        is_featured:   post.is_featured ?? false,
        status:        post.status,
      }} />
    </div>
  )
}
