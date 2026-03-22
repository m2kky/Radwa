import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSignedDownloadUrl } from '@/lib/r2'
import { isHttpUrl, parseBucketRef } from '@/lib/media'

function canUseR2(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY
  )
}

export async function GET(req: NextRequest) {
  const rawPath = req.nextUrl.searchParams.get('path')
  if (!rawPath) {
    return NextResponse.json({ error: 'Missing path' }, { status: 400 })
  }

  const path = rawPath.trim()
  if (!path) {
    return NextResponse.json({ error: 'Missing path' }, { status: 400 })
  }

  if (isHttpUrl(path)) {
    return NextResponse.redirect(path)
  }

  const sbRef = parseBucketRef(path, 'sb')
  if (sbRef) {
    try {
      const admin = createAdminClient()
      const { data, error } = await admin.storage
        .from(sbRef.bucket)
        .createSignedUrl(sbRef.key, 300)
      if (error || !data?.signedUrl) throw error ?? new Error('Unable to sign Supabase URL')
      return NextResponse.redirect(data.signedUrl)
    } catch (error) {
      console.error('[media] supabase sign failed:', error)
      return NextResponse.json({ error: 'File unavailable' }, { status: 503 })
    }
  }

  const r2Ref = parseBucketRef(path, 'r2')
  if (r2Ref || canUseR2()) {
    try {
      const key = r2Ref ? r2Ref.key : path
      const bucket = r2Ref?.bucket || process.env.R2_BUCKET_NAME
      if (!bucket) {
        return NextResponse.json({ error: 'Media bucket not configured' }, { status: 500 })
      }
      const signedUrl = await getSignedDownloadUrl(key, 300, bucket)
      return NextResponse.redirect(signedUrl)
    } catch (error) {
      console.error('[media] r2 sign failed:', error)
      return NextResponse.json({ error: 'File unavailable' }, { status: 503 })
    }
  }

  const supabaseBucket = process.env.SUPABASE_MEDIA_BUCKET || 'digital-products'
  try {
    const admin = createAdminClient()
    const { data, error } = await admin.storage
      .from(supabaseBucket)
      .createSignedUrl(path, 300)
    if (error || !data?.signedUrl) throw error ?? new Error('Unable to sign Supabase URL')
    return NextResponse.redirect(data.signedUrl)
  } catch (error) {
    console.error('[media] fallback sign failed:', error)
    return NextResponse.json({ error: 'File unavailable' }, { status: 503 })
  }
}
