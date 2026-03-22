/**
 * Logout API Route
 *
 * Signs out the current user and redirects to home.
 *
 * @endpoint POST /api/auth/logout
 * @auth Required
 * @phase Phase 3: Auth
 * @author Agent (Antigravity)
 * @created 2026-02-15
 */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_APP_URL!))
}
