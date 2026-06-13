import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Tag } from 'lucide-react'
import type { PortfolioItem } from '@/types'

export default function PortfolioDetail({ item }: { item: PortfolioItem }) {
  if (!item) return notFound()

  return (
    <main className="min-h-screen bg-cold-black text-ice-white pt-28 pb-24">
      {/* Top Banner with Background */}
      <div className="relative w-full h-[50vh] min-h-[400px] border-b border-white/10">
        {item.thumbnail_url ? (
          <>
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${item.thumbnail_url})` }} />
            <div className="absolute inset-0 bg-gradient-to-t from-cold-black via-cold-black/60 to-cold-black/30 backdrop-blur-[2px]" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/30 to-cold-black" />
        )}
        
        <div className="absolute inset-0 flex flex-col justify-end pb-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 w-full">
            <Link href="/portfolio" className="inline-flex items-center gap-2 text-cyan-300 hover:text-cyan-400 font-medium mb-8 transition-colors">
              <ArrowLeft size={18} />
              العودة للمعرض
            </Link>

            <div className="flex flex-wrap gap-3 mb-6">
              <span className="px-3 py-1 text-sm font-semibold rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 backdrop-blur-md">
                {item.item_type === 'case_study' ? 'دراسة حالة' : 'مشروع'}
              </span>
              <span className="px-3 py-1 text-sm rounded-full bg-white/5 text-ice-white/80 border border-white/10 backdrop-blur-md">
                {item.category}
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-ice-white leading-tight mb-4">
              {item.title}
            </h1>
            
            <p className="text-xl text-ice-white/70 max-w-3xl">
              {item.description}
            </p>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-12 grid grid-cols-1 md:grid-cols-4 gap-12">
        
        {/* Sidebar Meta Info */}
        <div className="md:col-span-1 space-y-8">
          {item.client_name && (
            <div>
              <h4 className="text-ice-white/50 text-sm font-medium mb-2">
                العميل
              </h4>
              <p className="font-medium">{item.client_name}</p>
            </div>
          )}
          
          {item.role && (
            <div>
              <h4 className="text-ice-white/50 text-sm font-medium mb-2 flex items-center gap-2">
                <Tag size={16} /> الدور
              </h4>
              <p className="font-medium">{item.role}</p>
            </div>
          )}

          {item.year && (
            <div>
              <h4 className="text-ice-white/50 text-sm font-medium mb-2">
                السنة
              </h4>
              <p className="font-medium font-mono">{item.year}</p>
            </div>
          )}

          {item.tags && item.tags.length > 0 && (
            <div>
              <h4 className="text-ice-white/50 text-sm font-medium mb-3">الوسوم</h4>
              <div className="flex flex-wrap gap-2">
                {item.tags.map(tag => (
                  <span key={tag} className="text-xs text-ice-white/70 border border-white/10 bg-white/5 px-2.5 py-1.5 rounded-md">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main Body */}
        <div className="md:col-span-3 prose prose-invert prose-lg prose-cyan max-w-none">
          {/* Custom Rich Text Rendering */}
          <div className="article-content" dangerouslySetInnerHTML={{ __html: item.content_body || '' }} />
          
          {/* Custom Styles for the rich text editor output */}
          <style dangerouslySetInnerHTML={{__html: `
            .article-content h3 { color: #fff; font-family: serif; font-size: 1.8rem; margin-top: 2rem; margin-bottom: 1rem; }
            .article-content p { color: rgba(255,255,255,0.8); line-height: 1.8; margin-bottom: 1.5rem; }
            .article-content ul { list-style-type: disc; padding-inline-start: 1.5rem; color: rgba(255,255,255,0.8); }
            .article-content li { margin-bottom: 0.5rem; }
            .article-content strong { color: #22d3ee; }
          `}} />
        </div>
      </div>
    </main>
  )
}
