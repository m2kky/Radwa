# API Reference — Radwa v2

> كل الـ APIs تتبع نفس الـ format:
> - ✅ Success: `{ success: true, data: {...} }`
> - ❌ Error: `{ error: { code: "ERROR_CODE", message: "..." } }`

---

## Auth APIs

### `POST /api/auth/signup`
**Auth:** لا يحتاج | **File:** `src/app/api/auth/signup/route.ts`

**Body:**
```json
{ "email": "user@example.com", "name": "Ahmed" }
```

**Flow:** يتحقق إن الإيميل مش مسجل → يولّد OTP من 6 أرقام → يخزنه في `verification_otps` → يبعته بالإيميل عبر Resend.

**Responses:** `200` OTP sent | `400` USER_EXISTS / VALIDATION_ERROR

---

### `POST /api/auth/verify-otp`
**Auth:** لا يحتاج | **File:** `src/app/api/auth/verify-otp/route.ts`

**Body:**
```json
{ "email": "user@example.com", "name": "Ahmed", "code": "123456", "password": "min8chars" }
```

**Flow:** يتحقق من الكود (صالح + غير مستخدم + غير منتهي) → ينشئ المستخدم في `auth.users` → trigger يعمل record في `public.users`.

**Responses:** `200` Created | `400` INVALID_OTP / VALIDATION_ERROR

---

### `GET /api/auth/callback`
**Auth:** لا يحتاج | **File:** `src/app/api/auth/callback/route.ts`

**Query:** `?code=xxx&next=/dashboard`

**Flow:** يستقبل redirect من Google OAuth → يبدّل الـ code بـ session → redirect للـ dashboard.

---

### `POST /api/auth/logout`
**Auth:** مطلوب | **File:** `src/app/api/auth/logout/route.ts`

**Flow:** يعمل sign out → redirect للـ homepage.

---

## Checkout APIs

### `POST /api/checkout`
**Auth:** اختياري (guest/authenticated) | **File:** `src/app/api/checkout/route.ts`

**Body:**
```json
{
  "product_id": "uuid",
  "payment_method": "card | wallet",
  "installment_plan": "full | 2 | 4",
  "coupon_code": "SAVE20",
  "customer": { "name": "Ahmed", "email": "a@b.com", "phone": "01234567890" }
}
```

**Flow:**
1. Validate input → Fetch product → Check installment eligibility
2. Check duplicate purchase (authenticated users)
3. Apply coupon (validate dates, limits, product scope)
4. Create pending order → Initiate payment gateway
5. Return `payment_url`

**Responses:** `200` payment_url | `400` VALIDATION / INSTALLMENTS_DISABLED | `401` AUTH_REQUIRED | `404` NOT_FOUND | `409` ALREADY_PURCHASED

---

### `POST /api/checkout/check-coupon`
**Auth:** لا يحتاج | **File:** `src/app/api/checkout/check-coupon/route.ts`

**Body:**
```json
{ "code": "SAVE20", "product_id": "uuid", "amount": 500 }
```

**Flow:** يتحقق من الكود (active, valid dates, usage limit, product scope, min amount) → يحسب الخصم.

**Responses:** `200` discount_amount | `400` COUPON_EXPIRED / EXHAUSTED / NOT_APPLICABLE / BELOW_MIN | `404` INVALID_COUPON

---

## Download API

### `GET /api/download/[token]`
**Auth:** لا يحتاج (الـ token هو الـ auth) | **File:** `src/app/api/download/[token]/route.ts`

**Flow:** يتحقق من الـ token (صالح + غير منتهي + عدد التحميلات < الحد) → optimistic lock على `download_count` → يعمل signed URL من R2 (5 دقائق) → redirect.

**Responses:** `302` redirect to R2 | `404` invalid token | `410` expired/exhausted

---

## Installments API

### `POST /api/installments/pay`
**Auth:** مطلوب | **File:** `src/app/api/installments/pay/route.ts`

**Body:**
```json
{ "installment_id": "uuid", "payment_method": "card | wallet" }
```

**Flow:** يتحقق من الـ auth → يجيب القسط (pending + belongs to user) → يبدأ الدفع.

**Responses:** `200` payment_url | `401` UNAUTHORIZED | `404` NOT_FOUND

### `POST /api/installments/kyc`
**Auth:** مطلوب | **File:** `src/app/api/installments/kyc/route.ts`

**Body:**
```json
{
  "id_front_url": "https://...",
  "id_back_url": "https://...",
  "photo_url": "https://..."
}
```

**Flow:** يحفظ بيانات التحقق للمستخدم ويغيّر `installment_status` إلى `pending` للمراجعة.

**Responses:** `200` submitted | `400` VALIDATION_ERROR | `401` UNAUTHORIZED

---

## Webhook APIs

### `POST /api/webhooks/paymob`
**Auth:** HMAC SHA-512 | **File:** `src/app/api/webhooks/paymob/route.ts`

**Flow:**
1. Verify HMAC signature (20-field concatenation)
2. If `merchant_order_id` starts with `inst_` → update installment payment
3. Otherwise → update order `gateway_order_id` → call `confirmPayment()`

## Admin APIs

> كل الـ Admin APIs محمية بالـ middleware (admin role check).

### `GET /api/admin/products`
Returns all products ordered by `created_at` DESC.

### `POST /api/admin/products`
Creates a new product. **Validates:** slug, type, title, price, status.

### `GET /api/admin/products/[id]`
Returns single product by ID.

### `PUT /api/admin/products/[id]`
Updates a product (partial update).

### `GET /api/admin/orders?status=completed&page=1`
Paginated orders with product relation. Filter by status.

### `GET /api/admin/stats`
Dashboard stats: `totalRevenue`, `totalOrders`, `completedOrders`, `pendingOrders`, `totalProducts`.

### `GET /api/admin/blog`
List all blog posts.

### `POST /api/admin/blog`
Create a blog post. Auto-sets `published_at` if status is `published`.

### `GET /api/admin/blog/[id]`
Single blog post.

### `PUT /api/admin/blog/[id]`
Update blog post.

### `GET /api/admin/coupons`
List all coupons.

### `POST /api/admin/coupons`
Create a coupon.
