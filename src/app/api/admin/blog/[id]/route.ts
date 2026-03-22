/**
 * Admin Blog [id] API
 *
 * GET    /api/admin/blog/[id] — get single post
 * PATCH  /api/admin/blog/[id] — update post
 * DELETE /api/admin/blog/[id] — delete post
 *
 * @auth Required (admin via middleware)
 * @phase Phase 2: Blog Admin
 * @author Agent (Antigravity)
 * @created 2026-02-15
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'

const patchSchema = z.object({
  slug:          z.string().min(1).optional(),
  title:         z.string().min(1).optional(),
  excerpt:       z.string().optional(),
  content:       z.string().optional(),
  thumbnail_url: z.string().trim().min(1).optional().or(z.literal('')),
  category:      z.string().optional(),
  is_featured:   z.boolean().optional(),
  status:        z.enum(['draft', 'published']).optional(),
})

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const admin = createAdminClient()
  const { data, error } = await admin.from('blog_posts').select('*').eq('id', id).single()
  if (error || !data) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Post not found' } }, { status: 404 })
  return NextResponse.json({ success: true, data })
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await req.json()
    const validated = patchSchema.parse(body)

    const updates: Record<string, unknown> = { ...validated }
    if (validated.thumbnail_url === '') {
      updates.thumbnail_url = null
      updates.featured_image_url = null
    } else if (typeof validated.thumbnail_url === 'string') {
      updates.featured_image_url = validated.thumbnail_url
    }

    // Set published_at only when publishing for first time.
    if (validated.status === 'published') {
      const admin = createAdminClient()
      const { data: existing } = await admin
        .from('blog_posts')
        .select('published_at')
        .eq('id', id)
        .single()
      if (!existing?.published_at) {
        updates.published_at = new Date().toISOString()
      }
    }
    if (validated.status === 'draft') {
      updates.published_at = null
    }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('blog_posts')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: error.issues } }, { status: 400 })
    }
    console.error('[Admin Blog PATCH]', error)
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to update post' } }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const admin = createAdminClient()
    const { error } = await admin.from('blog_posts').delete().eq('id', id)
    if (error) throw error
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('[Admin Blog DELETE]', error)
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to delete post' } }, { status: 500 })
  }
}
