/**
 * Admin Media Upload API
 *
 * POST /api/admin/media/upload
 * multipart/form-data:
 *   - file: File (required)
 *   - folder: string (optional, e.g. products/my-slug or blog/my-slug)
 *
 * Uploads to Supabase Storage bucket (default: digital-products)
 * and returns a media URL served through /api/media.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-_/]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/\/+/g, '/')
    .replace(/^\/|\/$/g, '') || 'media'
}

function sanitizeFilename(name: string): string {
  return name
    .trim()
    .replace(/[^\w.\-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'file.bin'
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const maybeFile = formData.get('file')
    const folderInput = String(formData.get('folder') ?? '')
    const folder = slugify(folderInput || 'uploads')

    if (!(maybeFile instanceof File)) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'file is required' } },
        { status: 400 }
      )
    }

    if (maybeFile.size === 0) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'empty file is not allowed' } },
        { status: 400 }
      )
    }

    if (maybeFile.size > 15 * 1024 * 1024) {
      return NextResponse.json(
        { error: { code: 'FILE_TOO_LARGE', message: 'Max media size is 15MB' } },
        { status: 413 }
      )
    }

    const safeFileName = sanitizeFilename(maybeFile.name)
    const objectPath = `${folder}/${Date.now()}-${safeFileName}`
    const bytes = Buffer.from(await maybeFile.arrayBuffer())
    const bucket = process.env.SUPABASE_MEDIA_BUCKET || 'digital-products'

    const admin = createAdminClient()
    const { error } = await admin.storage.from(bucket).upload(objectPath, bytes, {
      contentType: maybeFile.type || 'application/octet-stream',
      upsert: true,
    })

    if (error) throw error

    const storageRef = `sb://${bucket}/${objectPath}`
    const mediaUrl = `/api/media?path=${encodeURIComponent(storageRef)}`

    return NextResponse.json({
      success: true,
      data: {
        name: maybeFile.name,
        size: maybeFile.size,
        storage_path: storageRef,
        url: mediaUrl,
      },
    })
  } catch (error) {
    console.error('[Admin Media Upload POST]', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to upload media' } },
      { status: 500 }
    )
  }
}
