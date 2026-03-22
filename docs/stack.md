# Radwa v2 — Technology Stack

## Core

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | 15.x | Full-stack React framework (App Router) |
| `react` | 19.x | UI library |
| `typescript` | 5.x | Type safety (strict mode) |

## Styling

| Package | Version | Purpose |
|---------|---------|---------|
| `tailwindcss` | 4.x | Utility-first CSS |
| `@radix-ui/*` | latest | Headless UI primitives (via Shadcn) |
| `lucide-react` | latest | Icons |
| `class-variance-authority` | latest | Component variants |
| `clsx` + `tailwind-merge` | latest | Conditional class merging |

## Database & Auth

| Package | Version | Purpose |
|---------|---------|---------|
| `@supabase/supabase-js` | 2.x | Database client |
| `@supabase/ssr` | latest | Server-side auth helpers |

## Payments

| Service | Methods | HMAC |
|---------|---------|------|
| **Paymob** | Card, Wallet | SHA-512 |

## File Storage

| Service | Purpose |
|---------|---------|
| **Cloudflare R2** | Digital product files (signed URLs, 5-min expiry) |

## Email

| Service | Purpose |
|---------|---------|
| **Resend** | OTP emails + download links |

## Forms & Validation

| Package | Purpose |
|---------|---------|
| `zod` | Schema validation (API + forms) |
| `react-hook-form` | Form state management |
| `@hookform/resolvers` | Zod-Form integration |

## Environment Variables

### Server-only (لا يظهر في الـ client)
```
SUPABASE_SERVICE_ROLE_KEY
PAYMOB_API_KEY
PAYMOB_HMAC_SECRET
PAYMOB_INTEGRATION_ID_CARD
PAYMOB_INTEGRATION_ID_WALLET
PAYMOB_IFRAME_ID
RESEND_API_KEY
RESEND_FROM_EMAIL
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME
R2_ACCOUNT_ID
```

### Public (متاح في الـ client)
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_APP_URL
```
