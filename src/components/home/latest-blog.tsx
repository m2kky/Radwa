/**
 * Latest Blog Section
 * @phase Phase 4: Public Pages
 * @author Agent (Antigravity)
 * @created 2026-02-15
 */
import Link from 'next/link'
import BlogCard from '@/components/blog/blog-card'

interface Post {
  id: string
  slug: string
  title: string
  excerpt: string | null
  thumbnail_url: string | null
  category: string | null
  published_at: string
}

export default function LatestBlog({ posts }: { posts: Post[] }) {
  if (!posts.length) return null

  return (
    <section className="py-24 bg-cold-dark/30">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-xs font-bold tracking-widest text-cyan-glow uppercase mb-2">المدونة</p>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-ice-white">آخر المقالات</h2>
          </div>
          <Link href="/blog" className="text-sm text-cyan-glow hover:underline">عرض الكل</Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {posts.map(post => <BlogCard key={post.id} post={post} />)}
        </div>
      </div>
    </section>
  )
}
