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

interface R2Ref {
  bucket: string
  key: string
}

function getCairoDateString(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Cairo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const admin = createAdminClient()

  const { data: tokenRow } = await admin
    .from('download_tokens')
    .select('*, products(files), orders(installment_plan)')
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

  const order = Array.isArray(tokenRow.orders) ? tokenRow.orders[0] : tokenRow.orders
  if (order?.installment_plan && order.installment_plan !== 'full') {
    const today = getCairoDateString()
    const { data: installments } = await admin
      .from('installment_payments')
      .select('id, due_date, status')
      .eq('order_id', tokenRow.order_id)
      .in('status', ['pending', 'overdue'])

    const rows = installments ?? []
    const overduePendingIds = rows
      .filter((row) => row.status === 'pending' && String(row.due_date) < today)
      .map((row) => row.id)
    const hasBlockedInstallment =
      overduePendingIds.length > 0 || rows.some((row) => row.status === 'overdue')

    if (overduePendingIds.length > 0) {
      await admin
        .from('installment_payments')
        .update({ status: 'overdue' })
        .in('id', overduePendingIds)
        .eq('status', 'pending')
      await admin
        .from('orders')
        .update({ status: 'suspended' })
        .eq('id', tokenRow.order_id)
        .in('status', ['completed', 'pending'])
    } else if (rows.some((row) => row.status === 'overdue')) {
      await admin
        .from('orders')
        .update({ status: 'suspended' })
        .eq('id', tokenRow.order_id)
        .in('status', ['completed', 'pending'])
    }

    if (hasBlockedInstallment) {
      return NextResponse.json(
        { error: 'الوصول للمنتج متوقف مؤقتًا لوجود قسط متأخر. يرجى السداد من الداشبورد.' },
        { status: 423 }
      )
    }
  }

  const files = tokenRow.products?.files
  if (!files || files.length === 0) {
    return NextResponse.json({ error: 'No files available' }, { status: 404 })
  }

  const storagePath = String(files[0].storage_path)
  let downloadUrl: string

  if (isHttpUrl(storagePath)) {
    // Allow direct external URLs (for manually hosted product files).
    downloadUrl = storagePath
  } else {
    const r2Ref = parseR2Ref(storagePath)
    const key = r2Ref ? r2Ref.key : storagePath
    const bucket = r2Ref?.bucket

    // 5-minute signed URL — actual file never exposed directly
    try {
      downloadUrl = await getSignedDownloadUrl(key, 300, bucket)
    } catch (error) {
      console.error('[download] signed URL generation failed', error)
      return NextResponse.json({ error: 'File temporarily unavailable' }, { status: 503 })
    }
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

  return NextResponse.redirect(downloadUrl)
}
