/**
 * Admin Blog API
 *
 * GET  /api/admin/blog — list all posts
 * POST /api/admin/blog — create new post
 *
 * @auth Required (admin via middleware)
 * @phase Phase 2: Blog Admin
 * @author Agent (Antigravity)
 * @created 2026-02-15
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'

const postSchema = z.object({
  slug:          z.string().min(1),
  title:         z.string().min(1),
  excerpt:       z.string().optional(),
  content:       z.string().optional(),
  thumbnail_url: z.string().trim().min(1).optional().or(z.literal('')),
  category:      z.string().optional(),
  is_featured:   z.boolean().default(false),
  status:        z.enum(['draft', 'published']).default('draft'),
})

export async function GET() {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('blog_posts')
      .select('id, slug, title, category, status, is_featured, published_at, created_at')
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('[Admin Blog GET]', error)
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch posts' } }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validated = postSchema.parse(body)

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('blog_posts')
      .insert({
        ...validated,
        thumbnail_url: validated.thumbnail_url || null,
        featured_image_url: validated.thumbnail_url || null,
        published_at:  validated.status === 'published' ? new Date().toISOString() : null,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: error.issues } }, { status: 400 })
    }
    console.error('[Admin Blog POST]', error)
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to create post' } }, { status: 500 })
  }
}
