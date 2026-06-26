import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSignedDownloadUrl } from '@/lib/r2'
import { isHttpUrl, parseBucketRef } from '@/lib/media'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const admin = createAdminClient()
    const { data: guide, error } = await admin
      .from('guides')
      .select('id, file_storage_path, download_count, status')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle()

    if (error) throw error
    if (!guide?.file_storage_path) {
      return NextResponse.json({ error: 'File unavailable' }, { status: 404 })
    }

    const storagePath = String(guide.file_storage_path)
    let downloadUrl: string

    if (isHttpUrl(storagePath)) {
      downloadUrl = storagePath
    } else {
      const r2Ref = parseBucketRef(storagePath, 'r2')
      const key = r2Ref ? r2Ref.key : storagePath
      const bucket = r2Ref?.bucket || process.env.R2_BUCKET_NAME
      if (!bucket) {
        return NextResponse.json({ error: 'R2 bucket is not configured' }, { status: 500 })
      }
      downloadUrl = await getSignedDownloadUrl(key, 300, bucket)
    }

    await admin
      .from('guides')
      .update({ download_count: (guide.download_count ?? 0) + 1 })
      .eq('id', guide.id)

    return NextResponse.redirect(downloadUrl)
  } catch (error) {
    console.error('[guides/download] failed:', error)
    return NextResponse.json({ error: 'Download failed' }, { status: 500 })
  }
}
