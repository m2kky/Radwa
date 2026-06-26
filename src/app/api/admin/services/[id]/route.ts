import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'

const servicePatchSchema = z.object({
  slug: z.string().trim().min(1).optional(),
  title: z.string().trim().min(1).optional(),
  excerpt: z.string().trim().optional().nullable(),
  content_body: z.string().optional().nullable(),
  thumbnail_url: z.string().trim().optional().nullable(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  sort_order: z.number().int().optional(),
  cta_type: z.enum(['book', 'link', 'form']).optional(),
  cta_label: z.string().trim().min(1).optional(),
  cta_url: z.string().trim().optional().nullable(),
  meta_title: z.string().trim().optional().nullable(),
  meta_description: z.string().trim().optional().nullable(),
})

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('services')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Failed to fetch service' } },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const validated = servicePatchSchema.parse(body)
    const updates = {
      ...validated,
      excerpt: validated.excerpt === '' ? null : validated.excerpt,
      content_body: validated.content_body === '' ? null : validated.content_body,
      thumbnail_url: validated.thumbnail_url === '' ? null : validated.thumbnail_url,
      cta_url: validated.cta_url === '' ? null : validated.cta_url,
      meta_title: validated.meta_title === '' ? null : validated.meta_title,
      meta_description: validated.meta_description === '' ? null : validated.meta_description,
    }
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => typeof value !== 'undefined')
    )

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('services')
      .update(cleanUpdates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: error.issues } },
        { status: 400 }
      )
    }
    console.error('[Admin Services PATCH]', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update service' } },
      { status: 500 }
    )
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const admin = createAdminClient()
    const { error } = await admin.from('services').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Admin Services DELETE]', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete service' } },
      { status: 500 }
    )
  }
}
