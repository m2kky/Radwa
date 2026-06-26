import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'

const guideSchema = z.object({
  slug: z.string().trim().min(1),
  title: z.string().trim().min(1),
  excerpt: z.string().trim().optional().nullable(),
  content_body: z.string().optional().nullable(),
  thumbnail_url: z.string().trim().optional().nullable(),
  file_storage_path: z.string().trim().optional().nullable(),
  file_name: z.string().trim().optional().nullable(),
  file_size: z.number().int().nonnegative().default(0),
  category: z.string().trim().optional().nullable(),
  tags: z.array(z.string()).default([]),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  is_featured: z.boolean().default(false),
  meta_title: z.string().trim().optional().nullable(),
  meta_description: z.string().trim().optional().nullable(),
})

export async function GET() {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('guides')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ success: true, data: data ?? [] })
  } catch (error) {
    console.error('[Admin Guides GET]', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch guides' } },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validated = guideSchema.parse(body)
    const admin = createAdminClient()

    const { data, error } = await admin
      .from('guides')
      .insert({
        ...validated,
        excerpt: validated.excerpt || null,
        content_body: validated.content_body || null,
        thumbnail_url: validated.thumbnail_url || null,
        file_storage_path: validated.file_storage_path || null,
        file_name: validated.file_name || null,
        category: validated.category || null,
        tags: validated.tags.filter(Boolean),
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
    console.error('[Admin Guides POST]', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create guide' } },
      { status: 500 }
    )
  }
}
