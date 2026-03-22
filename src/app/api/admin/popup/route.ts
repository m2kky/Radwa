import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'

const popupSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1),
  message: z.string().min(1),
  cta_text: z.string().optional().nullable(),
  cta_url: z.string().url().optional().nullable(),
  image_url: z.string().url().optional().nullable(),
  is_active: z.boolean().default(false),
  show_once: z.boolean().default(true),
  start_at: z.string().datetime().optional().nullable(),
  end_at: z.string().datetime().optional().nullable(),
})

export async function GET() {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('site_popups')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error
    return NextResponse.json({ success: true, data: data ?? null })
  } catch (error) {
    console.error('[admin/popup] GET failed:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch popup settings' } },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const input = popupSchema.parse(body)
    const admin = createAdminClient()

    let saved: Record<string, unknown> | null = null

    if (input.id) {
      const { data, error } = await admin
        .from('site_popups')
        .update({
          title: input.title.trim(),
          message: input.message.trim(),
          cta_text: input.cta_text?.trim() || null,
          cta_url: input.cta_url || null,
          image_url: input.image_url || null,
          is_active: input.is_active,
          show_once: input.show_once,
          start_at: input.start_at || null,
          end_at: input.end_at || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.id)
        .select('*')
        .single()

      if (error) throw error
      saved = data
    } else {
      const { data, error } = await admin
        .from('site_popups')
        .insert({
          title: input.title.trim(),
          message: input.message.trim(),
          cta_text: input.cta_text?.trim() || null,
          cta_url: input.cta_url || null,
          image_url: input.image_url || null,
          is_active: input.is_active,
          show_once: input.show_once,
          start_at: input.start_at || null,
          end_at: input.end_at || null,
        })
        .select('*')
        .single()

      if (error) throw error
      saved = data
    }

    if (saved && input.is_active) {
      await admin
        .from('site_popups')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .neq('id', String(saved.id))
    }

    return NextResponse.json({ success: true, data: saved })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: error.issues } },
        { status: 400 }
      )
    }

    console.error('[admin/popup] POST failed:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to save popup settings' } },
      { status: 500 }
    )
  }
}
