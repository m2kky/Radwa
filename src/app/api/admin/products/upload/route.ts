/**
 * Admin Product File Upload API
 *
 * POST /api/admin/products/upload
 * multipart/form-data:
 *   - file: File (required)
 *   - slug: string (optional)
 *
 * @auth Required (admin via middleware)
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSignedUploadUrl, uploadToR2 } from '@/lib/r2'

const MAX_PRODUCT_FILE_SIZE = 200 * 1024 * 1024

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'product'
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
    const contentType = req.headers.get('content-type') ?? ''

    if (contentType.includes('application/json')) {
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

      if (size > MAX_PRODUCT_FILE_SIZE) {
        return NextResponse.json(
          { error: { code: 'FILE_TOO_LARGE', message: 'Max file size is 200MB' } },
          { status: 413 }
        )
      }

      const safeSlug = slugify(slugInput)
      const safeFileName = sanitizeFilename(name)
      const storagePath = `products/${safeSlug}/${Date.now()}-${safeFileName}`
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
    }

    const formData = await req.formData()
    const maybeFile = formData.get('file')
    const slugInput = String(formData.get('slug') ?? '')

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

    // Direct browser uploads use the JSON signing branch above. Keep this
    // fallback capped to avoid buffering large files inside the function.
    if (maybeFile.size > MAX_PRODUCT_FILE_SIZE) {
      return NextResponse.json(
        { error: { code: 'FILE_TOO_LARGE', message: 'Max file size is 200MB' } },
        { status: 413 }
      )
    }

    const safeSlug = slugify(slugInput)
    const safeFileName = sanitizeFilename(maybeFile.name)
    const storagePath = `products/${safeSlug}/${Date.now()}-${safeFileName}`

    const bytes = Buffer.from(await maybeFile.arrayBuffer())
    await uploadToR2(storagePath, bytes, maybeFile.type || undefined)

    return NextResponse.json({
      success: true,
      data: {
        name: maybeFile.name,
        storage_path: storagePath,
        size: maybeFile.size,
      },
    })
  } catch (error) {
    console.error('[Admin Product Upload POST]', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to upload file' } },
      { status: 500 }
    )
  }
}
