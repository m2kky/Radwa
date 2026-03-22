import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const admin = createAdminClient()
    const now = new Date()

    const { data, error } = await admin
      .from('site_popups')
      .select('id, title, message, cta_text, cta_url, image_url, show_once, start_at, end_at, updated_at')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(20)

    if (error) throw error

    const active =
      (data ?? []).find((popup) => {
        const startAt = popup.start_at ? new Date(popup.start_at) : null
        const endAt = popup.end_at ? new Date(popup.end_at) : null
        if (startAt && startAt > now) return false
        if (endAt && endAt < now) return false
        return true
      }) ?? null

    return NextResponse.json({ success: true, data: active })
  } catch (error) {
    console.error('[popup] GET failed:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to load popup' } },
      { status: 500 }
    )
  }
}
