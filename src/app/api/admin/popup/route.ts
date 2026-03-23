import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import {
  isValidPopupUrl,
  popupActionStyleValues,
  popupActionTypeValues,
  popupVariantValues,
} from '@/lib/popup'

const nullableText = (max: number) => z.string().trim().max(max).optional().nullable()

const popupActionSchema = z.object({
  id: z.string().trim().min(1).max(64).optional(),
  label: z.string().trim().min(1).max(80),
  action: z.enum(popupActionTypeValues),
  url: z.string().trim().optional().nullable(),
  style: z.enum(popupActionStyleValues).default('primary'),
  new_tab: z.boolean().default(false),
  copy_text: nullableText(80),
}).superRefine((value, ctx) => {
  if (value.action === 'link' && (!value.url || !isValidPopupUrl(value.url))) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['url'],
      message: 'رابط الزر غير صحيح',
    })
  }
})

const popupSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(140),
  message: z.string().trim().min(1).max(1200),
  cta_text: nullableText(80),
  cta_url: z.string().trim().optional().nullable().refine((value) => !value || isValidPopupUrl(value), {
    message: 'رابط CTA غير صحيح',
  }),
  image_url: z.string().trim().optional().nullable().refine((value) => !value || isValidPopupUrl(value), {
    message: 'رابط الصورة غير صحيح',
  }),
  variant: z.enum(popupVariantValues).default('spotlight'),
  discount_code: nullableText(80),
  discount_note: nullableText(140),
  actions: z.array(popupActionSchema).max(4).default([]),
  collect_name: z.boolean().default(false),
  collect_email: z.boolean().default(false),
  collect_phone: z.boolean().default(false),
  lead_title: nullableText(120),
  lead_submit_text: nullableText(50),
  lead_success_message: nullableText(200),
  is_active: z.boolean().default(false),
  show_once: z.boolean().default(true),
  start_at: z.string().datetime().optional().nullable(),
  end_at: z.string().datetime().optional().nullable(),
}).superRefine((value, ctx) => {
  if (value.collect_name && !value.collect_email && !value.collect_phone) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['collect_name'],
      message: 'لازم تختار إيميل أو موبايل على الأقل مع حقل الاسم',
    })
  }
})

const deleteSchema = z.object({
  id: z.string().uuid(),
})

function cleanText(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function normalizeActionsForSave(
  actions: z.infer<typeof popupActionSchema>[],
  fallbackDiscountCode: string | null
) {
  return actions.map((action, index) => ({
    id: cleanText(action.id) ?? `action-${index + 1}`,
    label: action.label.trim(),
    action: action.action,
    url: action.action === 'link' ? cleanText(action.url) : null,
    style: action.style,
    new_tab: action.action === 'link' ? action.new_tab : false,
    copy_text:
      action.action === 'copy_code'
        ? cleanText(action.copy_text) ?? fallbackDiscountCode
        : null,
  }))
}

function deriveLegacyCta(actions: ReturnType<typeof normalizeActionsForSave>) {
  const linkAction = actions.find((action) => action.action === 'link' && action.url)
  return {
    cta_text: linkAction?.label ?? null,
    cta_url: linkAction?.url ?? null,
  }
}

export async function GET() {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('site_popups')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error
    return NextResponse.json({ success: true, data: data ?? null })
  } catch (error) {
    console.error('[admin/popup] GET failed:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch popup settings' } },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const input = popupSchema.parse(body)
    const admin = createAdminClient()
    const normalizedActions = normalizeActionsForSave(input.actions, cleanText(input.discount_code))
    const legacyCta = deriveLegacyCta(normalizedActions)
    const payload = {
      title: input.title.trim(),
      message: input.message.trim(),
      cta_text: legacyCta.cta_text,
      cta_url: legacyCta.cta_url,
      image_url: cleanText(input.image_url),
      variant: input.variant,
      discount_code: cleanText(input.discount_code),
      discount_note: cleanText(input.discount_note),
      actions: normalizedActions,
      collect_name: input.collect_name,
      collect_email: input.collect_email,
      collect_phone: input.collect_phone,
      lead_title: cleanText(input.lead_title),
      lead_submit_text: cleanText(input.lead_submit_text),
      lead_success_message: cleanText(input.lead_success_message),
      is_active: input.is_active,
      show_once: input.show_once,
      start_at: input.start_at || null,
      end_at: input.end_at || null,
    }

    let saved: Record<string, unknown> | null = null

    if (input.id) {
      const { data, error } = await admin
        .from('site_popups')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', input.id)
        .select('*')
        .single()

      if (error) throw error
      saved = data
    } else {
      const { data, error } = await admin
        .from('site_popups')
        .insert(payload)
        .select('*')
        .single()

      if (error) throw error
      saved = data
    }

    if (saved && input.is_active) {
      await admin
        .from('site_popups')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .neq('id', String(saved.id))
    }

    return NextResponse.json({ success: true, data: saved })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: error.issues } },
        { status: 400 }
      )
    }

    console.error('[admin/popup] POST failed:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to save popup settings' } },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json()
    const { id } = deleteSchema.parse(body)
    const admin = createAdminClient()

    const { error } = await admin
      .from('site_popups')
      .delete()
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: error.issues } },
        { status: 400 }
      )
    }

    console.error('[admin/popup] DELETE failed:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete popup' } },
      { status: 500 }
    )
  }
}
