'use client'

import Image from 'next/image'
import Link from 'next/link'
import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { CheckCircle2, Loader2, X } from 'lucide-react'
import { normalizePopupActions, normalizePopupVariant, type PopupAction, type PopupVariant } from '@/lib/popup'
import { cn } from '@/lib/utils'

interface PopupPayload {
  id: string
  title: string
  message: string
  image_url: string | null
  variant: PopupVariant
  discount_code: string | null
  discount_note: string | null
  actions: PopupAction[]
  collect_name: boolean
  collect_email: boolean
  collect_phone: boolean
  lead_title: string | null
  lead_submit_text: string | null
  lead_success_message: string | null
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

function actionClass(style: PopupAction['style']): string {
  if (style === 'secondary') {
    return 'border border-border text-foreground hover:bg-white/5'
  }
  if (style === 'ghost') {
    return 'border border-transparent text-muted-foreground hover:text-foreground hover:bg-white/5'
  }
  return 'bg-cyan-glow text-cold-black hover:bg-cyan-glow/90'
}

function popupVariantClass(variant: PopupVariant): string {
  if (variant === 'minimal') {
    return 'bg-cold-dark border-border'
  }
  if (variant === 'split') {
    return 'bg-gradient-to-br from-cold-black to-cyan-glow/10 border-cyan-glow/30'
  }
  return 'bg-gradient-to-br from-cold-dark to-cyan-glow/20 border-cyan-glow/30'
}

async function copyText(value: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value)
      return true
    }
  } catch {
    // continue to fallback
  }

  try {
    const el = document.createElement('textarea')
    el.value = value
    el.setAttribute('readonly', 'true')
    el.style.position = 'absolute'
    el.style.left = '-9999px'
    document.body.appendChild(el)
    el.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(el)
    return ok
  } catch {
    return false
  }
}

export default function SitePopup() {
  const pathname = usePathname()
  const [popup, setPopup] = useState<PopupPayload | null>(null)
  const [open, setOpen] = useState(false)
  const [copyStatus, setCopyStatus] = useState<string | null>(null)
  const [leadName, setLeadName] = useState('')
  const [leadEmail, setLeadEmail] = useState('')
  const [leadPhone, setLeadPhone] = useState('')
  const [leadError, setLeadError] = useState<string | null>(null)
  const [leadSuccess, setLeadSuccess] = useState<string | null>(null)
  const [submittingLead, setSubmittingLead] = useState(false)

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

        const incoming = json.data as Record<string, unknown>
        const mappedPopup: PopupPayload = {
          id: typeof incoming.id === 'string' ? incoming.id : '',
          title: typeof incoming.title === 'string' ? incoming.title : '',
          message: typeof incoming.message === 'string' ? incoming.message : '',
          image_url: typeof incoming.image_url === 'string' ? incoming.image_url : null,
          variant: normalizePopupVariant(incoming.variant),
          discount_code: typeof incoming.discount_code === 'string' ? incoming.discount_code : null,
          discount_note: typeof incoming.discount_note === 'string' ? incoming.discount_note : null,
          actions: normalizePopupActions(incoming.actions),
          collect_name: Boolean(incoming.collect_name),
          collect_email: Boolean(incoming.collect_email),
          collect_phone: Boolean(incoming.collect_phone),
          lead_title: typeof incoming.lead_title === 'string' ? incoming.lead_title : null,
          lead_submit_text: typeof incoming.lead_submit_text === 'string' ? incoming.lead_submit_text : null,
          lead_success_message: typeof incoming.lead_success_message === 'string' ? incoming.lead_success_message : null,
          show_once: incoming.show_once !== false,
          updated_at: typeof incoming.updated_at === 'string' ? incoming.updated_at : new Date().toISOString(),
        }

        if (!mappedPopup.id || !mappedPopup.title || !mappedPopup.message) return

        const key = `site-popup-dismissed:${mappedPopup.id}:${mappedPopup.updated_at}`
        const wasDismissed = mappedPopup.show_once && typeof window !== 'undefined'
          ? localStorage.getItem(key) === '1'
          : false

        if (wasDismissed) return

        setLeadName('')
        setLeadEmail('')
        setLeadPhone('')
        setLeadError(null)
        setLeadSuccess(null)
        setPopup(mappedPopup)
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

  useEffect(() => {
    if (!copyStatus) return
    const timeout = window.setTimeout(() => setCopyStatus(null), 1800)
    return () => window.clearTimeout(timeout)
  }, [copyStatus])

  const handleCopy = async (value: string) => {
    const ok = await copyText(value)
    setCopyStatus(ok ? 'تم النسخ' : 'فشل النسخ')
  }

  const handleAction = async (action: PopupAction) => {
    if (!popup) return

    if (action.action === 'close') {
      close()
      return
    }

    if (action.action === 'copy_code') {
      const value = action.copy_text ?? popup.discount_code ?? ''
      if (!value) {
        setCopyStatus('مفيش كود للنسخ')
        return
      }
      await handleCopy(value)
    }
  }

  const shouldCollectLead = Boolean(popup?.collect_name || popup?.collect_email || popup?.collect_phone)

  const submitLead = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!popup) return

    setLeadError(null)
    setLeadSuccess(null)

    const name = leadName.trim()
    const email = leadEmail.trim().toLowerCase()
    const phone = leadPhone.trim()

    if (popup.collect_name && !name) {
      setLeadError('الاسم مطلوب')
      return
    }
    if (popup.collect_email && !email) {
      setLeadError('الإيميل مطلوب')
      return
    }
    if (popup.collect_phone && !phone) {
      setLeadError('رقم الموبايل مطلوب')
      return
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setLeadError('الإيميل غير صحيح')
      return
    }
    if (phone && !/^[0-9+\-\s()]{7,20}$/.test(phone)) {
      setLeadError('رقم الموبايل غير صحيح')
      return
    }

    setSubmittingLead(true)
    try {
      const res = await fetch('/api/popup/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          popup_id: popup.id,
          name: name || null,
          email: email || null,
          phone: phone || null,
          source_path: pathname || null,
        }),
      })

      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error?.message ?? 'تعذر حفظ البيانات')

      setLeadSuccess(
        typeof json?.data?.message === 'string' && json.data.message.trim().length > 0
          ? json.data.message
          : (popup.lead_success_message || 'تم حفظ بياناتك بنجاح')
      )
      setLeadName('')
      setLeadEmail('')
      setLeadPhone('')
    } catch (error) {
      setLeadError(error instanceof Error ? error.message : 'تعذر حفظ البيانات')
    } finally {
      setSubmittingLead(false)
    }
  }

  if (!popup || !open || shouldSkip(pathname)) return null

  const hasSplitLayout = popup.variant === 'split' && popup.image_url

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div
        className={cn(
          'relative w-full max-w-2xl border rounded-2xl p-5 md:p-6 shadow-2xl',
          popupVariantClass(popup.variant),
          hasSplitLayout ? 'md:grid md:grid-cols-[220px_1fr] md:gap-5 md:items-stretch' : ''
        )}
      >
        <button
          type="button"
          onClick={close}
          className="absolute left-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="إغلاق"
        >
          <X size={18} />
        </button>

        {popup.image_url ? (
          <div
            className={cn(
              'relative rounded-xl overflow-hidden border border-border mb-4',
              hasSplitLayout ? 'mb-0 min-h-[180px]' : 'w-full h-44'
            )}
          >
            <Image src={popup.image_url} alt={popup.title} fill className="object-cover" />
          </div>
        ) : null}

        <div className={hasSplitLayout ? 'flex flex-col justify-center' : ''}>
          <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2">{popup.title}</h3>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {popup.message}
          </p>

          {popup.discount_code && (
            <div className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3">
              <p className="text-[11px] text-emerald-200 mb-2">{popup.discount_note || 'كود خصم حصري'}</p>
              <div className="flex items-center justify-between gap-2">
                <code className="text-emerald-100 text-base md:text-lg font-bold tracking-wider" dir="ltr">
                  {popup.discount_code}
                </code>
                <button
                  type="button"
                  onClick={() => handleCopy(popup.discount_code!)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-emerald-300/40 text-emerald-100 text-xs hover:bg-emerald-500/15"
                >
                  نسخ الكود
                </button>
              </div>
            </div>
          )}

          {copyStatus && (
            <p className="mt-2 text-xs text-cyan-glow inline-flex items-center gap-1">
              <CheckCircle2 size={12} />
              {copyStatus}
            </p>
          )}

          {shouldCollectLead && (
            <form onSubmit={submitLead} className="mt-4 space-y-2 rounded-xl border border-border bg-cold-black/45 p-3">
              <p className="text-xs text-foreground">{popup.lead_title || 'اكتب بياناتك ونبعتلك التفاصيل'}</p>
              {popup.collect_name ? (
                <input
                  className="w-full bg-cold-black border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cyan-glow/50"
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                  placeholder="الاسم"
                />
              ) : null}
              {popup.collect_email ? (
                <input
                  className="w-full bg-cold-black border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cyan-glow/50"
                  value={leadEmail}
                  onChange={(e) => setLeadEmail(e.target.value)}
                  placeholder="name@email.com"
                  dir="ltr"
                />
              ) : null}
              {popup.collect_phone ? (
                <input
                  className="w-full bg-cold-black border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cyan-glow/50"
                  value={leadPhone}
                  onChange={(e) => setLeadPhone(e.target.value)}
                  placeholder="01xxxxxxxxx"
                  dir="ltr"
                />
              ) : null}
              {leadError ? <p className="text-[11px] text-red-400">{leadError}</p> : null}
              {leadSuccess ? <p className="text-[11px] text-emerald-300">{leadSuccess}</p> : null}
              <button
                type="submit"
                disabled={submittingLead}
                className="w-full inline-flex items-center justify-center gap-2 bg-cyan-glow text-cold-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-cyan-glow/90 disabled:opacity-60"
              >
                {submittingLead ? <Loader2 size={14} className="animate-spin" /> : null}
                {popup.lead_submit_text || 'إرسال'}
              </button>
            </form>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            {popup.actions.map((action, index) => {
              if (action.action === 'link' && action.url) {
                return (
                  <Link
                    key={`${action.id}-${index}`}
                    href={action.url}
                    target={action.new_tab ? '_blank' : undefined}
                    rel={action.new_tab ? 'noreferrer noopener' : undefined}
                    onClick={close}
                    className={cn(
                      'inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-semibold transition-colors',
                      actionClass(action.style)
                    )}
                  >
                    {action.label}
                  </Link>
                )
              }

              return (
                <button
                  key={`${action.id}-${index}`}
                  type="button"
                  onClick={() => handleAction(action)}
                  className={cn(
                    'inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-semibold transition-colors',
                    actionClass(action.style)
                  )}
                >
                  {action.label}
                </button>
              )
            })}

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
    </div>
  )
}
