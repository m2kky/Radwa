/**
 * Email Service
 * Transactional emails via Resend.
 */
import { Resend } from 'resend'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.radwamuhammed.com'
const FROM = process.env.RESEND_FROM_EMAIL || process.env.RESEND_FROM || ''
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || process.env.BUSINESS_EMAIL || ''

let resendClient: Resend | null = null

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || !FROM) return null
  if (!resendClient) resendClient = new Resend(apiKey)
  return resendClient
}

async function sendEmail(params: {
  to: string | string[]
  subject: string
  html: string
}) {
  const client = getResendClient()
  if (!client) {
    console.warn('[email] skipped send: RESEND_API_KEY or FROM is missing')
    return
  }

  await client.emails.send({
    from: FROM,
    to: params.to,
    subject: params.subject,
    html: params.html,
  })
}

function shell(title: string, body: string): string {
  return `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Arial,sans-serif;max-width:620px;margin:0 auto;padding:28px;direction:rtl;text-align:right;background:#09090b;color:#f4f4f5;border-radius:16px;border:1px solid #27272a">
      <h2 style="color:#2E7F7F;font-size:24px;margin:0 0 16px">${title}</h2>
      <div style="font-size:15px;line-height:1.9;color:#f4f4f5">${body}</div>
      <div style="margin-top:24px;padding-top:14px;border-top:1px solid #27272a;color:#a1a1aa;font-size:12px">
        منصة رضوى محمد
      </div>
    </div>
  `
}

interface DownloadEmailParams {
  to: string
  productTitle: string
  downloadUrl: string
}

interface InstallmentEmailParams {
  to: string
  productTitle: string
  installmentNumber: number
  totalInstallments: number
  amount: number
  nextDueDate?: string | null
}

interface BookingEmailParams {
  to: string
  clientName: string
  eventTitle: string
  bookingDate: string
  startTime: string
  endTime: string
  meetingLink?: string | null
  amount?: number
  isPaid?: boolean
}

interface KycStatusEmailParams {
  to: string
  name?: string
  status: 'approved' | 'rejected'
  reason?: string | null
}

export async function sendDownloadEmail({
  to,
  productTitle,
  downloadUrl,
}: DownloadEmailParams) {
  await sendEmail({
    to,
    subject: `رابط التحميل جاهز — ${productTitle}`,
    html: shell(
      'تأكيد الشراء',
      `
        <p>شكرًا لشرائك <strong>${productTitle}</strong>.</p>
        <p>يمكنك التحميل مباشرة عبر الزر التالي:</p>
        <p style="margin:20px 0">
          <a href="${downloadUrl}" style="display:inline-block;background:#2E7F7F;color:#fff;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:700">
            تحميل الملف
          </a>
        </p>
        <p>كما يمكنك مراجعة كل طلباتك من <a href="${APP_URL}/dashboard" style="color:#2E7F7F;text-decoration:none">لوحة التحكم</a>.</p>
      `
    ),
  })
}

export async function sendOtpEmail(to: string, code: string) {
  await sendEmail({
    to,
    subject: 'رمز التحقق (OTP) — رضوى محمد',
    html: shell(
      'رمز التحقق',
      `
        <p>استخدم الكود التالي لإتمام العملية:</p>
        <div style="background:#18181b;border:1px solid #27272a;border-radius:12px;padding:18px;text-align:center;font-size:34px;letter-spacing:10px;font-weight:800;color:#2E7F7F;margin:18px 0">
          ${code}
        </div>
        <p>الكود صالح لمدة 10 دقائق.</p>
      `
    ),
  })
}

export async function sendInstallmentPaidEmail({
  to,
  productTitle,
  installmentNumber,
  totalInstallments,
  amount,
  nextDueDate,
}: InstallmentEmailParams) {
  const isLast = installmentNumber === totalInstallments
  await sendEmail({
    to,
    subject: `تم استلام القسط ${installmentNumber} من ${totalInstallments} — ${productTitle}`,
    html: shell(
      'تم استلام القسط بنجاح',
      `
        <p>تم تأكيد دفع القسط رقم <strong>${installmentNumber}</strong> من أصل <strong>${totalInstallments}</strong>.</p>
        <p><strong>المبلغ:</strong> ${amount.toLocaleString('ar-EG')} ج.م</p>
        ${
          isLast
            ? '<p style="color:#2E7F7F;font-weight:700">تم سداد جميع الأقساط بالكامل.</p>'
            : nextDueDate
              ? `<p>موعد القسط القادم: <strong>${new Date(nextDueDate).toLocaleDateString('ar-EG')}</strong></p>`
              : ''
        }
      `
    ),
  })
}

export async function sendInstallmentReminderEmail({
  to,
  productTitle,
  installmentNumber,
  totalInstallments,
  amount,
  dueDate,
}: InstallmentEmailParams & { dueDate: string }) {
  await sendEmail({
    to,
    subject: `تذكير بسداد القسط ${installmentNumber} — ${productTitle}`,
    html: shell(
      'تذكير بموعد القسط',
      `
        <p>هذا تذكير بسداد القسط رقم <strong>${installmentNumber}</strong> من أصل <strong>${totalInstallments}</strong>.</p>
        <p><strong>المبلغ:</strong> ${amount.toLocaleString('ar-EG')} ج.م</p>
        <p><strong>تاريخ الاستحقاق:</strong> ${new Date(dueDate).toLocaleDateString('ar-EG')}</p>
        <p style="margin-top:16px">
          <a href="${APP_URL}/dashboard" style="color:#2E7F7F;text-decoration:none">الانتقال للداشبورد</a>
        </p>
      `
    ),
  })
}

export async function sendKycSubmittedEmail(to: string, name?: string | null) {
  await sendEmail({
    to,
    subject: 'تم استلام طلب تفعيل التقسيط (KYC)',
    html: shell(
      'تم استلام طلب KYC',
      `
        <p>مرحبًا ${name || ''}، تم استلام طلب تفعيل التقسيط والمستندات بنجاح.</p>
        <p>سيتم مراجعة الطلب والرد عليك خلال أقرب وقت.</p>
      `
    ),
  })
}

export async function sendKycStatusEmail({
  to,
  name,
  status,
  reason,
}: KycStatusEmailParams) {
  const approved = status === 'approved'
  await sendEmail({
    to,
    subject: approved ? 'تمت الموافقة على طلب التقسيط' : 'تحديث طلب التقسيط',
    html: shell(
      approved ? 'تمت الموافقة على طلبك' : 'تم تحديث طلب التقسيط',
      approved
        ? `
            <p>مرحبًا ${name || ''}، تم قبول طلب KYC الخاص بك.</p>
            <p>يمكنك الآن استخدام خيار التقسيط أثناء الدفع.</p>
            <p><a href="${APP_URL}/shop" style="color:#2E7F7F;text-decoration:none">الذهاب للمتجر</a></p>
          `
        : `
            <p>مرحبًا ${name || ''}، تم رفض طلب KYC الحالي.</p>
            ${reason ? `<p><strong>السبب:</strong> ${reason}</p>` : ''}
            <p>يرجى تعديل المستندات وإعادة التقديم من <a href="${APP_URL}/dashboard/kyc" style="color:#2E7F7F;text-decoration:none">صفحة KYC</a>.</p>
          `
    ),
  })
}

export async function sendBookingConfirmationEmail({
  to,
  clientName,
  eventTitle,
  bookingDate,
  startTime,
  endTime,
  meetingLink,
  amount = 0,
  isPaid = true,
}: BookingEmailParams) {
  await sendEmail({
    to,
    subject: `تم تأكيد الحجز — ${eventTitle}`,
    html: shell(
      'تأكيد حجز الاستشارة',
      `
        <p>مرحبًا ${clientName}، تم تأكيد حجزك بنجاح.</p>
        <p><strong>نوع الجلسة:</strong> ${eventTitle}</p>
        <p><strong>التاريخ:</strong> ${new Date(bookingDate).toLocaleDateString('ar-EG')}</p>
        <p><strong>الوقت:</strong> ${startTime} - ${endTime}</p>
        <p><strong>حالة الدفع:</strong> ${isPaid ? 'تم الدفع' : 'في انتظار الدفع'}</p>
        ${amount > 0 ? `<p><strong>المبلغ:</strong> ${amount.toLocaleString('ar-EG')} ج.م</p>` : ''}
        ${meetingLink ? `<p><strong>رابط الجلسة:</strong> <a href="${meetingLink}" style="color:#2E7F7F;text-decoration:none">${meetingLink}</a></p>` : '<p>سيتم مشاركة تفاصيل الاتصال قبل موعد الجلسة.</p>'}
      `
    ),
  })
}

export async function sendBookingAdminNotificationEmail(params: {
  clientName: string
  clientEmail: string
  clientPhone?: string | null
  eventTitle: string
  bookingDate: string
  startTime: string
  endTime: string
  meetingLink?: string | null
  amount?: number
}) {
  if (!NOTIFY_EMAIL) return

  await sendEmail({
    to: NOTIFY_EMAIL,
    subject: `حجز جديد: ${params.eventTitle}`,
    html: shell(
      'إشعار حجز جديد',
      `
        <p>تم تسجيل حجز استشارة جديد.</p>
        <p><strong>العميل:</strong> ${params.clientName}</p>
        <p><strong>الإيميل:</strong> ${params.clientEmail}</p>
        <p><strong>الموبايل:</strong> ${params.clientPhone || '—'}</p>
        <p><strong>الجلسة:</strong> ${params.eventTitle}</p>
        <p><strong>التاريخ:</strong> ${new Date(params.bookingDate).toLocaleDateString('ar-EG')}</p>
        <p><strong>الوقت:</strong> ${params.startTime} - ${params.endTime}</p>
        ${params.amount && params.amount > 0 ? `<p><strong>المدفوع:</strong> ${params.amount.toLocaleString('ar-EG')} ج.م</p>` : ''}
        ${params.meetingLink ? `<p><strong>رابط الجلسة:</strong> <a href="${params.meetingLink}" style="color:#2E7F7F;text-decoration:none">${params.meetingLink}</a></p>` : ''}
      `
    ),
  })
}

export async function sendBookingReminderEmail(params: {
  to: string
  clientName: string
  eventTitle: string
  bookingDate: string
  startTime: string
  endTime: string
  meetingLink?: string | null
}) {
  await sendEmail({
    to: params.to,
    subject: `تذكير بموعد الجلسة — ${params.eventTitle}`,
    html: shell(
      'تذكير بموعد الجلسة',
      `
        <p>مرحبًا ${params.clientName}، هذا تذكير بموعد جلستك القادمة.</p>
        <p><strong>الجلسة:</strong> ${params.eventTitle}</p>
        <p><strong>التاريخ:</strong> ${new Date(params.bookingDate).toLocaleDateString('ar-EG')}</p>
        <p><strong>الوقت:</strong> ${params.startTime} - ${params.endTime}</p>
        ${params.meetingLink ? `<p><strong>رابط الجلسة:</strong> <a href="${params.meetingLink}" style="color:#2E7F7F;text-decoration:none">${params.meetingLink}</a></p>` : ''}
      `
    ),
  })
}

export async function sendBookingFollowupEmail(params: {
  to: string
  clientName: string
  eventTitle: string
}) {
  await sendEmail({
    to: params.to,
    subject: `شكرًا لحضور جلسة ${params.eventTitle}`,
    html: shell(
      'متابعة بعد الجلسة',
      `
        <p>مرحبًا ${params.clientName}، شكرًا لوقتك في جلسة <strong>${params.eventTitle}</strong>.</p>
        <p>إذا احتجت متابعة إضافية أو جلسة جديدة، يمكنك الحجز مباشرة من صفحة الحجز.</p>
        <p><a href="${APP_URL}/book" style="color:#2E7F7F;text-decoration:none">الذهاب لصفحة الحجز</a></p>
      `
    ),
  })
}

export async function sendKycAdminNotificationEmail(params: {
  userEmail: string
  userName?: string | null
}) {
  if (!NOTIFY_EMAIL) return

  await sendEmail({
    to: NOTIFY_EMAIL,
    subject: 'طلب KYC جديد',
    html: shell(
      'إشعار طلب KYC',
      `
        <p>تم استلام طلب KYC جديد.</p>
        <p><strong>الاسم:</strong> ${params.userName || '—'}</p>
        <p><strong>الإيميل:</strong> ${params.userEmail}</p>
        <p><a href="${APP_URL}/admin/kyc" style="color:#2E7F7F;text-decoration:none">الذهاب لصفحة المراجعة</a></p>
      `
    ),
  })
}
