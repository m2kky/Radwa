/**
 * Admin KYC Decision API
 *
 * PATCH /api/admin/kyc/:id — approve or reject a user KYC request
 *
 * @auth Required (admin via middleware)
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { sendKycStatusEmail } from '@/lib/email'

const paramsSchema = z.object({
  id: z.string().uuid(),
})

const bodySchema = z.object({
  status: z.enum(['approved', 'rejected']),
  rejection_reason: z.string().trim().max(500).optional(),
})

interface Context {
  params: Promise<{ id: string }>
}

export async function PATCH(req: NextRequest, { params }: Context) {
  try {
    const { id } = paramsSchema.parse(await params)
    const body = bodySchema.parse(await req.json())

    if (body.status === 'rejected' && !body.rejection_reason) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'سبب الرفض مطلوب' } },
        { status: 400 }
      )
    }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('users')
      .update({
        installment_status: body.status,
        rejection_reason: body.status === 'rejected' ? body.rejection_reason : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
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
      .maybeSingle()

    if (error) throw error
    if (!data) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      )
    }

    try {
      const { data: authData } = await admin.auth.admin.getUserById(id)
      const email = authData.user?.email
      if (email) {
        void sendKycStatusEmail({
          to: email,
          name: data.name || undefined,
          status: body.status,
          reason: body.status === 'rejected' ? body.rejection_reason : null,
        }).catch((emailError) => {
          console.error('[Admin KYC PATCH] status email failed:', emailError)
        })
      }
    } catch (lookupError) {
      console.error('[Admin KYC PATCH] user lookup failed for email:', lookupError)
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: error.issues } },
        { status: 400 }
      )
    }

    console.error('[Admin KYC PATCH]', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update KYC status' } },
      { status: 500 }
    )
  }
}
