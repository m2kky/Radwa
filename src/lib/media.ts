export interface BucketRef {
  bucket: string
  key: string
}

export function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

export function parseBucketRef(value: string, scheme: 'r2' | 'sb'): BucketRef | null {
  const prefix = `${scheme}://`
  if (!value.startsWith(prefix)) return null

  const trimmed = value.slice(prefix.length)
  const slashIndex = trimmed.indexOf('/')
  if (slashIndex <= 0) return null

  const bucket = trimmed.slice(0, slashIndex)
  const key = trimmed.slice(slashIndex + 1)
  if (!bucket || !key) return null
  return { bucket, key }
}

export function toMediaUrl(value: string | null | undefined): string | null {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  if (isHttpUrl(trimmed) || trimmed.startsWith('/')) return trimmed
  return `/api/media?path=${encodeURIComponent(trimmed)}`
}
