/**
 * Admin Media Upload API
 *
 * POST /api/admin/media/upload
 * multipart/form-data:
 *   - file: File (required)
 *   - folder: string (optional, e.g. products/my-slug or blog/my-slug)
 *
 * Uploads to Cloudflare R2
 * and returns a media URL served through /api/media.
 */
import { NextRequest, NextResponse } from 'next/server'
import { uploadToR2 } from '@/lib/r2'

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

function getR2BucketName(): string | null {
  return process.env.R2_BUCKET_MEDIA || process.env.R2_BUCKET_NAME || null
}

function canUseR2(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      getR2BucketName()
  )
}

export async function POST(req: NextRequest) {
  try {
    if (!canUseR2()) {
      return NextResponse.json(
        { error: { code: 'R2_NOT_CONFIGURED', message: 'R2 media storage is not configured' } },
        { status: 500 }
      )
    }

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
    const bucket = getR2BucketName()!

    await uploadToR2(objectPath, bytes, maybeFile.type || undefined, bucket)

    const storageRef = `r2://${bucket}/${objectPath}`
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
