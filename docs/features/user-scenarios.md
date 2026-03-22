# User Scenarios & Features — Radwa v2

## 1. Guest Purchase (بدون تسجيل)

```
المستخدم ← يتصفح المنتجات ← يختار منتج ← يدخل بياناته (اسم + إيميل + تليفون) 
  ← يختار طريقة الدفع ← يدفع ← يستلم رابط تحميل فوري + إيميل برابط دائم
```

- ✅ Guest يشتري بدون حساب
- ✅ إيميل بالرابط الدائم
- ❌ مفيش أقساط (لازم يسجل)
- ❌ مفيش dashboard

## 2. Authenticated Purchase

- ✅ Dashboard بالمشتريات
- ✅ أقساط (2 أو 4)
- ✅ حماية من الشراء المتكرر

## 3. Signup Flow

```
إدخال اسم + إيميل → OTP (6 أرقام، 10 دقائق) → كود + باسورد → الحساب يتنشأ
```

## 4. Google OAuth

```
تسجيل بجوجل → consent → callback → redirect dashboard
```

## 5. Coupon System

| ✅ مدعوم | التفاصيل |
|---------|----------|
| خصم نسبة | e.g., 20% |
| خصم ثابت | e.g., 50 EGP |
| حد أقصى للخصم | max_discount |
| حد أدنى للطلب | min_amount |
| كوبون لمنتج معين | product_id |
| عدد استخدامات محدود | max_uses |
| فترة صلاحية | valid_from → valid_until |

## 6. Download System

| النوع | الصلاحية | الحد |
|-------|---------|------|
| مؤقت (Success Page) | 15 دقيقة | 3 تحميلات |
| دائم (Email) | بلا انتهاء | 999 تحميلة |

**أمان:** Optimistic locking + R2 signed URLs (5 دقائق)

## 7. Admin Dashboard

- ✅ إحصائيات (مبيعات، أوردرات، منتجات)
- ✅ إدارة منتجات (CRUD)
- ✅ إدارة أوردرات (عرض + فلترة)
- ✅ إدارة مدونة (CRUD)
- ✅ إدارة كوبونات
- ✅ Admin middleware protection

## 8. Edge Cases

| السيناريو | النتيجة |
|----------|---------|
| شراء متكرر (مسجل) | `ALREADY_PURCHASED` (409) |
| أقساط بدون تسجيل | `AUTH_REQUIRED` (401) |
| أقساط على منتج مش بيدعم | `INSTALLMENTS_DISABLED` (400) |
| كوبون منتهي | `COUPON_EXPIRED` (400) |
| كوبون مستنفد | `COUPON_EXHAUSTED` (400) |
| Download token منتهي | `expired` (410) |
| Webhook مكرر | يتجاهل — آمن (idempotent) |
| HMAC غلط | `Invalid HMAC` (401) |
