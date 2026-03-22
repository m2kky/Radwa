# Radwa v2 — Overview

> **آخر تحديث:** 13 مارس 2026

## ما هو Radwa؟

منصة تعليمية مصرية لبيع الكورسات والقوالب الرقمية (Digital Products).  
تدعم الدفع الإلكتروني عبر Paymob (بطاقة ائتمان + محفظة) مع نظام أقساط.

## التقنيات (Stack)

| المجال | التقنية |
|--------|---------|
| Frontend | Next.js 15 (App Router, TypeScript strict) |
| Styling | Tailwind CSS 4 + Shadcn UI |
| Database | Supabase (PostgreSQL + Auth + RLS) |
| Payments | Paymob (card/wallet) |
| File Storage | Cloudflare R2 (signed URLs) |
| Email | Resend API |
| Hosting | (TBD — likely Vercel) |

## الجداول (8 فقط)

| الجدول | الوظيفة |
|--------|---------|
| `users` | بيانات المستخدمين (مرتبط بـ auth.users) |
| `products` | المنتجات (course / digital) |
| `orders` | الطلبات (دفع كامل أو أقساط) |
| `installment_payments` | جدول الأقساط |
| `download_tokens` | روابط التحميل (مؤقتة + دائمة) |
| `coupons` | أكواد الخصم |
| `verification_otps` | أكواد التحقق (OTP) |
| `blog_posts` | مقالات المدونة |

## الـ APIs (17 endpoint)

- **Auth:** signup, verify-otp, callback, logout
- **Checkout:** checkout, check-coupon
- **Download:** download/[token]
- **Installments:** installments/pay, installments/kyc
- **Webhooks:** paymob
- **Admin:** products (CRUD), orders, stats, blog (CRUD), coupons
