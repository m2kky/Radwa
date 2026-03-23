/**
 * Navbar Component
 * @phase Phase 4: Public Pages
 * @author Agent (Antigravity)
 * @created 2026-02-15
 */
'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import type { SiteGeneralSettings } from '@/lib/site-content'

export default function Navbar({ settings }: { settings: SiteGeneralSettings }) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<{ email?: string } | null>(null)
  const [menuTop, setMenuTop] = useState(92)
  const headerRef = useRef<HTMLElement | null>(null)
  const pathname = usePathname()
  const router = useRouter()
  const links = [
    { name: 'الرئيسية', href: '/' },
    { name: 'المتجر', href: '/shop' },
    { name: settings.booking_cta_label || 'احجزي جلسة', href: settings.booking_cta_href || '/book' },
    { name: 'المدونة', href: '/blog' },
    { name: 'من أنا', href: '/about' },
  ]
  const tickerTexts = [
    settings.brand_name,
    'متاحة للاستشارات',
    settings.display_name,
    'رؤية استراتيجية',
    'بناء نمو',
    settings.brand_name,
  ]

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  useEffect(() => {
    const measure = () => {
      const height = headerRef.current?.getBoundingClientRect().height
      if (!height) return
      setMenuTop(Math.ceil(height) + 8)
    }

    measure()

    const observer =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => measure())
        : null

    if (observer && headerRef.current) {
      observer.observe(headerRef.current)
    }

    window.addEventListener('resize', measure)
    return () => {
      window.removeEventListener('resize', measure)
      observer?.disconnect()
    }
  }, [scrolled])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setUser(s?.user ?? null))
    return () => subscription.unsubscribe()
  }, [])

  const logout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setOpen(false)
    router.push('/')
    router.refresh()
  }

  return (
    <header ref={headerRef} className={`sticky top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-cold-black/90 backdrop-blur-2xl py-3 border-b border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.35)]' : 'bg-cold-black/70 backdrop-blur-xl py-4 border-b border-white/5'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-3">

        {/* Brand */}
        <Link href="/" className="relative flex items-center gap-2 bg-white/5 border border-white/10 px-3 sm:px-5 py-2 rounded-full overflow-hidden">
          <span className="absolute right-3 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)] animate-pulse" />
          <div className="h-6 overflow-hidden pr-5 w-[140px] sm:w-[180px]">
            <div className="animate-text-slide flex flex-col">
              {tickerTexts.map((t, i) => (
                <span key={i} className="h-6 flex items-center text-ice-white font-serif font-bold text-sm sm:text-base whitespace-nowrap leading-none">{t}</span>
              ))}
            </div>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {links.map(l => (
            <Link key={l.href} href={l.href} className={`text-sm font-medium transition-colors ${pathname === l.href ? 'text-cyan-glow' : 'text-ice-white/70 hover:text-cyan-glow'}`}>
              {l.name}
            </Link>
          ))}
          {user ? (
            <>
              <Link href="/dashboard" className="text-sm text-ice-white/70 hover:text-cyan-glow">داشبورد</Link>
              <button onClick={logout} className="text-sm text-red-400 hover:text-red-300">خروج</button>
            </>
          ) : (
            <Link href="/login" className="text-sm text-ice-white/70 hover:text-cyan-glow">دخول</Link>
          )}
        </nav>

        {/* Mobile Toggle */}
        <button
          onClick={() => setOpen((prev) => !prev)}
          className="md:hidden text-ice-white p-2.5 rounded-xl border border-white/15 bg-cold-black/40 backdrop-blur"
          aria-label={open ? 'إغلاق القائمة' : 'فتح القائمة'}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.button
              key="mobile-menu-backdrop"
              type="button"
              aria-label="إغلاق القائمة"
              className="fixed inset-0 z-40 md:hidden bg-cold-black/65 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
            />

            <motion.div
              key="mobile-menu-panel"
              className="fixed left-1/2 z-50 md:hidden w-[min(92vw,420px)] -translate-x-1/2 rounded-3xl border border-cyan-glow/20 bg-cold-black/95 backdrop-blur-2xl shadow-2xl p-4"
              style={{ top: menuTop, maxHeight: `calc(100dvh - ${menuTop + 12}px)`, overflowY: 'auto' }}
              initial={{ opacity: 0, y: -14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              <div className="flex flex-col gap-2">
                {links.map((l, index) => (
                  <motion.div
                    key={l.href}
                    className="w-full"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: index * 0.04, duration: 0.2 }}
                  >
                    <Link
                      href={l.href}
                      onClick={() => setOpen(false)}
                      className={`block w-full text-center text-base font-semibold py-3 rounded-xl border transition-colors ${
                        pathname === l.href
                          ? 'text-cyan-glow border-cyan-glow/40 bg-cyan-glow/10'
                          : 'text-ice-white border-white/10 bg-white/5 hover:text-cyan-glow hover:border-cyan-glow/40'
                      }`}
                    >
                      {l.name}
                    </Link>
                  </motion.div>
                ))}
              </div>

              <div className="w-full h-px bg-white/10 my-4" />

              <div className="flex flex-col gap-2">
                {user ? (
                  <>
                    <Link
                      href="/dashboard"
                      onClick={() => setOpen(false)}
                      className="block w-full text-center text-sm font-medium py-3 rounded-xl border border-white/10 bg-white/5 text-ice-white hover:text-cyan-glow hover:border-cyan-glow/40"
                    >
                      داشبورد
                    </Link>
                    <button onClick={logout} className="w-full text-center text-sm font-medium py-3 rounded-xl border border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20">
                      خروج
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="block w-full text-center text-sm font-medium py-3 rounded-xl border border-white/10 bg-white/5 text-ice-white hover:text-cyan-glow hover:border-cyan-glow/40"
                  >
                    دخول
                  </Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  )
}
