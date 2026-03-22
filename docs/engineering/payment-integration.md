# Payment Integration — Radwa v2

## Supported Gateways

| Gateway | Methods | HMAC Algorithm | Integration Type |
|---------|---------|----------------|------------------|
| **Paymob** | Card, Wallet | SHA-512 | Redirect (iframe) |

## Payment Flow

```
1. User → POST /api/checkout
   ├── Creates pending ORDER
   └── Redirects to gateway

2. Gateway → POST /api/webhooks/paymob
   ├── Verifies HMAC
   ├── Updates order → completed
   ├── Creates download tokens (temp 15min + permanent)
   ├── Sends email via Resend
   └── Creates installment schedule (if applicable)

3. User ← Redirected by Paymob to /api/webhooks/paymob/response
   └── Redirects internally to /success?order={merchant_order_id}
4. User ← Email with permanent download link
```

## Installments

- Plans: **2 installments** or **4 installments** (weekly)
- First payment at checkout, remaining auto-scheduled
- Each installment: `merchant_order_id = inst_{installment_id}`

## Dual Token System

| Token | Expiry | Max Downloads | Purpose |
|-------|--------|---------------|---------|
| Temporary | 15 min | 3 | Success page instant download |
| Permanent | Never | 999 | Email link (forever) |

## Environment Variables

```
PAYMOB_API_KEY / PAYMOB_HMAC_SECRET / PAYMOB_INTEGRATION_ID_CARD / PAYMOB_INTEGRATION_ID_WALLET / PAYMOB_IFRAME_ID
```

## Files

| File | Purpose |
|------|---------|
| `lib/payments/paymob.ts` | Paymob API integration |
| `lib/payments/confirm.ts` | Shared post-payment logic |
| `api/webhooks/paymob/route.ts` | Paymob webhook |
| `api/webhooks/paymob/response/route.ts` | Paymob response callback redirect |
