import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { uploadToR2 } from '@/lib/r2'

const jsonSchema = z.object({
  id_front_url: z.string().min(1),
  id_back_url: z.string().min(1),
  photo_url: z.string().min(1),
})

function sanitizeFilename(name: string): string {
  return name
    .trim()
    .replace(/[^\w.\-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'document.bin'
}

function canUseR2(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY
  )
}

async function uploadKycDocument(
  file: File,
  userId: string,
  label: 'front' | 'back' | 'photo',
  admin: ReturnType<typeof createAdminClient>,
  options: { r2Bucket: string; supabaseBucket: string }
): Promise<string> {
  const safeName = sanitizeFilename(file.name)
  const storagePath = `kyc/${userId}/${Date.now()}-${label}-${safeName}`
  const bytes = Buffer.from(await file.arrayBuffer())

  if (canUseR2()) {
    await uploadToR2(storagePath, bytes, file.type || undefined, options.r2Bucket)
    return `r2://${options.r2Bucket}/${storagePath}`
  }

  const { error } = await admin.storage
    .from(options.supabaseBucket)
    .upload(storagePath, bytes, {
      contentType: file.type || 'application/octet-stream',
      upsert: true,
    })

  if (error) throw error
  return `sb://${options.supabaseBucket}/${storagePath}`
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const contentType = req.headers.get('content-type') || ''
    const admin = createAdminClient()
    const r2BucketName = process.env.R2_BUCKET_KYC || 'kyc-documents'
    const supabaseBucketName = process.env.SUPABASE_BUCKET_KYC || 'kyc-documents'

    let id_front_url = ''
    let id_back_url = ''
    let photo_url = ''

    if (contentType.includes('multipart/form-data')) {
      const form = await req.formData()
      const idFront = form.get('id_front')
      const idBack = form.get('id_back')
      const photo = form.get('photo')

      if (!(idFront instanceof File) || !(idBack instanceof File) || !(photo instanceof File)) {
        return NextResponse.json(
          { error: { code: 'VALIDATION_ERROR', message: 'All KYC files are required' } },
          { status: 400 }
        )
      }

      const maxSize = 10 * 1024 * 1024 // 10 MB each
      if (idFront.size > maxSize || idBack.size > maxSize || photo.size > maxSize) {
        return NextResponse.json(
          { error: { code: 'FILE_TOO_LARGE', message: 'Each file must be <= 10MB' } },
          { status: 413 }
        )
      }

      id_front_url = await uploadKycDocument(idFront, user.id, 'front', admin, {
        r2Bucket: r2BucketName,
        supabaseBucket: supabaseBucketName,
      })
      id_back_url = await uploadKycDocument(idBack, user.id, 'back', admin, {
        r2Bucket: r2BucketName,
        supabaseBucket: supabaseBucketName,
      })
      photo_url = await uploadKycDocument(photo, user.id, 'photo', admin, {
        r2Bucket: r2BucketName,
        supabaseBucket: supabaseBucketName,
      })
    } else {
      const body = await req.json()
      const input = jsonSchema.parse(body)
      id_front_url = input.id_front_url
      id_back_url = input.id_back_url
      photo_url = input.photo_url
    }

    const fallbackName = (
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      'User'
    ).toString()

    const { data, error } = await admin
      .from('users')
      .upsert({
        id: user.id,
        name: fallbackName,
        id_front_url,
        id_back_url,
        photo_url,
        installment_status: 'pending',
        rejection_reason: null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })
      .select('id, installment_status')
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: error.issues } },
        { status: 400 }
      )
    }

    console.error('[installments/kyc] error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to submit KYC' } },
      { status: 500 }
    )
  }
}
