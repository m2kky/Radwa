-- ============================================
-- RADWA v2 - FINAL PROTECTED SCHEMA
-- 7 tables, Clean, Secure (RLS Enabled)
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
DROP TABLE IF EXISTS public.users CASCADE;

CREATE TABLE public.users (
  id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  phone               TEXT,

-- Installment Verification
installment_status  TEXT DEFAULT 'none' CHECK (installment_status IN ('none', 'pending', 'approved', 'rejected')),
  id_front_url        TEXT,
  id_back_url         TEXT,
  photo_url           TEXT,
  rejection_reason    TEXT,

  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- TABLE 2: PRODUCTS
-- ============================================
DROP TABLE IF EXISTS products CASCADE;

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    slug TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('course', 'digital')),
    title TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    price NUMERIC(10, 2) NOT NULL,
    compare_at_price NUMERIC(10, 2),
    currency TEXT DEFAULT 'EGP',
    installments_enabled BOOLEAN DEFAULT FALSE,
    files JSONB,
    lessons JSONB,
    is_featured BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'published' CHECK (
        status IN (
            'draft',
            'published',
            'archived'
        )
    ),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================
-- TABLE 3: ORDERS
-- ============================================
DROP TABLE IF EXISTS orders CASCADE;

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    user_id UUID REFERENCES public.users (id) ON DELETE SET NULL,
    guest_email TEXT,
    guest_name TEXT,
    guest_phone TEXT,
    product_id UUID NOT NULL REFERENCES products (id) ON DELETE RESTRICT,
    original_amount NUMERIC(10, 2) NOT NULL,
    paid_amount NUMERIC(10, 2) NOT NULL,
    currency TEXT DEFAULT 'EGP',
    coupon_code TEXT,
    discount_amount NUMERIC(10, 2) DEFAULT 0,
    payment_method TEXT CHECK (
        payment_method IN (
            'card',
            'wallet',
            'fawry',
            'aman'
        )
    ),
    payment_gateway TEXT CHECK (
        payment_gateway IN ('paymob', 'easykash')
    ),
    installment_plan TEXT CHECK (
        installment_plan IN ('full', '2', '4')
    ),
    gateway_order_id TEXT,
    gateway_txn_id TEXT,
    status TEXT DEFAULT 'pending' CHECK (
        status IN (
            'pending',
            'completed',
            'failed',
            'refunded',
            'suspended'
        )
    ),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================
-- TABLE 4: INSTALLMENT_PAYMENTS
-- ============================================
DROP TABLE IF EXISTS installment_payments CASCADE;

CREATE TABLE installment_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    order_id UUID NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    due_date DATE NOT NULL,
    paid_at TIMESTAMPTZ,
    status TEXT DEFAULT 'pending' CHECK (
        status IN ('pending', 'paid', 'overdue')
    ),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE 5: DOWNLOAD_TOKENS
-- ============================================
DROP TABLE IF EXISTS download_tokens CASCADE;

CREATE TABLE download_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    token TEXT UNIQUE NOT NULL,
    order_id UUID NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users (id) ON DELETE SET NULL,
    email TEXT NOT NULL,
    download_count INTEGER DEFAULT 0,
    max_downloads INTEGER DEFAULT 5,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE 6: COUPONS
-- ============================================
DROP TABLE IF EXISTS coupons CASCADE;

CREATE TABLE coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    code TEXT UNIQUE NOT NULL,
    discount_type TEXT NOT NULL CHECK (
        discount_type IN ('percentage', 'fixed')
    ),
    discount_value NUMERIC(10, 2) NOT NULL,
    max_uses INTEGER,
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE 7: VERIFICATION_OTPS
-- ============================================
DROP TABLE IF EXISTS verification_otps CASCADE;

CREATE TABLE verification_otps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    type TEXT NOT NULL CHECK (
        type IN ('signup', 'login', 'recovery')
    ),
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_otps_email ON verification_otps (email);

CREATE INDEX idx_otps_code ON verification_otps (code);

-- ============================================
-- SECURITY: RLS POLICIES
-- ============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

ALTER TABLE installment_payments ENABLE ROW LEVEL SECURITY;

ALTER TABLE download_tokens ENABLE ROW LEVEL SECURITY;

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

ALTER TABLE verification_otps ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_own_policy ON public.users FOR ALL USING (auth.uid () = id);

CREATE POLICY products_read_policy ON products FOR
SELECT USING (status = 'published');

CREATE POLICY orders_own_policy ON orders FOR
SELECT USING (
        auth.uid () = user_id
        OR guest_email = (
            SELECT email
            FROM auth.users
            WHERE
                id = auth.uid ()
        )
    );

CREATE POLICY installments_own_policy ON installment_payments FOR
SELECT USING (auth.uid () = user_id);

CREATE POLICY tokens_own_policy ON download_tokens FOR
SELECT USING (
        auth.uid () = user_id
        OR email = (
            SELECT email
            FROM auth.users
            WHERE
                id = auth.uid ()
        )
    );

CREATE POLICY coupons_read_policy ON coupons FOR
SELECT USING (is_active = TRUE);