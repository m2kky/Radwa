import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'

const serviceSchema = z.object({
  slug: z.string().trim().min(1),
  title: z.string().trim().min(1),
  excerpt: z.string().trim().optional().nullable(),
  content_body: z.string().optional().nullable(),
  thumbnail_url: z.string().trim().optional().nullable(),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  sort_order: z.number().int().default(0),
  cta_type: z.enum(['book', 'link', 'form']).default('book'),
  cta_label: z.string().trim().min(1).default('ابدأ الآن'),
  cta_url: z.string().trim().optional().nullable(),
  meta_title: z.string().trim().optional().nullable(),
  meta_description: z.string().trim().optional().nullable(),
})

export async function GET() {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('services')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ success: true, data: data ?? [] })
  } catch (error) {
    console.error('[Admin Services GET]', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch services' } },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validated = serviceSchema.parse(body)
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('services')
      .insert({
        ...validated,
        excerpt: validated.excerpt || null,
        content_body: validated.content_body || null,
        thumbnail_url: validated.thumbnail_url || null,
        cta_url: validated.cta_url || null,
        meta_title: validated.meta_title || null,
        meta_description: validated.meta_description || null,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: error.issues } },
        { status: 400 }
      )
    }
    console.error('[Admin Services POST]', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create service' } },
      { status: 500 }
    )
  }
}
