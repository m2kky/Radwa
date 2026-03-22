-- ============================================
-- Booking System (Calendly-like)
-- Adds: settings, event_types, availability, availability_overrides, bookings
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public.settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.event_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  color TEXT NOT NULL DEFAULT '#06b6d4',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  buffer_before INTEGER NOT NULL DEFAULT 0,
  buffer_after INTEGER NOT NULL DEFAULT 0,
  max_per_day INTEGER,
  start_time_increment INTEGER NOT NULL DEFAULT 30,
  timezone_display TEXT NOT NULL DEFAULT 'auto',
  locked_timezone TEXT,
  allow_guests BOOLEAN NOT NULL DEFAULT FALSE,
  invitee_questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  communication_methods JSONB NOT NULL DEFAULT '["google_meet"]'::jsonb,
  confirmation_redirect TEXT,
  email_reminder_hours INTEGER,
  email_followup_hours INTEGER,
  min_notice_hours INTEGER NOT NULL DEFAULT 4,
  max_future_days INTEGER NOT NULL DEFAULT 60,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS event_types_slug_unique ON public.event_types (slug);
CREATE INDEX IF NOT EXISTS idx_event_types_active_created ON public.event_types (is_active, created_at DESC);

CREATE TABLE IF NOT EXISTS public.availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_availability_day ON public.availability (day_of_week);

CREATE TABLE IF NOT EXISTS public.availability_overrides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL UNIQUE,
  slots JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_availability_overrides_date ON public.availability_overrides (date);

CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type_id UUID REFERENCES public.event_types(id) ON DELETE SET NULL,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT,
  guests TEXT,
  communication_method TEXT,
  custom_answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'cancelled')),
  meeting_link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_unique_slot ON public.bookings (booking_date, start_time);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON public.bookings (booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_event_type ON public.bookings (event_type_id);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'settings_updated_at') THEN
    CREATE TRIGGER settings_updated_at
    BEFORE UPDATE ON public.settings
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'event_types_updated_at') THEN
    CREATE TRIGGER event_types_updated_at
    BEFORE UPDATE ON public.event_types
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'availability_overrides_updated_at') THEN
    CREATE TRIGGER availability_overrides_updated_at
    BEFORE UPDATE ON public.availability_overrides
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'bookings_updated_at') THEN
    CREATE TRIGGER bookings_updated_at
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'event_types' AND policyname = 'event_types_public_read_active'
  ) THEN
    CREATE POLICY event_types_public_read_active ON public.event_types
      FOR SELECT USING (is_active = TRUE);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'availability' AND policyname = 'availability_public_read'
  ) THEN
    CREATE POLICY availability_public_read ON public.availability
      FOR SELECT USING (TRUE);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'availability_overrides' AND policyname = 'availability_overrides_public_read'
  ) THEN
    CREATE POLICY availability_overrides_public_read ON public.availability_overrides
      FOR SELECT USING (TRUE);
  END IF;
END $$;

-- Default profile + starter event and weekly hours (insert once)
INSERT INTO public.settings (key, value)
VALUES (
  'booking_profile',
  jsonb_build_object(
    'name', 'Radwa Muhammed',
    'welcome_message', 'احجزي جلسة استشارية لمناقشة خطتك التسويقية وخطوات التنفيذ.',
    'language', 'ar',
    'date_format', 'MMM d, yyyy',
    'time_format', '12h',
    'timezone', 'Africa/Cairo',
    'avatar_url', '/radwa.jpg'
  )
)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.event_types (title, slug, description, duration_minutes, is_active, color)
SELECT
  'جلسة استشارية سريعة',
  'quick-consultation',
  'جلسة 30 دقيقة لمراجعة الوضع الحالي ووضع الخطوة التالية.',
  30,
  TRUE,
  '#06b6d4'
WHERE NOT EXISTS (SELECT 1 FROM public.event_types);

INSERT INTO public.availability (day_of_week, start_time, end_time)
SELECT x.day_of_week, x.start_time, x.end_time
FROM (
  VALUES
    (0, '12:00'::time, '18:00'::time),
    (1, '10:00'::time, '18:00'::time),
    (2, '10:00'::time, '18:00'::time),
    (3, '10:00'::time, '18:00'::time),
    (4, '10:00'::time, '18:00'::time),
    (5, '10:00'::time, '16:00'::time)
) AS x(day_of_week, start_time, end_time)
WHERE NOT EXISTS (SELECT 1 FROM public.availability);
