-- ============================================
-- Guides/Templates + Services + Portfolio Drive Link
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

ALTER TABLE public.portfolio_items
  ADD COLUMN IF NOT EXISTS drive_url TEXT;

CREATE TABLE IF NOT EXISTS public.guides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT,
  content_body TEXT,
  thumbnail_url TEXT,
  file_storage_path TEXT,
  file_name TEXT,
  file_size BIGINT NOT NULL DEFAULT 0,
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  download_count INTEGER NOT NULL DEFAULT 0,
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guides_status_created
  ON public.guides (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_guides_featured_created
  ON public.guides (is_featured, created_at DESC);

ALTER TABLE public.guides ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'guides'
      AND policyname = 'guides_public_read_published'
  ) THEN
    CREATE POLICY guides_public_read_published ON public.guides
      FOR SELECT USING (status = 'published');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'guides_updated_at') THEN
    CREATE TRIGGER guides_updated_at
      BEFORE UPDATE ON public.guides
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT,
  content_body TEXT,
  thumbnail_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  cta_type TEXT NOT NULL DEFAULT 'book' CHECK (cta_type IN ('book', 'link', 'form')),
  cta_label TEXT NOT NULL DEFAULT 'ابدأ الآن',
  cta_url TEXT,
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_services_status_sort
  ON public.services (status, sort_order ASC, created_at DESC);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'services'
      AND policyname = 'services_public_read_published'
  ) THEN
    CREATE POLICY services_public_read_published ON public.services
      FOR SELECT USING (status = 'published');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'services_updated_at') THEN
    CREATE TRIGGER services_updated_at
      BEFORE UPDATE ON public.services
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.service_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  service_title TEXT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  company TEXT,
  budget TEXT,
  timeline TEXT,
  message TEXT NOT NULL,
  source_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_leads_created
  ON public.service_leads (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_service_leads_service_created
  ON public.service_leads (service_id, created_at DESC);

ALTER TABLE public.service_leads ENABLE ROW LEVEL SECURITY;
