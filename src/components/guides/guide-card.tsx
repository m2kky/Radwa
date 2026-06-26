import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Download } from 'lucide-react'
import type { Guide } from '@/types'

export default function GuideCard({ guide }: { guide: Guide }) {
  return (
    <Link href={`/guides/${guide.slug}`} className="group block h-full">
      <article className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary/40">
        <div className="relative aspect-[4/3] overflow-hidden bg-zinc-900">
          {guide.thumbnail_url ? (
            <Image
              src={guide.thumbnail_url}
              alt={guide.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Guide
            </div>
          )}
          {guide.category ? (
            <span className="absolute right-3 top-3 rounded-full border border-white/15 bg-black/50 px-3 py-1 text-xs text-white backdrop-blur">
              {guide.category}
            </span>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col p-4">
          <h3 className="line-clamp-2 text-base font-semibold text-foreground transition-colors group-hover:text-primary">
            {guide.title}
          </h3>
          {guide.excerpt ? (
            <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
              {guide.excerpt}
            </p>
          ) : null}

          <div className="mt-auto flex items-center justify-between gap-3 pt-5">
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Download size={14} />
              {guide.download_count.toLocaleString('ar-EG')}
            </span>
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
              التفاصيل
              <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-1" />
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}
