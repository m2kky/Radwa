import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import {
  sendServiceLeadAdminNotificationEmail,
  sendServiceLeadConfirmationEmail,
} from '@/lib/email'

const leadSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  phone: z.string().trim().min(7).max(30),
  company: z.string().trim().optional().nullable(),
  budget: z.string().trim().optional().nullable(),
  timeline: z.string().trim().optional().nullable(),
  message: z.string().trim().min(10),
  source_path: z.string().trim().optional().nullable(),
})

function clean(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const body = await req.json()
    const input = leadSchema.parse(body)
    const admin = createAdminClient()

    const { data: service, error: serviceError } = await admin
      .from('services')
      .select('id, title, status, cta_type')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle()

    if (serviceError) throw serviceError
    if (!service || service.cta_type !== 'form') {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'الخدمة غير متاحة لاستقبال الطلبات' } },
        { status: 404 }
      )
    }

    const lead = {
      service_id: service.id,
      service_title: service.title,
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone.trim(),
      company: clean(input.company),
      budget: clean(input.budget),
      timeline: clean(input.timeline),
      message: input.message.trim(),
      source_path: clean(input.source_path),
    }

    const { error } = await admin.from('service_leads').insert(lead)
    if (error) throw error

    void sendServiceLeadAdminNotificationEmail({
      serviceTitle: service.title,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      budget: lead.budget,
      timeline: lead.timeline,
      message: lead.message,
    }).catch((emailError) => {
      console.error('[services/lead] admin email failed:', emailError)
    })

    void sendServiceLeadConfirmationEmail({
      to: lead.email,
      name: lead.name,
      serviceTitle: service.title,
    }).catch((emailError) => {
      console.error('[services/lead] confirmation email failed:', emailError)
    })

    return NextResponse.json({
      success: true,
      data: { message: 'تم إرسال طلبك بنجاح' },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: error.issues } },
        { status: 400 }
      )
    }

    console.error('[services/lead] POST failed:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'تعذر إرسال الطلب الآن' } },
      { status: 500 }
    )
  }
}
