/**
 * Signup API Route
 * 
 * Initiates the signup process by generating and sending a 6-digit OTP.
 * User account is NOT created in Supabase Auth until OTP is verified.
 * 
 * @endpoint POST /api/auth/signup
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { sendOtpEmail } from '@/lib/email'

const schema = z.object({
  email: z.string().email(),
  name:  z.string().min(2),
})

async function authUserExistsByEmail(
  admin: ReturnType<typeof createAdminClient>,
  email: string
): Promise<boolean> {
  const target = email.trim().toLowerCase()
  const perPage = 1000
  let page = 1

  while (page <= 100) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) throw error

    const users = data.users ?? []
    if (users.some((u) => u.email?.trim().toLowerCase() === target)) {
      return true
    }

    if (users.length < perPage) {
      return false
    }

    page += 1
  }

  return false
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email } = schema.parse(body)

    const admin = createAdminClient()

    // 1. Check if user already exists in auth.users
    const userExists = await authUserExistsByEmail(admin, email)

    if (userExists) {
      return NextResponse.json(
        { error: { code: 'USER_EXISTS', message: 'هذا البريد الإلكتروني مسجل بالفعل' } },
        { status: 400 }
      )
    }

    // 2. Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 mins

    // 3. Store OTP in database
    await admin.from('verification_otps').insert({
      email,
      code,
      type: 'signup',
      expires_at: expiresAt,
    })

    // 4. Send email via Resend
    await sendOtpEmail(email, code)

    return NextResponse.json({
      success: true,
      message: 'تم إرسال كود التحقق إلى بريدك الإلكتروني',
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: error.issues } },
        { status: 400 }
      )
    }
    console.error('[signup API] error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'حدث خطأ ما، يرجى المحاولة لاحقاً' } },
      { status: 500 }
    )
  }
}
