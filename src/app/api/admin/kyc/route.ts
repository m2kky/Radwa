/**
 * Admin KYC API
 *
 * GET /api/admin/kyc — list KYC requests by status
 *
 * @auth Required (admin via middleware)
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'

const querySchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'all']).optional(),
})

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const { status } = querySchema.parse({
      status: url.searchParams.get('status') ?? undefined,
    })

    const admin = createAdminClient()
    let query = admin
      .from('users')
      .select(`
        id,
        name,
        phone,
        installment_status,
        id_front_url,
        id_back_url,
        photo_url,
        rejection_reason,
        created_at,
        updated_at
      `)
      .neq('installment_status', 'none')
      .order('updated_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('installment_status', status)
    }

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ success: true, data: data ?? [] })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: error.issues } },
        { status: 400 }
      )
    }

    console.error('[Admin KYC GET]', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch KYC requests' } },
      { status: 500 }
    )
  }
}
