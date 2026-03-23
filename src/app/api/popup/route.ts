import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { normalizePopupActions, normalizePopupVariant } from '@/lib/popup'

function cleanText(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function normalizePopup(popup: Record<string, unknown>) {
  return {
    id: String(popup.id),
    title: cleanText(popup.title) ?? '',
    message: cleanText(popup.message) ?? '',
    image_url: cleanText(popup.image_url),
    variant: normalizePopupVariant(popup.variant),
    discount_code: cleanText(popup.discount_code),
    discount_note: cleanText(popup.discount_note),
    actions: normalizePopupActions(popup.actions, {
      ctaText: cleanText(popup.cta_text),
      ctaUrl: cleanText(popup.cta_url),
    }),
    collect_name: Boolean(popup.collect_name),
    collect_email: Boolean(popup.collect_email),
    collect_phone: Boolean(popup.collect_phone),
    lead_title: cleanText(popup.lead_title),
    lead_submit_text: cleanText(popup.lead_submit_text),
    lead_success_message: cleanText(popup.lead_success_message),
    show_once: popup.show_once !== false,
    updated_at: typeof popup.updated_at === 'string' ? popup.updated_at : new Date().toISOString(),
    start_at: typeof popup.start_at === 'string' ? popup.start_at : null,
    end_at: typeof popup.end_at === 'string' ? popup.end_at : null,
  }
}

export async function GET() {
  try {
    const admin = createAdminClient()
    const now = new Date()

    const { data, error } = await admin
      .from('site_popups')
      .select('*')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(20)

    if (error) throw error

    const activeRow =
      (data ?? []).find((row) => {
        const popup = row as Record<string, unknown>
        const startAt = typeof popup.start_at === 'string' ? new Date(popup.start_at) : null
        const endAt = typeof popup.end_at === 'string' ? new Date(popup.end_at) : null
        if (startAt && startAt > now) return false
        if (endAt && endAt < now) return false
        return true
      }) as Record<string, unknown> | undefined

    const active = activeRow ? normalizePopup(activeRow) : null

    return NextResponse.json({ success: true, data: active })
  } catch (error) {
    console.error('[popup] GET failed:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to load popup' } },
      { status: 500 }
    )
  }
}
