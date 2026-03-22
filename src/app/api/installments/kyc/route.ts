import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createAdminClient } from '@/lib/supabase/server'

const schema = z.object({
  id_front_url: z.string().url(),
  id_back_url: z.string().url(),
  photo_url: z.string().url(),
})

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

    const body = await req.json()
    const input = schema.parse(body)

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('users')
      .update({
        id_front_url: input.id_front_url,
        id_back_url: input.id_back_url,
        photo_url: input.photo_url,
        installment_status: 'pending',
        rejection_reason: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
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
