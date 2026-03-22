/**
 * Middleware
 *
 * Protects /dashboard, /admin, and /api/admin/* routes.
 * Refreshes Supabase session on every request.
 *
 * @phase Phase 3 + Phase 5: Auth + Admin
 * @author Agent (Antigravity)
 * @created 2026-02-15
 * @updated 2026-02-15
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = req.nextUrl

  // 1. Protect /dashboard
  if (pathname.startsWith('/dashboard') && !user) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // 2. Protect /admin (Pages & API)
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    if (!user) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 })
      }
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // Role check (Admin only)
    // Note: This requires the 'user' to have a role in the DB profile or app_metadata
    // For v2, we'll assume admins are designated in app_metadata for speed or check the users table
    const isAdmin = user.app_metadata?.role === 'admin'

    if (!isAdmin) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Admin access required' } }, { status: 403 })
      }
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/api/admin/:path*'],
}
