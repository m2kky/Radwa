/**
 * Admin Sidebar Component
 *
 * Navigation sidebar for the admin panel.
 *
 * @phase Phase 5: Admin
 * @author Agent (Antigravity)
 * @created 2026-02-15
 */
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Tag,
  FileText,
  ShieldCheck,
  LogOut,
  Clock,
  SlidersHorizontal,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navItems = [
  { href: '/admin', label: 'الداشبورد', icon: LayoutDashboard },
  { href: '/admin/products', label: 'المنتجات', icon: Package },
  { href: '/admin/orders', label: 'الطلبات', icon: ShoppingBag },
  { href: '/admin/kyc', label: 'طلبات KYC', icon: ShieldCheck },
  { href: '/admin/coupons', label: 'الكوبونات', icon: Tag },
  { href: '/admin/blog', label: 'المدونة', icon: FileText },
  { href: '/admin/event-types', label: 'أنواع الجلسات', icon: Tag },
  { href: '/admin/availability', label: 'مواعيد التوفر', icon: Clock },
  { href: '/admin/bookings', label: 'الحجوزات', icon: ShoppingBag },
  { href: '/admin/booking-profile', label: 'بروفايل الحجز', icon: FileText },
  { href: '/admin/popup', label: 'Popup الزوار', icon: SlidersHorizontal },
  { href: '/admin/content', label: 'محتوى الموقع', icon: SlidersHorizontal },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const logout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <aside className="w-56 min-h-screen bg-cold-dark border-l border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <span className="font-serif font-bold text-cyan-glow text-lg">Admin</span>
        <p className="text-xs text-muted-foreground mt-1">Radwa.M</p>
      </div>

      <nav className="flex-1 p-4 flex flex-col gap-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          // Exact match for /admin, prefix match for others
          const isActive = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-cyan-glow/10 text-cyan-glow font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut size={16} />
          خروج
        </button>
      </div>
    </aside>
  )
}
