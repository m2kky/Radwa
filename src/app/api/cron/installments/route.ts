/**
 * Installments Cron
 *
 * Daily/hourly job:
 * 1) marks late pending installments as overdue
 * 2) sends due-date reminders
 * 3) sends first overdue notice
 * 4) suspends orders with overdue installments
 *
 * Configure with Vercel Cron + CRON_SECRET.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendInstallmentReminderEmail } from '@/lib/email'

interface InstallmentWithOrder {
  id: string
  order_id: string
  user_id: string
  amount: number
  due_date: string
  status: string
  orders:
    | {
        installment_plan?: string | null
        products?: { title?: string | null } | { title?: string | null }[] | null
      }
    | {
        installment_plan?: string | null
        products?: { title?: string | null } | { title?: string | null }[] | null
      }[]
    | null
}

function getCairoDateString(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Cairo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function getOrderMeta(row: InstallmentWithOrder) {
  const order = Array.isArray(row.orders) ? row.orders[0] : row.orders
  const product = Array.isArray(order?.products) ? order.products[0] : order?.products
  const totalInstallments = Number.parseInt(String(order?.installment_plan || '1'), 10) || 1
  return {
    title: product?.title || 'المنتج',
    totalInstallments,
  }
}

function getInstallmentNumber(
  installmentId: string,
  orderId: string,
  scheduleByOrder: Map<string, { id: string; due_date: string }[]>
): number {
  const schedule = scheduleByOrder.get(orderId) ?? []
  const index = schedule.findIndex((item) => item.id === installmentId)
  if (index < 0) return 2
  return index + 2 // first down payment happens at checkout
}

function assertCronAuth(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return process.env.NODE_ENV !== 'production'

  const auth = req.headers.get('authorization')
  return auth === `Bearer ${secret}`
}

export async function GET(req: NextRequest) {
  if (!assertCronAuth(req)) {
    const hasSecret = Boolean(process.env.CRON_SECRET)
    return NextResponse.json(
      { error: hasSecret ? 'Unauthorized' : 'CRON_SECRET is missing in production' },
      { status: hasSecret ? 401 : 500 }
    )
  }

  try {
    const admin = createAdminClient()
    const today = getCairoDateString()
    const nowIso = new Date().toISOString()

    // 1) Mark late pending installments as overdue.
    const { data: newlyOverdue } = await admin
      .from('installment_payments')
      .update({ status: 'overdue' })
      .eq('status', 'pending')
      .lt('due_date', today)
      .select('id, order_id')

    // 2) Load installments that need due reminder (once).
    const { data: dueTodayRows } = await admin
      .from('installment_payments')
      .select('id, order_id, user_id, amount, due_date, status, orders(installment_plan, products(title))')
      .eq('status', 'pending')
      .eq('due_date', today)
      .is('due_reminder_sent_at', null)
      .returns<InstallmentWithOrder[]>()

    // 3) Load installments that need first overdue notice (once).
    const { data: overdueRows } = await admin
      .from('installment_payments')
      .select('id, order_id, user_id, amount, due_date, status, orders(installment_plan, products(title))')
      .eq('status', 'overdue')
      .is('overdue_notice_sent_at', null)
      .returns<InstallmentWithOrder[]>()

    const dueRows = dueTodayRows ?? []
    const overdueNotifiedRows = overdueRows ?? []
    const orderIds = Array.from(
      new Set([...dueRows, ...overdueNotifiedRows].map((row) => row.order_id))
    )

    const scheduleByOrder = new Map<string, { id: string; due_date: string }[]>()
    if (orderIds.length > 0) {
      const { data: scheduleRows } = await admin
        .from('installment_payments')
        .select('id, order_id, due_date')
        .in('order_id', orderIds)
        .order('due_date', { ascending: true })

      for (const row of scheduleRows ?? []) {
        const list = scheduleByOrder.get(row.order_id) ?? []
        list.push({ id: row.id, due_date: row.due_date })
        scheduleByOrder.set(row.order_id, list)
      }
    }

    const userEmailCache = new Map<string, string | null>()
    const getUserEmail = async (userId: string): Promise<string | null> => {
      if (userEmailCache.has(userId)) return userEmailCache.get(userId) ?? null
      const { data } = await admin.auth.admin.getUserById(userId)
      const email = data.user?.email ?? null
      userEmailCache.set(userId, email)
      return email
    }

    const sentDueReminderIds: string[] = []
    for (const row of dueRows) {
      try {
        const email = await getUserEmail(row.user_id)
        if (!email) continue

        const meta = getOrderMeta(row)
        const installmentNumber = getInstallmentNumber(row.id, row.order_id, scheduleByOrder)
        await sendInstallmentReminderEmail({
          to: email,
          productTitle: meta.title,
          installmentNumber,
          totalInstallments: meta.totalInstallments,
          amount: Number(row.amount),
          dueDate: row.due_date,
        })
        sentDueReminderIds.push(row.id)
      } catch (error) {
        console.error('[cron/installments] due reminder failed', row.id, error)
      }
    }

    const sentOverdueNoticeIds: string[] = []
    for (const row of overdueNotifiedRows) {
      try {
        const email = await getUserEmail(row.user_id)
        if (!email) continue

        const meta = getOrderMeta(row)
        const installmentNumber = getInstallmentNumber(row.id, row.order_id, scheduleByOrder)
        await sendInstallmentReminderEmail({
          to: email,
          productTitle: meta.title,
          installmentNumber,
          totalInstallments: meta.totalInstallments,
          amount: Number(row.amount),
          dueDate: row.due_date,
        })
        sentOverdueNoticeIds.push(row.id)
      } catch (error) {
        console.error('[cron/installments] overdue notice failed', row.id, error)
      }
    }

    if (sentDueReminderIds.length > 0) {
      await admin
        .from('installment_payments')
        .update({ due_reminder_sent_at: nowIso })
        .in('id', sentDueReminderIds)
    }

    if (sentOverdueNoticeIds.length > 0) {
      await admin
        .from('installment_payments')
        .update({ overdue_notice_sent_at: nowIso })
        .in('id', sentOverdueNoticeIds)
    }

    // 4) Keep orders with overdue installments suspended.
    const { data: overdueOrderRows } = await admin
      .from('installment_payments')
      .select('order_id')
      .eq('status', 'overdue')

    const suspendedOrderIds = Array.from(
      new Set((overdueOrderRows ?? []).map((row) => row.order_id))
    )
    if (suspendedOrderIds.length > 0) {
      await admin
        .from('orders')
        .update({ status: 'suspended' })
        .in('id', suspendedOrderIds)
        .in('status', ['completed', 'pending'])
    }

    return NextResponse.json({
      success: true,
      data: {
        date: today,
        newly_overdue: newlyOverdue?.length ?? 0,
        due_reminders_sent: sentDueReminderIds.length,
        overdue_notices_sent: sentOverdueNoticeIds.length,
        suspended_orders_updated: suspendedOrderIds.length,
      },
    })
  } catch (error) {
    console.error('[cron/installments] unexpected error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to process installment cron' } },
      { status: 500 }
    )
  }
}
