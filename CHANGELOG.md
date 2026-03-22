# Changelog - Radwa v2

## [0.2.0] - 2026-03-09

### Added

- **Authentication**: Mandatory Arabic OTP flow for signups.
  - New API: `POST /api/auth/signup` (Initiates OTP).
  - New API: `POST /api/auth/verify-otp` (Validates and creates account).
  - New Page: `/verify-otp` with branded Arabic UI.
  - Email Service: Added `sendOtpEmail` via Resend.
- **Database**: Finalized `v2-final-schema.sql`.
  - Added `verification_otps` table for secure, branded codes.
  - Implemented Row Level Security (RLS) on all tables.
  - Added Identity Verification fields to `users` table.

### Changed

- **Branding**: Localized all transactional email templates to Arabic.
- **Signup**: Updated `/signup` page to use the new secure OTP flow.
- **Security**: Enabled RLS cross-project and restricted internal tables.

### Known Issues

- ⚠️ SQL Schema needs manual execution in Supabase Dashboard.
- ⚠️ Password recovery flow is in progress.
- ⚠️ Middleware RBAC needs final verification.
