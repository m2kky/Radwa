# Architecture — Radwa v2

## System Architecture

```
┌─────────────────────────────────────────────────────┐
│                     CLIENT (Browser)                │
│  Next.js App Router (SSR + CSR)                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐    │
│  │  Public   │ │  Auth    │ │  Admin Dashboard │    │
│  │  Pages    │ │  Pages   │ │  Pages           │    │
│  └────┬─────┘ └────┬─────┘ └────────┬─────────┘    │
└───────┼─────────────┼────────────────┼──────────────┘
        │             │                │
┌───────▼─────────────▼────────────────▼──────────────┐
│                   API ROUTES (17 endpoints)          │
│  ┌────────┐  ┌──────────┐  ┌────────┐  ┌────────┐  │
│  │  Auth  │  │ Checkout │  │ Admin  │  │Webhooks│  │
│  │  (4)   │  │   (2)    │  │  (7)   │  │  (1)   │  │
│  └───┬────┘  └────┬─────┘  └───┬────┘  └───┬────┘  │
└──────┼────────────┼────────────┼────────────┼───────┘
       │            │            │            │
┌──────▼────────────▼────────────▼────────────▼───────┐
│                   SUPABASE                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │ Auth     │  │ Database │  │ Row Level        │   │
│  │ (JWT)    │  │ (8 tbls) │  │ Security (RLS)   │   │
│  └──────────┘  └──────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────┘
       │               │
┌──────▼──┐     ┌──────▼──────┐     ┌──────────────┐
│ Resend  │     │ Cloudflare  │     │    Paymob    │
│ (Email) │     │ R2 (Files)  │     │              │
└─────────┘     └─────────────┘     └──────────────┘
```

## Request Flow

### Checkout Flow
```
User → POST /api/checkout
  1. Validate input (Zod)
  2. Fetch product from Supabase
  3. Validate installments eligibility
  4. Check duplicate purchase
  5. Apply coupon (if any)
  6. Create pending order
  7. Initiate payment (Paymob)
  8. Return payment_url → redirect user

Payment Gateway → POST /api/webhooks/{gateway}
  1. Verify HMAC signature
  2. Parse transaction data
  3. Update order status → completed
  4. Generate download tokens (temp + permanent)
  5. Send download email via Resend
  6. Create installment schedule (if applicable)
```

### Auth Flow
```
User → POST /api/auth/signup
  1. Validate email + name
  2. Check user doesn't exist
  3. Generate 6-digit OTP
  4. Store in verification_otps table
  5. Send email via Resend

User → POST /api/auth/verify-otp
  1. Validate code + email
  2. Find valid OTP (not expired, not used)
  3. Mark OTP as used
  4. Create auth.users entry (Supabase Auth)
  5. handle_new_user trigger → public.users
```

## Directory Structure

```
src/
├── app/
│   ├── (public)/          # Public pages (no auth)
│   │   ├── page.tsx       # Homepage
│   │   ├── shop/          # Product listing + details
│   │   └── blog/          # Blog listing + details
│   ├── (auth)/            # Auth pages
│   │   ├── login/
│   │   ├── signup/
│   │   └── verify-otp/
│   ├── admin/             # Admin dashboard
│   │   ├── layout.tsx     # Admin auth guard
│   │   └── page.tsx       # Admin home
│   ├── dashboard/         # Student dashboard
│   ├── success/           # Post-purchase success
│   └── api/               # API routes
├── components/
│   ├── ui/                # Shadcn components
│   ├── features/          # Business components
│   └── shared/            # Reusable components
├── lib/
│   ├── supabase/          # Supabase clients (server + admin)
│   ├── payments/          # Paymob + confirm
│   ├── email.ts           # Resend email sender
│   ├── r2.ts              # Cloudflare R2 signed URLs
│   └── utils.ts           # Shared utilities
└── types/                 # TypeScript type definitions
```

## Data Model (ER Diagram)

```
auth.users ─── 1:1 ──→ public.users
                          │
                          ├── 1:N ──→ orders ──────→ products
                          │             │
                          │             ├── 1:N ──→ installment_payments
                          │             │
                          │             └── 1:N ──→ download_tokens ──→ products
                          │
                          └── (via email) ──→ verification_otps

products ←── N:1 ──── coupons (optional product_id)

blog_posts (standalone)
```
