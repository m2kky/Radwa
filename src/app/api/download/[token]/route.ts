/**
 * Download Route
 *
 * Validates token, checks expiry and usage limit,
 * then redirects to a short-lived R2 signed URL.
 * Atomic increment prevents race condition on download count.
 *
 * @endpoint GET /api/download/[token]
 * @auth None (token is the auth)
 */
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSignedDownloadUrl } from '@/lib/r2'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const admin = createAdminClient()

  const { data: tokenRow } = await admin
    .from('download_tokens')
    .select('*, products(files)')
    .eq('token', token)
    .maybeSingle()

  if (!tokenRow) {
    return NextResponse.json({ error: 'Invalid download link' }, { status: 404 })
  }

  // null expires_at = permanent token (email link)
  if (tokenRow.expires_at && new Date(tokenRow.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Download link has expired' }, { status: 410 })
  }

  if (tokenRow.download_count >= tokenRow.max_downloads) {
    return NextResponse.json({ error: 'Download limit reached' }, { status: 410 })
  }

  const files = tokenRow.products?.files
  if (!files || files.length === 0) {
    return NextResponse.json({ error: 'No files available' }, { status: 404 })
  }

  // 5-minute signed URL — actual file never exposed directly
  let signedUrl: string
  try {
    signedUrl = await getSignedDownloadUrl(files[0].storage_path, 300)
  } catch (error) {
    console.error('[download] signed URL generation failed', error)
    return NextResponse.json({ error: 'File temporarily unavailable' }, { status: 503 })
  }

  // Optimistic lock — prevents race condition
  const { data: updated } = await admin
    .from('download_tokens')
    .update({ download_count: tokenRow.download_count + 1 })
    .eq('id', tokenRow.id)
    .eq('download_count', tokenRow.download_count)
    .select('download_count')
    .maybeSingle()

  if (!updated) {
    return NextResponse.json({ error: 'Download limit reached' }, { status: 410 })
  }

  return NextResponse.redirect(signedUrl)
}
