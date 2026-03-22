/**
 * Blog Card Component
 * @phase Phase 4: Public Pages
 * @author Agent (Antigravity)
 * @created 2026-02-15
 */
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft } from 'lucide-react'

export interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string | null
  thumbnail_url: string | null
  category: string | null
  published_at: string
}

export default function BlogCard({ post }: { post: BlogPost }) {
  const imageSrc =
    post.thumbnail_url &&
    (post.thumbnail_url.startsWith('http://') ||
      post.thumbnail_url.startsWith('https://') ||
      post.thumbnail_url.startsWith('/'))
      ? post.thumbnail_url
      : null

  return (
    <Link href={`/blog/${post.slug}`} className="group bg-card border border-white/10 rounded-2xl overflow-hidden hover:border-cyan-glow/30 hover:-translate-y-1 transition-all duration-300 flex flex-col">
      <div className="relative h-48 bg-cold-dark">
        {imageSrc && (
          <Image src={imageSrc} alt={post.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
        )}
      </div>
      <div className="p-5 flex flex-col flex-1">
        {post.category && (
          <span className="text-xs font-bold text-cyan-glow uppercase tracking-wider mb-2">{post.category}</span>
        )}
        <h3 className="font-serif font-bold text-ice-white mb-2 group-hover:text-cyan-glow transition-colors line-clamp-2">{post.title}</h3>
        {post.excerpt && <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{post.excerpt}</p>}
        <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
          <span>{new Date(post.published_at).toLocaleDateString('ar-EG')}</span>
          <ArrowLeft size={14} className="text-cyan-glow opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </Link>
  )
}
