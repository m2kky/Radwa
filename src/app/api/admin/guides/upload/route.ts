import { NextRequest, NextResponse } from 'next/server'
import { getSignedUploadUrl } from '@/lib/r2'

const MAX_GUIDE_FILE_SIZE = 200 * 1024 * 1024

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'guide'
}

function sanitizeFilename(name: string): string {
  return name
    .trim()
    .replace(/[^\w.\-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'file.bin'
}

function canUseR2(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET_NAME
  )
}

export async function POST(req: NextRequest) {
  try {
    if (!canUseR2()) {
      return NextResponse.json(
        { error: { code: 'R2_NOT_CONFIGURED', message: 'R2 storage is not configured' } },
        { status: 500 }
      )
    }

    const body = await req.json()
    const name = typeof body?.name === 'string' ? body.name : ''
    const slugInput = typeof body?.slug === 'string' ? body.slug : ''
    const fileType = typeof body?.content_type === 'string' ? body.content_type : ''
    const size = typeof body?.size === 'number' ? body.size : Number(body?.size)

    if (!name.trim()) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'file name is required' } },
        { status: 400 }
      )
    }

    if (!Number.isFinite(size) || size <= 0) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'valid file size is required' } },
        { status: 400 }
      )
    }

    if (size > MAX_GUIDE_FILE_SIZE) {
      return NextResponse.json(
        { error: { code: 'FILE_TOO_LARGE', message: 'Max file size is 200MB' } },
        { status: 413 }
      )
    }

    const safeSlug = slugify(slugInput)
    const safeFileName = sanitizeFilename(name)
    const storagePath = `guides/${safeSlug}/${Date.now()}-${safeFileName}`
    const uploadUrl = await getSignedUploadUrl(storagePath, fileType || undefined)

    return NextResponse.json({
      success: true,
      data: {
        upload_url: uploadUrl,
        name,
        storage_path: storagePath,
        size,
        content_type: fileType || 'application/octet-stream',
      },
    })
  } catch (error) {
    console.error('[Admin Guides Upload POST]', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to prepare upload' } },
      { status: 500 }
    )
  }
}
