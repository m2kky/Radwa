import { NextRequest, NextResponse } from 'next/server'
import { getSignedDownloadUrl } from '@/lib/r2'
import { createAdminClient } from '@/lib/supabase/server'

interface R2Ref {
  bucket: string
  key: string
}

interface SbRef {
  bucket: string
  key: string
}

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

function parseR2Ref(value: string): R2Ref | null {
  if (!value.startsWith('r2://')) return null
  const trimmed = value.slice('r2://'.length)
  const slashIndex = trimmed.indexOf('/')
  if (slashIndex <= 0) return null
  const bucket = trimmed.slice(0, slashIndex)
  const key = trimmed.slice(slashIndex + 1)
  if (!bucket || !key) return null
  return { bucket, key }
}

function parseSbRef(value: string): SbRef | null {
  if (!value.startsWith('sb://')) return null
  const trimmed = value.slice('sb://'.length)
  const slashIndex = trimmed.indexOf('/')
  if (slashIndex <= 0) return null
  const bucket = trimmed.slice(0, slashIndex)
  const key = trimmed.slice(slashIndex + 1)
  if (!bucket || !key) return null
  return { bucket, key }
}

function canUseR2(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY
  )
}

export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get('path')
  if (!path) {
    return NextResponse.json({ error: 'Missing path' }, { status: 400 })
  }

  if (isHttpUrl(path)) {
    return NextResponse.redirect(path)
  }

  const sbRef = parseSbRef(path)
  if (sbRef) {
    try {
      const admin = createAdminClient()
      const { data, error } = await admin.storage
        .from(sbRef.bucket)
        .createSignedUrl(sbRef.key, 300)
      if (error || !data?.signedUrl) throw error ?? new Error('Unable to sign Supabase URL')
      return NextResponse.redirect(data.signedUrl)
    } catch (error) {
      console.error('[admin/kyc/file] supabase sign failed:', error)
      return NextResponse.json({ error: 'File unavailable' }, { status: 503 })
    }
  }

  const r2Ref = parseR2Ref(path)

  if (r2Ref || canUseR2()) {
    const key = r2Ref ? r2Ref.key : path
    const bucket = r2Ref?.bucket || process.env.R2_BUCKET_KYC || process.env.R2_BUCKET_NAME
    if (!bucket) {
      return NextResponse.json({ error: 'KYC bucket not configured' }, { status: 500 })
    }
    try {
      const signedUrl = await getSignedDownloadUrl(key, 300, bucket)
      return NextResponse.redirect(signedUrl)
    } catch (error) {
      console.error('[admin/kyc/file] r2 sign failed:', error)
      return NextResponse.json({ error: 'File unavailable' }, { status: 503 })
    }
  }

  const supabaseBucket = process.env.SUPABASE_BUCKET_KYC || 'kyc-documents'
  try {
    const admin = createAdminClient()
    const { data, error } = await admin.storage
      .from(supabaseBucket)
      .createSignedUrl(path, 300)
    if (error || !data?.signedUrl) throw error ?? new Error('Unable to sign Supabase URL')
    return NextResponse.redirect(data.signedUrl)
  } catch (error) {
    console.error('[admin/kyc/file] fallback sign failed:', error)
    return NextResponse.json({ error: 'File unavailable' }, { status: 503 })
  }
}
