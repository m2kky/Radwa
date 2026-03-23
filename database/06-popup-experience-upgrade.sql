-- ============================================
-- Popup Experience Upgrade
-- - multiple popup styles
-- - multi-action buttons
-- - discount code highlight/copy
-- - lead capture table (email/phone)
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

ALTER TABLE public.site_popups
  ADD COLUMN IF NOT EXISTS variant TEXT NOT NULL DEFAULT 'spotlight',
  ADD COLUMN IF NOT EXISTS discount_code TEXT,
  ADD COLUMN IF NOT EXISTS discount_note TEXT,
  ADD COLUMN IF NOT EXISTS actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS collect_name BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS collect_email BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS collect_phone BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS lead_title TEXT,
  ADD COLUMN IF NOT EXISTS lead_submit_text TEXT,
  ADD COLUMN IF NOT EXISTS lead_success_message TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'site_popups_variant_check'
      AND conrelid = 'public.site_popups'::regclass
  ) THEN
    ALTER TABLE public.site_popups
      ADD CONSTRAINT site_popups_variant_check
      CHECK (variant IN ('spotlight', 'minimal', 'split'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.popup_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  popup_id UUID REFERENCES public.site_popups(id) ON DELETE SET NULL,
  name TEXT,
  email TEXT,
  phone TEXT,
  source_path TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT popup_leads_email_or_phone_check CHECK (
    (email IS NOT NULL AND btrim(email) <> '')
    OR
    (phone IS NOT NULL AND btrim(phone) <> '')
  )
);

ALTER TABLE public.popup_leads ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_popup_leads_popup_created
  ON public.popup_leads (popup_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_popup_leads_created
  ON public.popup_leads (created_at DESC);

-- Backfill old CTA into actions when actions are empty.
UPDATE public.site_popups
SET actions = jsonb_build_array(
  jsonb_build_object(
    'id', 'legacy-cta',
    'label', cta_text,
    'action', 'link',
    'url', cta_url,
    'style', 'primary',
    'new_tab', false,
    'copy_text', null
  )
)
WHERE (actions IS NULL OR actions = '[]'::jsonb)
  AND cta_text IS NOT NULL
  AND cta_url IS NOT NULL;
