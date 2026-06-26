import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Calendar, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import ServiceLeadForm from '@/components/services/service-lead-form'
import type { Service } from '@/types'

interface Props {
  params: Promise<{ slug: string }>
}

function isExternalHref(value: string): boolean {
  return value.startsWith('http://') || value.startsWith('https://')
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('services')
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

export default async function ServiceDetailPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('services')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()

  if (!data) notFound()
  const service = data as Service
  const ctaHref = service.cta_type === 'book'
    ? service.cta_url || '/book'
    : service.cta_url || '/services'

  return (
    <main className="min-h-screen bg-background pt-28">
      <div className="container mx-auto px-4 py-10 md:py-16">
        <Link href="/services" className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80">
          <ArrowLeft size={16} />
          العودة إلى الخدمات
        </Link>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-14">
          <article className="min-w-0">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              Service
            </p>
            <h1 className="max-w-4xl text-4xl font-serif font-bold leading-tight text-foreground md:text-6xl">
              {service.title}
            </h1>
            {service.excerpt ? (
              <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">
                {service.excerpt}
              </p>
            ) : null}

            <div className="article-content mt-10" dangerouslySetInnerHTML={{ __html: service.content_body || '' }} />
            <style dangerouslySetInnerHTML={{ __html: `
              .article-content h2, .article-content h3 { color: var(--foreground); font-family: serif; font-size: 1.8rem; margin-top: 2rem; margin-bottom: 1rem; }
              .article-content p { color: var(--muted-foreground); line-height: 1.9; margin-bottom: 1.35rem; }
              .article-content ul, .article-content ol { color: var(--muted-foreground); padding-inline-start: 1.5rem; margin-bottom: 1.25rem; }
              .article-content li { margin-bottom: 0.5rem; }
              .article-content strong { color: var(--primary); }
              .article-content img { border-radius: 1rem; max-height: 520px; object-fit: cover; margin: 1.5rem 0; }
            ` }} />
          </article>

          <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="relative aspect-[4/3] bg-zinc-900">
                {service.thumbnail_url ? (
                  <Image src={service.thumbnail_url} alt={service.title} fill className="object-cover" priority />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    Service
                  </div>
                )}
              </div>
              {service.cta_type !== 'form' ? (
                <div className="p-5">
                  <a
                    href={ctaHref}
                    target={isExternalHref(ctaHref) ? '_blank' : undefined}
                    rel={isExternalHref(ctaHref) ? 'noreferrer' : undefined}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    {service.cta_label || 'ابدأ الآن'}
                    {service.cta_type === 'book' ? <Calendar size={16} /> : <ExternalLink size={16} />}
                  </a>
                </div>
              ) : null}
            </div>

            {service.cta_type === 'form' ? (
              <ServiceLeadForm slug={service.slug} serviceTitle={service.title} />
            ) : null}
          </aside>
        </div>
      </div>
    </main>
  )
}
