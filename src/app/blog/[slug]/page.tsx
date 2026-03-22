/**
 * Blog Post Page
 * @phase Phase 4: Public Pages
 * @author Agent (Antigravity)
 * @created 2026-02-15
 */
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const admin = createAdminClient()
  const { data } = await admin.from('blog_posts').select('title, excerpt').eq('slug', slug).single()
  return { title: data?.title, description: data?.excerpt ?? undefined }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const admin = createAdminClient()

  const { data: post } = await admin
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!post) notFound()

  return (
    <main className="min-h-screen pt-32 pb-20">
      <article className="max-w-3xl mx-auto px-6">

        {/* Meta */}
        <div className="mb-8">
          <Link href="/blog" className="text-xs text-cyan-glow hover:underline mb-4 inline-block">← المدونة</Link>
          {post.category && <span className="block text-xs font-bold text-cyan-glow uppercase tracking-wider mb-3">{post.category}</span>}
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-ice-white leading-tight mb-4">{post.title}</h1>
          <p className="text-sm text-muted-foreground">{new Date(post.published_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        {/* Thumbnail */}
        {post.thumbnail_url && (
          <div className="relative h-72 md:h-96 rounded-2xl overflow-hidden mb-10 border border-white/10">
            <Image src={post.thumbnail_url} alt={post.title} fill className="object-cover" />
          </div>
        )}

        {/* Content */}
        <div
          className="prose prose-invert prose-lg max-w-none prose-headings:font-serif prose-headings:text-ice-white prose-p:text-ice-white/80 prose-a:text-cyan-glow"
          dangerouslySetInnerHTML={{ __html: post.content ?? '' }}
        />
      </article>
    </main>
  )
}
