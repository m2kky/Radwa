import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import {
  sanitizeSettingValue,
  SITE_CONTENT_KEYS,
  type SiteContentKey,
} from '@/lib/site-content'

const payloadSchema = z.object({
  updates: z.record(z.string(), z.unknown()),
})

function isAllowedKey(key: string): key is SiteContentKey {
  return SITE_CONTENT_KEYS.includes(key as SiteContentKey)
}

export async function GET() {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('settings')
      .select('key, value, updated_at')
      .in('key', [...SITE_CONTENT_KEYS])

    if (error) throw error
    return NextResponse.json({ success: true, data: data ?? [] })
  } catch (error) {
    console.error('[admin/settings] GET failed:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch settings' } },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = payloadSchema.parse(body)

    const entries = Object.entries(parsed.updates)
    if (entries.length === 0) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'No updates provided' } },
        { status: 400 }
      )
    }

    const invalid = entries.find(([key]) => !isAllowedKey(key))
    if (invalid) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: `Unsupported settings key: ${invalid[0]}`,
          },
        },
        { status: 400 }
      )
    }

    const now = new Date().toISOString()
    const rows = entries.map(([key, value]) => {
      return {
        key,
        value: sanitizeSettingValue(key as SiteContentKey, value),
        updated_at: now,
      }
    })

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('settings')
      .upsert(rows, { onConflict: 'key' })
      .select('key, value, updated_at')

    if (error) throw error
    return NextResponse.json({ success: true, data: data ?? [] })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: error.issues } },
        { status: 400 }
      )
    }

    console.error('[admin/settings] PATCH failed:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to save settings' } },
      { status: 500 }
    )
  }
}
