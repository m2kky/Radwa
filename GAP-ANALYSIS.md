# 🔎 تحليل الفجوات الشامل — Radwa v2

> **التاريخ:** 13 مارس 2026  
> **الهدف:** مراجعة كل الدوكيومنتيشن والسيناريوهات عشان نتأكد مفيش حاجة منسية قبل الشغل

---

## 🔴 1. تعارض ملفات الـ Schema (أخطر مشكلة)

المشروع فيه **4 ملفات SQL** متعارضة، ومفيش حد يعرف أنهي واحد اللي فعلاً شغال في Supabase:

| الملف | المحتوى | المشكلة |
|-------|---------|---------|
| `01-schema.sql` | 6 جداول + indexes + RLS ✅ | **الأكمل** — فيه `meta_title`, `min_amount`, `gateway_order_id` في installments |
| `02-migrate.sql` | Migration من v1 | مش schema، ده بيانات |
| `03-student-otp-schema.sql` | `user_progress` + `user_enrollments` + triggers | **لم يُستخدم أبداً في الكود** ❌ |
| `v2-final-schema.sql` | 7 جداول (بدون indexes كثيرة) | **ناقص** — مفيهوش `meta_title`, كوبونات ناقصة, installments ناقصة |

> [!CAUTION]
> **لازم نحدد: أنهي schema هو اللي deployed فعلاً في Supabase؟** لأن الكود يقرأ/يكتب أعمدة ممكن تكون مش موجودة.

### الأعمدة اللي الكود يستخدمها لكن `v2-final-schema.sql` مفيهاش:

| الجدول | العمود | الكود اللي يستخدمه |
|--------|--------|-------------------|
| `products` | `meta_title`, `meta_description` | `shop/[slug]/page.tsx` + admin product form |
| `installment_payments` | `gateway_order_id`, `gateway_txn_id` | Paymob + EasyKash webhooks |
| `coupons` | `min_amount`, `max_discount`, `product_id`, `valid_from`, `valid_until` | `check-coupon/route.ts` |

### جداول معرّفة في SQL لكن **الكود مش بيستخدمها**:

| الجدول | في أي ملف | السبب |
|--------|-----------|-------|
| `user_progress` | `03-student-otp-schema.sql` | مفيش video player ولا lesson tracking |
| `user_enrollments` | `03-student-otp-schema.sql` | مفيش enrollment UI |
| `verification_otps` | `v2-final-schema.sql` | ✅ ده بيُستخدم فعلاً |

---

## 🔴 2. سيناريوهات مفقودة (User Flows)

### 2.1 🚨 كلمة المرور في الـ URL

```
/verify-otp?email=test@mail.com&name=Ahmed&p=cGFzc3dvcmQxMjM=
```

- كلمة المرور بتتنقل عبر URL كـ **base64** (مش تشفير حقيقي!)
- `btoa("password123")` = `cGFzc3dvcmQxMjM=` — أي حد يشوف الـ URL يقدر يفك الكود
- بتتسجل في browser history + server logs + analytics
- **الحل:** استخدام `sessionStorage` أو server-side session/Redis

### 2.2 🚨 صفحة نسيت كلمة المرور فاضية

```
src/app/(auth)/forgot-password/   ← مجلد فاضي تماماً
```

- مفيش صفحة reset password
- مفيش API endpoint لإرسال رابط إعادة التعيين
- الـ CHANGELOG بيقول: "Password recovery flow is in progress" — لكن مفيش أي شغل عليها

### 2.3 ❌ الـ Contact Form مفيش Backend

`components/home/contact-form.tsx` فيه form كامل بـ Zod validation لكن:
- مفيش API endpoint `/api/contact`
- الـ form بيعمل `console.log(data)` بس
- الفورم بيعرض "تم إرسال رسالتك" لكن مفيش رسالة بتروح فعلاً

### 2.4 ❌ Google OAuth بعد التسجيل

- Login page فيه زرار Google
- لكن Signup page **مفيهوش** Google as register option
- المستخدم اللي يسجل بـ Google لأول مرة — هل حسابه بينتشئ صح في `public.users`؟
  - ✅ أيوه، لأن فيه trigger `handle_new_user` بيعمل INSERT

### 2.5 ❌ سيناريو الدفع → Redirect للموقع

**Paymob Flow:**
1. User يضغط "ادفع" → API ينشئ order + يرجع iframe URL
2. User يدفع في Paymob iframe
3. Paymob يعمل redirect لـ `NEXT_PUBLIC_APP_URL/success?order_id=...`

**المشكلة:** صفحة `/success` تنتظر `?token=<download_token>` لكن:
- الـ token بينتشئ في `confirmPayment()` بعد الـ webhook
- الـ webhook ممكن يأخر عن الـ redirect
- **Race condition:** المستخدم يوصل لصفحة success قبل ما الـ webhook ينتهي → "رابط غير موجود"

### 2.6 ❌ Guest Checkout → Dashboard

- Guest بيشتري بدون حساب → بيحصل على email بالتحميل ✅
- لكن لو Guest عمل حساب بعدين بنفس الإيميل → **مشترياته القديمة مش مربوطة بحسابه**
- مفيش logic لربط `orders.guest_email` بـ `user_id` عند التسجيل

### 2.7 ❌ Admin مش بيتحقق من Role في Layout

```typescript
// admin/layout.tsx
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect('/login')
// ← مفيش تحقق من admin role!
```

- الـ middleware بيتحقق من `app_metadata.role === 'admin'` ✅
- لكن الـ layout مش بيتحقق — لو حد bypass الـ middleware هيشوف الـ admin pages
- **مش خطير** لأن الـ API routes محمية، لكن UI exposure ممكن يكشف معلومات

---

## 🟡 3. تناقضات التوثيق

### 3.1 README.md = Default Next.js Template

```markdown
This is a [Next.js](https://nextjs.org) project bootstrapped with `create-next-app`.
```

- **مفيش أي معلومة عن المشروع** — لا setup instructions, لا architecture, لا env vars
- مفيش `.env.example` يوضح المتغيرات المطلوبة

### 3.2 ملفين IMPLEMENTATION-LOG متعارضين

| الملف | المحتوى |
|-------|---------|
| `/IMPLEMENTATION-LOG.md` | Session واحد (DB & Auth Foundation) |
| `/logs1/IMPLEMENTATION-LOG.md` | 7 Sessions كاملين (الأصلي) |

- الملف في الـ root هو **نسخة جزئية** من الملف في `logs1/`
- مربك — أيهم المعتمد؟

### 3.3 TODO.md مش محدّث

| في الـ TODO | الحقيقة |
|-------------|---------|
| "Blog admin (CRUD) — بعدين" | ✅ **موجود فعلاً** في `api/admin/blog/` |
| "Installment payments flow — بعدين" | ✅ **موجود فعلاً** في `api/installments/pay/` |
| لا يذكر OTP Flow | ✅ **موجود** — Session 1 في IMPLEMENTATION-LOG |
| لا يذكر Blog Admin Routes | ✅ **موجود** — Phase 5 API routes |

### 3.4 CHANGELOG فيه إصدار واحد بس

- `v0.2.0` فقط (Auth + OTP + RLS)
- **الـ 6 sessions السابقة** مفيلهاش entries في الـ CHANGELOG
- عدم تأريخ الإصدارات الباقية

---

## 🟡 4. Edge Cases ومسارات لم تُختبر

### 4.1 ❌ الدفع بالمحفظة (Wallet)

```typescript
// paymob.ts
export async function initiatePaymob(data: PaymentData, method: 'card' | 'wallet')
```

- الكود يستقبل `method` لكن **مش بيفرق** بين card و wallet
- `PAYMOB_INTEGRATION_ID_CARD` هو الوحيد المستخدم
- **Wallet يحتاج `integration_id` مختلف** ومش موجود في `.env.local`

### 4.2 ❌ منتج بدون ملفات

لو Admin أضاف product بدون files:
- Order بيكتمل عادي ✅
- Download token بينتشئ ✅
- لكن R2 URL هيفشل لأن `file_path` مش موجود ← **500 error بدون رسالة مفيدة**

### 4.3 ❌ كوبون على منتج محذوف

```sql
product_id UUID REFERENCES products(id) ON DELETE CASCADE
```

- لو حذفنا منتج، كل الكوبونات المرتبطة **هتتحذف** تلقائياً
- مفيش soft delete للمنتجات — `DELETE` بيحذف فعلياً (لكن الطلبات القديمة `ON DELETE RESTRICT` على orders)

### 4.4 ❌ تسجيل OTP بدون password validation

```typescript
// signup page يمنع < 8 chars via HTML
<Input type="password" required minLength={8} />
```

- المنع client-side فقط
- الـ API `/api/auth/signup` **مش بيتحقق من قوة كلمة المرور**
- `/api/auth/verify-otp` بيبعتها لـ Supabase Auth اللي يمنع < 6 chars فقط

### 4.5 ❌ OTP Resend بدون Cooldown

```typescript
// verify-otp page
async function handleResend() {
  await fetch('/api/auth/signup', { method: 'POST', body: ... })
}
```

- مفيش cooldown — المستخدم يقدر يضغط "إرسال مرة أخرى" مليون مرة
- كل ضغطة = email جديد عبر Resend ($$)
- مفيش حذف للـ OTP القديم عند إرسال OTP جديد

### 4.6 ❌ Admin لا يستطيع تعديل Blog Posts

- `api/admin/blog/route.ts` → GET + POST ✅
- `api/admin/blog/[id]/route.ts` → GET + PATCH + DELETE ✅  
- لكن **مفيش صفحة Admin لتعديل Blog Post** — فقط `blog/` page
- لا يوجد `admin/blog/[id]/edit/page.tsx`

---

## 🟡 5. ملفات ميتة وأكواد يتيمة

| الملف/المجلد | الحالة |
|-------------|--------|
| `src/lib/validations/` | مجلد فاضي تماماً |
| `src/app/(auth)/forgot-password/` | مجلد فاضي تماماً |
| `scripts/apply-schema.ts` | Script لا يعمل — يطبع error ويخرج |
| `database/v2-final-schema.sql` | نسخة ناقصة من `01-schema.sql` |
| `database/03-student-otp-schema.sql` | جداول/triggers لا يستخدمها الكود |
| `public/file.svg`, `globe.svg`, `window.svg` | SVGs default من Next.js — مش مستخدمة |
| `README.md` | Template default — لا يصف المشروع |

---

## 🟡 6. Config ومشاكل Build

| المشكلة | التفاصيل |
|---------|----------|
| `NODE_PATH` hardcoded | مسار Linux شخصي في `package.json` |
| `components.json` → `rtl: false` | المشروع عربي RTL لكن Shadcn مش مضبوط عليه |
| `next.config.ts` → `serverComponentsExternalPackages` | `experimental` API — ممكن يتغير في Next.js updates |
| Tailwind v4 | الـ logs تقول v4 لكن `postcss.config.mjs` عادي — تأكد إنه فعلاً v4 |

---

## 📋 ملخص: كل حاجة لازم تتعمل قبل الشغل

### 🔴 حرج (لازم يتحل أول حاجة)

1. **تحديد الـ Schema الصح** — أنهي SQL file هو المعتمد؟ يا `01` يا `v2-final`
2. **حذف كلمة المرور من URL** — استخدام sessionStorage بديل
3. **إضافة Rate Limiting** — على auth endpoints على الأقل
4. **إصلاح Race Condition** في صفحة Success — polling أو webhook notification

### 🟡 مهم

5. **توحيد التوثيق** — ملف IMPLEMENTATION-LOG واحد، README حقيقي، .env.example
6. **تحديث TODO.md** — يعكس الحالة الحقيقية للمشروع
7. **إضافة صفحة Forgot Password**
8. **إضافة API لـ Contact Form**
9. **ربط Guest Orders بالحساب** عند التسجيل
10. **إضافة صفحة Edit Blog Post** في Admin
11. **إصلاح payment method** (wallet vs card) في Paymob
12. **إضافة OTP Cooldown** timer

### 🟢 تحسينات

13. **حذف الملفات الميتة** (validations/, forgot-password/, default SVGs)
14. **مزامنة CHANGELOG** مع كل الإصدارات
15. **إصلاح `components.json`** → `rtl: true`
16. **إنشاء `.env.example`** بكل المتغيرات المطلوبة (بدون قيم)
17. **Admin Layout** — تحقق من role مش بس authentication

---

> [!IMPORTANT]
> **النقطة 1 (تحديد الـ Schema)** هي أهم حاجة — لأن لو الكود يكتب على أعمدة مش موجودة، كل حاجة تانية مش هتفرق.
