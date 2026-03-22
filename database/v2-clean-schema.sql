-- ============================================
-- RADWA v2 - CLEAN DATABASE SCHEMA (Reference)
-- 8 tables — matches actual Supabase state
-- Last Updated: 2026-03-13
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

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', 'User'))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TABLE 1: USERS
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  phone         TEXT,
  installment_status TEXT DEFAULT 'none' CHECK (installment_status IN ('none','pending','approved','rejected')),
  id_front_url  TEXT,
  id_back_url   TEXT,
  photo_url     TEXT,
  rejection_reason TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY users_own ON public.users USING (auth.uid() = id);
CREATE TRIGGER users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- TABLE 2: PRODUCTS
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug                 TEXT UNIQUE NOT NULL,
  type                 TEXT NOT NULL CHECK (type IN ('course', 'digital')),
  title                TEXT NOT NULL,
  description          TEXT,
  thumbnail_url        TEXT,
  price                NUMERIC(10,2) NOT NULL,
  compare_at_price     NUMERIC(10,2),
  currency             TEXT DEFAULT 'EGP',
  installments_enabled BOOLEAN DEFAULT FALSE,
  files                JSONB,
  lessons              JSONB,
  is_featured          BOOLEAN DEFAULT FALSE,
  status               TEXT DEFAULT 'published' CHECK (status IN ('draft','published','archived')),
  meta_title           TEXT,
  meta_description     TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_type ON products(type);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY products_public_read ON products FOR SELECT USING (status = 'published');
CREATE TRIGGER products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================
-- TABLE 3: ORDERS
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id              UUID REFERENCES public.users(id) ON DELETE SET NULL,
  guest_email          TEXT,
  guest_name           TEXT,
  guest_phone          TEXT,
  product_id           UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  original_amount      NUMERIC(10,2) NOT NULL,
  paid_amount          NUMERIC(10,2) NOT NULL,
  currency             TEXT DEFAULT 'EGP',
  coupon_code          TEXT,
  discount_amount      NUMERIC(10,2) DEFAULT 0,
  payment_method       TEXT CHECK (payment_method IN ('card','wallet','fawry','aman')),
  payment_gateway      TEXT CHECK (payment_gateway IN ('paymob','easykash')),
  installment_plan     TEXT CHECK (installment_plan IN ('full','2','4')),
  gateway_order_id     TEXT,
  gateway_txn_id       TEXT,
  status               TEXT DEFAULT 'pending' CHECK (status IN ('pending','completed','failed','refunded','suspended')),
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW(),
  completed_at         TIMESTAMPTZ
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_product ON orders(product_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_gateway ON orders(gateway_order_id);
CREATE INDEX idx_orders_guest ON orders(guest_email);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY orders_select_own ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================
-- TABLE 4: INSTALLMENT_PAYMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS installment_payments (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id         UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount           NUMERIC(10,2) NOT NULL,
  due_date         DATE NOT NULL,
  paid_at          TIMESTAMPTZ,
  gateway_order_id TEXT,
  gateway_txn_id   TEXT,
  status           TEXT DEFAULT 'pending' CHECK (status IN ('pending','paid','overdue')),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_installments_order ON installment_payments(order_id);
CREATE INDEX idx_installments_user ON installment_payments(user_id);
CREATE INDEX idx_installments_due ON installment_payments(due_date);
CREATE INDEX idx_installments_status ON installment_payments(status);

ALTER TABLE installment_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY installments_own ON installment_payments FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- TABLE 5: DOWNLOAD_TOKENS
-- ============================================
CREATE TABLE IF NOT EXISTS download_tokens (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token           TEXT UNIQUE NOT NULL,
  order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES public.users(id) ON DELETE SET NULL,
  email           TEXT NOT NULL,
  download_count  INTEGER DEFAULT 0,
  max_downloads   INTEGER DEFAULT 5,
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tokens_token ON download_tokens(token);
CREATE INDEX idx_tokens_order ON download_tokens(order_id);
CREATE INDEX idx_tokens_expires ON download_tokens(expires_at);

ALTER TABLE download_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY tokens_own ON download_tokens FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- TABLE 6: COUPONS
-- ============================================
CREATE TABLE IF NOT EXISTS coupons (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code            TEXT UNIQUE NOT NULL,
  discount_type   TEXT NOT NULL CHECK (discount_type IN ('percentage','fixed')),
  discount_value  NUMERIC(10,2) NOT NULL,
  min_amount      NUMERIC(10,2),
  max_discount    NUMERIC(10,2),
  product_id      UUID REFERENCES products(id) ON DELETE CASCADE,
  max_uses        INTEGER,
  usage_count     INTEGER DEFAULT 0,
  valid_from      TIMESTAMPTZ DEFAULT NOW(),
  valid_until     TIMESTAMPTZ,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_active ON coupons(is_active);

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY coupons_public_read ON coupons FOR SELECT USING (is_active = TRUE);

-- ============================================
-- TABLE 7: VERIFICATION_OTPS
-- ============================================
CREATE TABLE IF NOT EXISTS verification_otps (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email       TEXT NOT NULL,
  code        TEXT NOT NULL,
  used        BOOLEAN DEFAULT FALSE,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_otps_email ON verification_otps(email);
CREATE INDEX idx_otps_code ON verification_otps(code);

ALTER TABLE verification_otps ENABLE ROW LEVEL SECURITY;
-- No public policies — only admin client accesses this table

-- ============================================
-- TABLE 8: BLOG_POSTS
-- ============================================
CREATE TABLE IF NOT EXISTS blog_posts (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug              VARCHAR UNIQUE NOT NULL,
  title             VARCHAR NOT NULL,
  excerpt           TEXT,
  content           TEXT NOT NULL,
  thumbnail_url     TEXT,
  featured_image_url TEXT,
  category          VARCHAR,
  tags              TEXT[],
  author_name       TEXT,
  views_count       INTEGER DEFAULT 0,
  read_time_minutes INTEGER,
  status            VARCHAR DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  is_featured       BOOLEAN DEFAULT FALSE,
  meta_title        VARCHAR,
  meta_description  TEXT,
  published_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_blog_slug ON blog_posts(slug);
CREATE INDEX idx_blog_status ON blog_posts(status);

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY blog_public_read ON blog_posts FOR SELECT USING (status = 'published');
CREATE TRIGGER blog_posts_updated_at BEFORE UPDATE ON blog_posts FOR EACH ROW EXECUTE FUNCTION set_updated_at();
