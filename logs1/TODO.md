# TODO — Radwa v2

---

## ✅ Completed

### Infrastructure
- [x] Project setup (Next.js 15 + Tailwind v4 + Shadcn)
- [x] DB Schema — 6 tables نظيفة
- [x] Data migration script (v1 → v2)
- [x] TypeScript types
- [x] Supabase clients (server + admin + browser)
- [x] Environment variables

### Payment Core
- [x] `api/checkout/route.ts`
- [x] `lib/payments/confirm.ts` — shared idempotent logic
- [x] `lib/payments/paymob.ts`
- [x] `lib/payments/easykash.ts`
- [x] `api/webhooks/paymob/route.ts`
- [x] `api/webhooks/easykash/route.ts`
- [x] `api/download/[token]/route.ts`
- [x] `lib/r2.ts`
- [x] `lib/email.ts`

### Shop Pages
- [x] `app/globals.css` — design system
- [x] `app/layout.tsx` — root layout + fonts + RTL
- [x] `app/shop/page.tsx` — featured hero + grid
- [x] `app/shop/[slug]/page.tsx` — product detail + SEO
- [x] `components/features/product-card.tsx`
- [x] `components/features/checkout-form.tsx`

### Phase 3 — Post-Payment + Auth
- [x] `app/success/page.tsx`
- [x] `app/(auth)/login/page.tsx`
- [x] `app/(auth)/signup/page.tsx`
- [x] `app/dashboard/page.tsx`
- [x] `src/middleware.ts`
- [x] `api/checkout/check-coupon/route.ts`
- [x] `api/auth/logout/route.ts`

### Phase 4 — Public Pages ✅
- [x] `components/layout/navbar.tsx`
- [x] `components/layout/footer.tsx`
- [x] `components/home/hero.tsx`
- [x] `components/home/about-teaser.tsx` — صورة + stats + animated quote
- [x] `components/home/strategy-wheel.tsx` — interactive rotating wheel
- [x] `components/home/timeline.tsx` — horizontal scroll career
- [x] `components/home/featured-products.tsx`
- [x] `components/home/testimonials.tsx` — testimonials + blog sidebar
- [x] `components/home/cta.tsx`
- [x] `components/home/contact-form.tsx`
- [x] `components/blog/blog-card.tsx`
- [x] `app/page.tsx` — homepage كاملة (7 sections)
- [x] `app/about/page.tsx`
- [x] `app/blog/page.tsx`
- [x] `app/blog/[slug]/page.tsx`

### Phase 5 — Admin ✅
- [x] `api/admin/stats/route.ts`
- [x] `api/admin/products/route.ts`
- [x] `api/admin/products/[id]/route.ts`
- [x] `api/admin/orders/route.ts`
- [x] `api/admin/coupons/route.ts`
- [x] `app/admin/layout.tsx`
- [x] `app/admin/page.tsx`
- [x] `app/admin/products/page.tsx`
- [x] `app/admin/products/new/page.tsx`
- [x] `app/admin/products/[id]/edit/page.tsx`
- [x] `app/admin/orders/page.tsx`
- [x] `app/admin/coupons/page.tsx`
- [x] `components/admin/sidebar.tsx`
- [x] `components/admin/product-form.tsx`
- [x] `components/admin/product-status-toggle.tsx`
- [x] `components/admin/orders-table.tsx`
- [x] `components/admin/coupons-manager.tsx`
- [x] `middleware.ts` — updated to protect /admin routes

---

## 🔄 Next Up

### Phase 6 — SEO
- [ ] `app/sitemap.ts`
- [ ] `app/robots.ts`
- [ ] JSON-LD structured data على product pages
- [ ] Open Graph images

---

## 🚫 Phase 2 (بعدين)
- Installment payments flow (pay next installment)
- Course video player (Bunny.net)
- Certificates
- Blog admin (CRUD)
