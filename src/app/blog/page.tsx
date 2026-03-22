/**
 * Blog Listing Page
 * @phase Phase 4: Public Pages
 * @author Agent (Antigravity)
 * @created 2026-02-15
 */
import { createAdminClient } from '@/lib/supabase/server'
import BlogCard from '@/components/blog/blog-card'

export const metadata = { title: 'المدونة' }

export default async function BlogPage() {
  const admin = createAdminClient()

  interface Post {
    id: string
    slug: string
    title: string
    excerpt: string | null
    thumbnail_url: string | null
    featured_image_url: string | null
    category: string | null
    published_at: string
    is_featured?: boolean
  }

  const { data: posts } = await admin
    .from('blog_posts')
    .select('id, slug, title, excerpt, thumbnail_url, featured_image_url, category, published_at, is_featured')
    .eq('status', 'published')
    .order('published_at', { ascending: false }) as { data: Post[] | null }

  const normalizedPosts =
    posts?.map((post) => ({
      ...post,
      thumbnail_url: post.thumbnail_url ?? post.featured_image_url,
      published_at: post.published_at ?? new Date().toISOString(),
    })) ?? []

  const featured = normalizedPosts.find((p: Post) => p.is_featured) ?? normalizedPosts[0]
  const rest = normalizedPosts.filter((p: Post) => p.id !== featured?.id)

  return (
    <main className="min-h-screen pt-32 pb-20 px-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-16">
          <p className="text-xs font-bold tracking-widest text-cyan-glow uppercase mb-3">المدونة</p>
          <h1 className="text-5xl md:text-6xl font-serif font-bold text-ice-white">
            رؤى <span className="text-cyan-glow">استراتيجية</span>
          </h1>
        </div>

        {/* Featured */}
        {featured && (
          <div className="mb-16">
            <BlogCard post={featured} />
          </div>
        )}

        {/* Grid */}
        {rest.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rest.map(post => <BlogCard key={post.id} post={post} />)}
          </div>
        )}

        {!normalizedPosts.length && (
          <p className="text-center text-muted-foreground py-20">لا توجد مقالات بعد.</p>
        )}
      </div>
    </main>
  )
}
