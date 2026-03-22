import { NextRequest, NextResponse } from 'next/server'
import { getSignedDownloadUrl } from '@/lib/r2'

interface R2Ref {
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

export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get('path')
  if (!path) {
    return NextResponse.json({ error: 'Missing path' }, { status: 400 })
  }

  if (isHttpUrl(path)) {
    return NextResponse.redirect(path)
  }

  const r2Ref = parseR2Ref(path)
  const key = r2Ref ? r2Ref.key : path
  const bucket = r2Ref?.bucket || process.env.R2_BUCKET_KYC || process.env.R2_BUCKET_NAME

  if (!bucket) {
    return NextResponse.json({ error: 'KYC bucket not configured' }, { status: 500 })
  }

  try {
    const signedUrl = await getSignedDownloadUrl(key, 300, bucket)
    return NextResponse.redirect(signedUrl)
  } catch (error) {
    console.error('[admin/kyc/file] failed:', error)
    return NextResponse.json({ error: 'File unavailable' }, { status: 503 })
  }
}
