/**
 * Navbar Component
 * @phase Phase 4: Public Pages
 * @author Agent (Antigravity)
 * @created 2026-02-15
 */
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const links = [
  { name: 'الرئيسية', href: '/' },
  { name: 'المتجر', href: '/shop' },
  { name: 'احجزي جلسة', href: '/book' },
  { name: 'المدونة', href: '/blog' },
  { name: 'من أنا', href: '/about' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<{ email?: string } | null>(null)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setUser(s?.user ?? null))
    return () => subscription.unsubscribe()
  }, [])

  const logout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-cold-black/80 backdrop-blur-xl py-4 border-b border-white/5' : 'bg-transparent py-6'}`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">

        {/* Brand */}
        <Link href="/" className="relative flex items-center gap-3 bg-white/5 border border-white/10 px-5 py-2 rounded-full overflow-hidden">
          <span className="absolute right-3 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)] animate-pulse" />
          <div className="h-6 overflow-hidden pr-5 w-[180px]">
            <div className="animate-text-slide flex flex-col">
              {['Radwa.M', 'متاحة للعمل', 'لنصنع السحر', 'رؤية استراتيجية', 'عقلية النمو', 'بناء إرث', 'Radwa.M'].map((t, i) => (
                <span key={i} className="h-6 flex items-center text-ice-white font-serif font-bold text-base whitespace-nowrap leading-none">{t}</span>
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
        <button onClick={() => setOpen(!open)} className="md:hidden text-ice-white p-2">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden bg-cold-black/95 backdrop-blur-xl border-b border-cyan-glow/20 px-6 py-8 flex flex-col gap-6 items-center">
          {links.map(l => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className={`text-xl font-medium ${pathname === l.href ? 'text-cyan-glow' : 'text-ice-white hover:text-cyan-glow'}`}>
              {l.name}
            </Link>
          ))}
          <div className="w-full h-px bg-white/10" />
          {user ? (
            <>
              <Link href="/dashboard" onClick={() => setOpen(false)} className="text-xl text-ice-white hover:text-cyan-glow">داشبورد</Link>
              <button onClick={logout} className="text-xl text-red-400">خروج</button>
            </>
          ) : (
            <Link href="/login" onClick={() => setOpen(false)} className="text-xl text-ice-white hover:text-cyan-glow">دخول</Link>
          )}
        </div>
      )}
    </header>
  )
}
