/**
 * Email Service
 * Sends transactional emails via Resend
 * 
 * All templates are localized in Arabic for a branded premium experience.
 */
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM   = process.env.RESEND_FROM_EMAIL!
const APP_URL = process.env.NEXT_PUBLIC_APP_URL!

interface DownloadEmailParams {
  to:           string
  productTitle: string
  downloadUrl:  string
}

interface InstallmentEmailParams {
  to: string
  productTitle: string
  installmentNumber: number
  totalInstallments: number
  amount: number
  nextDueDate?: string | null
}

/**
 * Sends a purchase confirmation email with the download link
 */
export async function sendDownloadEmail({ to, productTitle, downloadUrl }: DownloadEmailParams) {
  await resend.emails.send({
    from:    FROM,
    to,
    subject: `رابط التحميل الخاص بك أصبح جاهزاً — ${productTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px;direction:rtl;text-align:right;background-color:#09090b;color:#fafafa;border-radius:16px;border:1px solid #27272a">
        <h2 style="color:#2E7F7F;font-size:24px;margin-bottom:16px">تأكيد عملية الشراء ✅</h2>
        <p style="font-size:16px;line-height:1.6">أهلاً بك، شكراً لشرائك <strong>${productTitle}</strong>.</p>
        <p style="font-size:16px;line-height:1.6">اضغط على الزر أدناه لتحميل ملفك مباشرة:</p>
        <a href="${downloadUrl}"
           style="display:inline-block;background:#2E7F7F;color:#ffffff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin:24px 0">
          تحميل الملف الآن
        </a>
        <p style="color:#a1a1aa;font-size:14px;line-height:1.6;margin-top:24px">
          * هذا الرابط صالح دائماً من خلال هذا الإيميل.<br>
          * يمكنك أيضاً تحميل الملف في أي وقت من خلال 
          <a href="${APP_URL}/dashboard" style="color:#2E7F7F;text-decoration:none">لوحة التحكم</a> الخاصة بك.
        </p>
      </div>
    `,
  })
}

/**
 * Sends a verification code (OTP) for signup/login
 */
export async function sendOtpEmail(to: string, code: string) {
  await resend.emails.send({
    from:    FROM,
    to,
    subject: `كود التحقق الخاص بك — رضوى محمد`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px;direction:rtl;text-align:right;background-color:#09090b;color:#fafafa;border-radius:16px;border:1px solid #27272a">
        <h2 style="color:#2E7F7F;font-size:24px;margin-bottom:16px">رمز التحقق (OTP) 🛡️</h2>
        <p style="font-size:16px;line-height:1.6">استخدم الكود التالي لإتمام عملية تسجيل الدخول أو التسجيل في المنصة:</p>
        <div style="background:#18181b;padding:24px;border-radius:12px;margin:24px 0;text-align:center;letter-spacing:12px;font-size:36px;font-weight:bold;color:#2E7F7F;border:1px solid #27272a">
          ${code}
        </div>
        <p style="color:#a1a1aa;font-size:14px;line-height:1.6">
          هذا الكود صالح لمدة 10 دقائق فقط. إذا لم تطلب هذا الكود، يرجى تجاهل هذا الإيميل.
        </p>
      </div>
    `,
  })
}

/**
 * Sends a notification after a single installment is paid
 */
export async function sendInstallmentPaidEmail({
  to,
  productTitle,
  installmentNumber,
  totalInstallments,
  amount,
  nextDueDate,
}: InstallmentEmailParams) {
  const isLast = installmentNumber === totalInstallments
  const nextPaymentText = nextDueDate
    ? `<p style="margin:12px 0">القسط القادم مستحق في: <strong>${new Date(nextDueDate).toLocaleDateString('ar-EG')}</strong></p>`
    : ''

  await resend.emails.send({
    from: FROM,
    to,
    subject: `تم استلام القسط ${installmentNumber} من ${totalInstallments} — ${productTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px;direction:rtl;text-align:right;background-color:#09090b;color:#fafafa;border-radius:16px;border:1px solid #27272a">
        <h2 style="color:#2E7F7F;font-size:24px;margin-bottom:16px">تم استلام القسط بنجاح ✅</h2>
        <p style="font-size:16px;line-height:1.6">تم تأكيد دفع القسط رقم <strong>${installmentNumber}</strong> من أصل <strong>${totalInstallments}</strong>.</p>
        <div style="background:#18181b;padding:20px;border-radius:12px;margin:24px 0;border:1px solid #27272a">
          <p style="margin:8px 0"><strong>المنتج:</strong> ${productTitle}</p>
          <p style="margin:8px 0"><strong>مبلغ القسط:</strong> ${amount.toLocaleString('ar-EG')} ج.م</p>
          <p style="margin:8px 0"><strong>تاريخ الدفع:</strong> ${new Date().toLocaleDateString('ar-EG')}</p>
        </div>
        ${isLast ? '<p style="color:#2E7F7F;font-weight:bold;font-size:18px">🎉 تهانينا! تم سداد جميع الأقساط بالكامل.</p>' : nextPaymentText}
        <p style="color:#a1a1aa;font-size:14px;margin-top:24px">
          يمكنك متابعة حالة اشتراكاتك دائماً من 
          <a href="${APP_URL}/dashboard" style="color:#2E7F7F;text-decoration:none">لوحة التحكم</a>.
        </p>
      </div>
    `,
  })
}

/**
 * Sends a reminder before an installment is due
 */
export async function sendInstallmentReminderEmail({
  to,
  productTitle,
  installmentNumber,
  totalInstallments,
  amount,
  dueDate,
}: InstallmentEmailParams & { dueDate: string }) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: `تذكير: موعد القسط ${installmentNumber} يقترب — ${productTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px;direction:rtl;text-align:right;background-color:#09090b;color:#fafafa;border-radius:16px;border:1px solid #27272a">
        <h2 style="color:#F59E0B;font-size:24px;margin-bottom:16px">⏰ تذكير بموعد القسط</h2>
        <p style="font-size:16px;line-height:1.6">نود تذكيرك بأن موعد القسط القادم هو قريباً:</p>
        <div style="background:#fffbeb10;padding:20px;border-radius:12px;margin:24px 0;border:1px solid #F59E0B50;border-right:4px solid #F59E0B">
          <p style="margin:8px 0;color:#fafafa"><strong>المنتج:</strong> ${productTitle}</p>
          <p style="margin:8px 0;color:#fafafa"><strong>رقم القسط:</strong> ${installmentNumber} من ${totalInstallments}</p>
          <p style="margin:8px 0;color:#fafafa"><strong>المبلغ المطلوب:</strong> ${amount.toLocaleString('ar-EG')} ج.م</p>
          <p style="margin:8px 0;color:#fafafa"><strong>تاريخ الاستحقاق:</strong> ${new Date(dueDate).toLocaleDateString('ar-EG')}</p>
        </div>
        <a href="${APP_URL}/dashboard"
           style="display:inline-block;background:#2E7F7F;color:#ffffff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">
          ادفع القسط الآن
        </a>
        <p style="color:#a1a1aa;font-size:14px;margin-top:24px">
          يرجى السداد في الموعد لتجنب توقف الوصول للمحتوى.
        </p>
      </div>
    `,
  })
}
