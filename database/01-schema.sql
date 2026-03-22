-- ============================================
-- RADWA v2 - DATABASE SCHEMA
-- 6 tables only, clean and minimal
-- ============================================

-- ============================================
-- EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- HELPER: updated_at trigger
-- ============================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TABLE 1: USERS
-- Extends Supabase auth.users
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  phone       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', 'User'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- TABLE 2: PRODUCTS
-- Courses + digital products unified
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug                 TEXT UNIQUE NOT NULL,
  type                 TEXT NOT NULL CHECK (type IN ('course', 'digital')),
  title                TEXT NOT NULL,
  description          TEXT,
  thumbnail_url        TEXT,

  -- Pricing
  price                NUMERIC(10,2) NOT NULL,
  compare_at_price     NUMERIC(10,2),
  currency             TEXT DEFAULT 'EGP',

  -- Installments
  installments_enabled BOOLEAN DEFAULT FALSE,

  -- Files (for digital products)
  -- [{name, storage_path, size}]
  files                JSONB,

  -- Course-specific (for future use)
  -- [{title, bunny_id, duration_seconds, is_free_preview}]
  lessons              JSONB,

  -- Display
  is_featured          BOOLEAN DEFAULT FALSE,
  status               TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),

  -- SEO
  meta_title           TEXT,
  meta_description     TEXT,

  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_slug   ON products(slug);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_type   ON products(type);

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================
-- TABLE 3: ORDERS
-- Covers guest + authenticated, full + installment
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Customer (one of these will be set)
  user_id              UUID REFERENCES public.users(id) ON DELETE SET NULL,
  guest_email          TEXT,
  guest_name           TEXT,
  guest_phone          TEXT,

  -- Product
  product_id           UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,

  -- Pricing
  original_amount      NUMERIC(10,2) NOT NULL,
  paid_amount          NUMERIC(10,2) NOT NULL,
  currency             TEXT DEFAULT 'EGP',

  -- Coupon
  coupon_code          TEXT,
  discount_amount      NUMERIC(10,2) DEFAULT 0,

  -- Payment
  payment_method       TEXT CHECK (payment_method IN ('card', 'wallet', 'fawry', 'aman')),
  payment_gateway      TEXT CHECK (payment_gateway IN ('paymob', 'easykash')),

  -- Installments
  installment_plan     TEXT CHECK (installment_plan IN ('full', '2', '4')),

  -- Gateway refs (store actual IDs, not URLs)
  gateway_order_id     TEXT,
  gateway_txn_id       TEXT,

  -- Status
  status               TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),

  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW(),
  completed_at         TIMESTAMPTZ
);

CREATE INDEX idx_orders_user       ON orders(user_id);
CREATE INDEX idx_orders_product    ON orders(product_id);
CREATE INDEX idx_orders_status     ON orders(status);
CREATE INDEX idx_orders_gateway    ON orders(gateway_order_id);
CREATE INDEX idx_orders_guest      ON orders(guest_email);

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================
-- TABLE 4: INSTALLMENT_PAYMENTS
-- Individual payments within an installment plan
-- ============================================
CREATE TABLE IF NOT EXISTS installment_payments (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id     UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Payment details
  amount       NUMERIC(10,2) NOT NULL,
  due_date     DATE NOT NULL,
  paid_at      TIMESTAMPTZ,

  -- Gateway refs
  gateway_order_id TEXT,
  gateway_txn_id   TEXT,

  status       TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),

  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_installments_order   ON installment_payments(order_id);
CREATE INDEX idx_installments_user    ON installment_payments(user_id);
CREATE INDEX idx_installments_due     ON installment_payments(due_date);
CREATE INDEX idx_installments_status  ON installment_payments(status);

-- ============================================
-- TABLE 5: DOWNLOAD_TOKENS
-- Signed tokens for file downloads (48h expiry)
-- Created ONLY after payment confirmed
-- ============================================
CREATE TABLE IF NOT EXISTS download_tokens (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token       TEXT UNIQUE NOT NULL,
  order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

  -- Who gets it
  user_id     UUID REFERENCES public.users(id) ON DELETE SET NULL,
  email       TEXT NOT NULL,

  -- Usage
  download_count  INTEGER DEFAULT 0,
  max_downloads   INTEGER DEFAULT 5,
  -- NULL = never expires (email token), set = temporary (success page token)
  expires_at      TIMESTAMPTZ,

  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tokens_token   ON download_tokens(token);
CREATE INDEX idx_tokens_order   ON download_tokens(order_id);
CREATE INDEX idx_tokens_expires ON download_tokens(expires_at);

-- ============================================
-- TABLE 6: COUPONS
-- ============================================
CREATE TABLE IF NOT EXISTS coupons (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code            TEXT UNIQUE NOT NULL,
  discount_type   TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value  NUMERIC(10,2) NOT NULL,

  -- Restrictions
  min_amount      NUMERIC(10,2),
  max_discount    NUMERIC(10,2),
  product_id      UUID REFERENCES products(id) ON DELETE CASCADE, -- NULL = all products

  -- Usage
  max_uses        INTEGER,
  usage_count     INTEGER DEFAULT 0,

  -- Validity
  valid_from      TIMESTAMPTZ DEFAULT NOW(),
  valid_until     TIMESTAMPTZ,
  is_active       BOOLEAN DEFAULT TRUE,

  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_coupons_code   ON coupons(code);
CREATE INDEX idx_coupons_active ON coupons(is_active);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE public.users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders                ENABLE ROW LEVEL SECURITY;
ALTER TABLE installment_payments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE download_tokens       ENABLE ROW LEVEL SECURITY;

-- Users: own profile only
CREATE POLICY users_own ON public.users
  USING (auth.uid() = id);

-- Orders: own orders only
CREATE POLICY orders_select_own ON orders
  FOR SELECT USING (auth.uid() = user_id);

-- Installments: own only
CREATE POLICY installments_own ON installment_payments
  FOR SELECT USING (auth.uid() = user_id);

-- Download tokens: own only
CREATE POLICY tokens_own ON download_tokens
  FOR SELECT USING (auth.uid() = user_id);

-- Products + coupons: public read
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons  ENABLE ROW LEVEL SECURITY;

CREATE POLICY products_public_read ON products
  FOR SELECT USING (status = 'published');

CREATE POLICY coupons_public_read ON coupons
  FOR SELECT USING (is_active = TRUE);
