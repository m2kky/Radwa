import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { Service } from '@/types'

export default function ServiceCard({ service, index }: { service: Service; index: number }) {
  return (
    <Link href={`/services/${service.slug}`} className="group block">
      <article className="grid gap-5 border-t border-border py-8 md:grid-cols-[120px_minmax(0,1fr)_auto] md:items-center">
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-zinc-900 md:aspect-square">
          {service.thumbnail_url ? (
            <Image
              src={service.thumbnail_url}
              alt={service.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              {String(index + 1).padStart(2, '0')}
            </div>
          )}
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            {String(index + 1).padStart(2, '0')}
          </p>
          <h2 className="text-2xl font-serif font-bold text-foreground transition-colors group-hover:text-primary md:text-3xl">
            {service.title}
          </h2>
          {service.excerpt ? (
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
              {service.excerpt}
            </p>
          ) : null}
        </div>

        <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
          التفاصيل
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
        </span>
      </article>
    </Link>
  )
}
