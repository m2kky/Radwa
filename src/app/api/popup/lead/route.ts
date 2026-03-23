import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'

const phonePattern = /^[0-9+\-\s()]{7,20}$/

const schema = z.object({
  popup_id: z.string().uuid(),
  name: z.string().trim().max(100).optional().nullable(),
  email: z.string().trim().email().optional().nullable(),
  phone: z.string().trim().max(20).optional().nullable(),
  source_path: z.string().trim().max(240).optional().nullable(),
}).superRefine((value, ctx) => {
  const hasEmail = typeof value.email === 'string' && value.email.trim().length > 0
  const hasPhone = typeof value.phone === 'string' && value.phone.trim().length > 0

  if (!hasEmail && !hasPhone) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['email'],
      message: 'لازم تدخل إيميل أو رقم موبايل',
    })
  }

  if (hasPhone && !phonePattern.test(value.phone!.trim())) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['phone'],
      message: 'رقم الموبايل غير صحيح',
    })
  }
})

function cleanText(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const input = schema.parse(body)

    const admin = createAdminClient()
    const { data: popup, error: popupError } = await admin
      .from('site_popups')
      .select('id, is_active, collect_name, collect_email, collect_phone, start_at, end_at, lead_success_message')
      .eq('id', input.popup_id)
      .maybeSingle()

    if (popupError) throw popupError
    if (!popup || !popup.is_active) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Popup غير متاح حالياً' } },
        { status: 404 }
      )
    }

    const now = new Date()
    if (popup.start_at && new Date(popup.start_at) > now) {
      return NextResponse.json(
        { error: { code: 'NOT_AVAILABLE', message: 'Popup غير متاح حالياً' } },
        { status: 400 }
      )
    }
    if (popup.end_at && new Date(popup.end_at) < now) {
      return NextResponse.json(
        { error: { code: 'EXPIRED', message: 'Popup انتهى' } },
        { status: 400 }
      )
    }

    const name = cleanText(input.name)
    const email = cleanText(input.email)?.toLowerCase() ?? null
    const phone = cleanText(input.phone)

    if (popup.collect_name && !name) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'الاسم مطلوب' } },
        { status: 400 }
      )
    }
    if (popup.collect_email && !email) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'الإيميل مطلوب' } },
        { status: 400 }
      )
    }
    if (popup.collect_phone && !phone) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'رقم الموبايل مطلوب' } },
        { status: 400 }
      )
    }

    const sourcePath = cleanText(input.source_path)
    const userAgent = cleanText(req.headers.get('user-agent'))

    const { error } = await admin
      .from('popup_leads')
      .insert({
        popup_id: popup.id,
        name,
        email,
        phone,
        source_path: sourcePath,
        user_agent: userAgent,
      })

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: {
        message:
          typeof popup.lead_success_message === 'string' && popup.lead_success_message.trim().length > 0
            ? popup.lead_success_message
            : 'تم حفظ بياناتك بنجاح',
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: error.issues } },
        { status: 400 }
      )
    }

    console.error('[popup/lead] POST failed:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'تعذر حفظ البيانات حالياً' } },
      { status: 500 }
    )
  }
}
