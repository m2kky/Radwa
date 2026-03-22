import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  company: z.string().optional().nullable(),
  service: z.string().min(1),
  message: z.string().min(10),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const input = schema.parse(body)

    const admin = createAdminClient()
    const { error } = await admin.from('contacts').insert({
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      company: input.company?.trim() || null,
      service: input.service.trim(),
      message: input.message.trim(),
      source: 'contact_form',
    })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: error.issues } },
        { status: 400 }
      )
    }

    console.error('[contact] POST failed:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'تعذر إرسال الرسالة الآن' } },
      { status: 500 }
    )
  }
}
