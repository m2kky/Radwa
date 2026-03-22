/**
 * Verify OTP API Route
 * 
 * Verifies the 6-digit code and creates the user in Supabase Auth + public.users.
 * 
 * @endpoint POST /api/auth/verify-otp
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'

const schema = z.object({
  email: z.string().email(),
  name:  z.string().min(2),
  code:  z.string().length(6),
  password: z.string().min(8),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, name, code, password } = schema.parse(body)

    const admin = createAdminClient()

    // 1. Find valid OTP
    const { data: otp, error: otpError } = await admin
      .from('verification_otps')
      .select('*')
      .eq('email', email)
      .eq('code', code)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()

    if (otpError || !otp) {
      return NextResponse.json(
        { error: { code: 'INVALID_OTP', message: 'كود التحقق غير صحيح أو انتهت صلاحيته' } },
        { status: 400 }
      )
    }

    // 2. Create user in Supabase Auth
    const { data: authUser, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    })

    if (authError || !authUser.user) {
      console.error('[verify-otp API] auth error:', authError)
      if (authError?.status === 422 || authError?.message?.toLowerCase().includes('already')) {
        return NextResponse.json(
          { error: { code: 'USER_EXISTS', message: 'هذا البريد الإلكتروني مسجل بالفعل' } },
          { status: 409 }
        )
      }
      return NextResponse.json(
        { error: { code: 'AUTH_FAILED', message: authError?.message || 'فشل إنشاء الحساب' } },
        { status: 500 }
      )
    }

    // 3. Mark OTP as used
    await admin
      .from('verification_otps')
      .update({ used_at: new Date().toISOString() })
      .eq('id', otp.id)

    // Note: handle_new_user trigger in Postgres will auto-create the public.users record
    
    return NextResponse.json({
      success: true,
      message: 'تم إنشاء الحساب بنجاح',
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: error.issues } },
        { status: 400 }
      )
    }
    console.error('[verify-otp API] error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'حدث خطأ ما' } },
      { status: 500 }
    )
  }
}
