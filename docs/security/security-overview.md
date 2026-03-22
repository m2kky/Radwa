# Security — Radwa v2

## Authentication

### Methods
| Method | Flow |
|--------|------|
| **Email + OTP** | Signup → OTP (10 min) → Verify → Create Account |
| **Google OAuth** | Google → Callback → Session |
| **Password Login** | Email + Password → Supabase Auth |

### Session Management
- **Access Token:** JWT (1 hour expiry)
- **Refresh Token:** 1 week expiry
- **Cookies:** httpOnly, secure, sameSite=lax
- **Supabase SSR:** handles refresh automatically

## Authorization

### Role Check
```
API Request → Middleware → Check admin role via users table → Allow/Deny
```

### RLS (Row Level Security)
- ✅ All 8 tables have RLS enabled
- ✅ Admin APIs use `createAdminClient()` (service role key, bypasses RLS)
- ✅ Public APIs use `createClient()` (anon key, respects RLS)

| Table | Policy |
|-------|--------|
| users | Own profile only |
| products | Published only (public) |
| orders | Own orders only |
| installment_payments | Own only |
| download_tokens | Own only |
| coupons | Active only (public) |
| blog_posts | Published only (public) |
| verification_otps | No public access |

## Input Validation

- **All API routes** use Zod schemas for body validation
- **Type enforcement:** strict TypeScript
- **SQL injection:** Prevented by Supabase client (parameterized queries)

## HMAC Verification (Webhooks)

| Gateway | Algorithm | Fields |
|---------|-----------|--------|
| Paymob | SHA-512 | 20 fields concatenated |

- ✅ Hard fail if HMAC secret not configured
- ✅ Reject if HMAC mismatch
- ✅ Idempotent (safe for duplicate callbacks)

## Download Security

1. **Token-based access** — no auth required (token IS the auth)
2. **Expiry enforcement** — temp tokens expire in 15 minutes
3. **Rate limiting** — max downloads enforced
4. **Optimistic lock** — race condition prevention on download_count
5. **Signed URLs** — R2 generates 5-minute URLs, files never exposed directly

## Secrets Management

### Server-only (NEVER in client code)
```
SUPABASE_SERVICE_ROLE_KEY
PAYMOB_API_KEY / PAYMOB_HMAC_SECRET
RESEND_API_KEY
R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY
```

### Public (safe for client)
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_APP_URL
```

## Security Checklist

- [x] RLS on all tables
- [x] HMAC verification on webhooks
- [x] Zod validation on all inputs
- [x] Service role key server-only
- [x] Signed URLs for file downloads
- [x] OTP expiration (10 min)
- [x] Duplicate purchase prevention
- [x] Installment auth requirement
- [x] Amount verification (prevent partial payment attacks)
- [ ] Rate limiting on auth endpoints (TODO)
- [ ] CSP headers (TODO)
- [ ] Brute force protection on OTP (TODO)
