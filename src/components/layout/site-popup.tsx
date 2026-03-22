'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'

interface PopupPayload {
  id: string
  title: string
  message: string
  cta_text: string | null
  cta_url: string | null
  image_url: string | null
  show_once: boolean
  updated_at: string
}

function shouldSkip(pathname: string): boolean {
  return (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/verify-otp')
  )
}

export default function SitePopup() {
  const pathname = usePathname()
  const [popup, setPopup] = useState<PopupPayload | null>(null)
  const [open, setOpen] = useState(false)

  const dismissKey = useMemo(() => {
    if (!popup) return null
    return `site-popup-dismissed:${popup.id}:${popup.updated_at}`
  }, [popup])

  useEffect(() => {
    if (shouldSkip(pathname)) return

    let cancelled = false

    const load = async () => {
      try {
        const res = await fetch('/api/popup', { cache: 'no-store' })
        const json = await res.json()
        if (!res.ok || !json?.data || cancelled) return

        const incoming = json.data as PopupPayload
        const key = `site-popup-dismissed:${incoming.id}:${incoming.updated_at}`
        const wasDismissed = incoming.show_once && typeof window !== 'undefined'
          ? localStorage.getItem(key) === '1'
          : false

        if (wasDismissed) return

        setPopup(incoming)
        setOpen(true)
      } catch {
        // Ignore popup fetch errors on visitor side.
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [pathname])

  const close = () => {
    if (popup?.show_once && dismissKey) {
      localStorage.setItem(dismissKey, '1')
    }
    setOpen(false)
  }

  if (!popup || !open || shouldSkip(pathname)) return null

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-cold-dark border border-border rounded-2xl p-6 md:p-7 shadow-2xl">
        <button
          type="button"
          onClick={close}
          className="absolute left-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="إغلاق"
        >
          <X size={18} />
        </button>

        {popup.image_url && (
          <div className="relative w-full h-44 rounded-xl overflow-hidden border border-border mb-4">
            <Image src={popup.image_url} alt={popup.title} fill className="object-cover" />
          </div>
        )}

        <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2">{popup.title}</h3>
        <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{popup.message}</p>

        <div className="mt-6 flex flex-wrap gap-2">
          {popup.cta_url && popup.cta_text ? (
            <Link
              href={popup.cta_url}
              onClick={close}
              className="inline-flex items-center justify-center bg-cyan-glow text-cold-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-cyan-glow/90"
            >
              {popup.cta_text}
            </Link>
          ) : null}
          <button
            type="button"
            onClick={close}
            className="inline-flex items-center justify-center border border-border text-muted-foreground hover:text-foreground px-4 py-2 rounded-lg text-sm"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  )
}
