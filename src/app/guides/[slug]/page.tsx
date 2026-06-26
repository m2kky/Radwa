import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Download } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import type { Guide } from '@/types'

interface Props {
  params: Promise<{ slug: string }>
}

function formatFileSize(size: number): string {
  if (!Number.isFinite(size) || size <= 0) return 'ملف مجاني'
  if (size < 1024 * 1024) return `${Math.ceil(size / 1024).toLocaleString('ar-EG')} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('guides')
    .select('title, excerpt, meta_title, meta_description, thumbnail_url')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()

  if (!data) return {}

  return {
    title: data.meta_title || data.title,
    description: data.meta_description || data.excerpt || undefined,
    openGraph: {
      title: data.meta_title || data.title,
      description: data.meta_description || data.excerpt || undefined,
      images: data.thumbnail_url ? [data.thumbnail_url] : [],
    },
  }
}

export default async function GuideDetailPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('guides')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()

  if (!data) notFound()
  const guide = data as Guide

  return (
    <main className="min-h-screen bg-background pt-28">
      <div className="container mx-auto px-4 py-10 md:py-16">
        <Link href="/guides" className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80">
          <ArrowLeft size={16} />
          العودة إلى Guides & Templates
        </Link>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-14">
          <article className="min-w-0">
            <div className="mb-7 flex flex-wrap gap-2">
              {guide.category ? (
                <span className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs text-primary">
                  {guide.category}
                </span>
              ) : null}
              {guide.tags?.slice(0, 4).map((tag) => (
                <span key={tag} className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                  {tag}
                </span>
              ))}
            </div>

            <h1 className="max-w-4xl text-4xl font-serif font-bold leading-tight text-foreground md:text-6xl">
              {guide.title}
            </h1>
            {guide.excerpt ? (
              <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">
                {guide.excerpt}
              </p>
            ) : null}

            <div className="article-content mt-10" dangerouslySetInnerHTML={{ __html: guide.content_body || '' }} />
            <style dangerouslySetInnerHTML={{ __html: `
              .article-content h2, .article-content h3 { color: var(--foreground); font-family: serif; font-size: 1.8rem; margin-top: 2rem; margin-bottom: 1rem; }
              .article-content p { color: var(--muted-foreground); line-height: 1.9; margin-bottom: 1.35rem; }
              .article-content ul, .article-content ol { color: var(--muted-foreground); padding-inline-start: 1.5rem; margin-bottom: 1.25rem; }
              .article-content li { margin-bottom: 0.5rem; }
              .article-content strong { color: var(--primary); }
              .article-content img { border-radius: 1rem; max-height: 520px; object-fit: cover; margin: 1.5rem 0; }
            ` }} />
          </article>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="relative aspect-[4/3] bg-zinc-900">
                {guide.thumbnail_url ? (
                  <Image src={guide.thumbnail_url} alt={guide.title} fill className="object-cover" priority />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    Guide
                  </div>
                )}
              </div>
              <div className="space-y-4 p-5">
                <div>
                  <p className="text-xs text-muted-foreground">الملف</p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {guide.file_name || 'تحميل مباشر'}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(guide.file_size)}</p>
                </div>
                {guide.file_storage_path ? (
                  <a
                    href={`/api/guides/${guide.slug}/download`}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    تحميل مجاني
                    <Download size={16} />
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-bold text-muted-foreground opacity-60"
                  >
                    الملف غير متاح
                  </button>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
