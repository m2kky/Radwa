-- ============================================
-- RADWA v2 - DATA MIGRATION
-- Migrates existing data from old schema to v2
-- Run AFTER 01-schema.sql
-- ============================================

-- ============================================
-- 1. MIGRATE PRODUCTS (from templates table)
-- ============================================
INSERT INTO products (
  id,
  slug,
  type,
  title,
  description,
  thumbnail_url,
  price,
  compare_at_price,
  currency,
  installments_enabled,
  files,
  is_featured,
  status,
  meta_title,
  meta_description,
  created_at,
  updated_at
)
SELECT
  id,
  slug,
  'digital',
  title,
  description,
  thumbnail_url,
  price,
  compare_at_price,
  currency,
  FALSE, -- installments off by default, admin can enable per product
  files,
  is_featured,
  status,
  meta_title,
  meta_description,
  created_at,
  updated_at
FROM templates
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. MIGRATE PRODUCTS (from courses table)
-- ============================================
INSERT INTO products (
  id,
  slug,
  type,
  title,
  description,
  thumbnail_url,
  price,
  compare_at_price,
  currency,
  installments_enabled,
  is_featured,
  status,
  meta_title,
  meta_description,
  created_at,
  updated_at
)
SELECT
  id,
  slug,
  'course',
  title,
  description,
  thumbnail_url,
  price,
  compare_at_price,
  currency,
  allow_installments,
  is_featured,
  status,
  meta_title,
  meta_description,
  created_at,
  updated_at
FROM courses
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 3. MIGRATE USERS (from public.users)
-- Only migrate id, name, phone — skip old bloat
-- ============================================
-- Note: auth.users already exists, we just need public.users profiles
-- The trigger handle_new_user won't fire for existing users
-- so we insert manually

INSERT INTO public.users (id, name, phone, created_at, updated_at)
SELECT
  id,
  COALESCE(name, 'User'),
  phone,
  created_at,
  updated_at
FROM public.users  -- this references the OLD users table if running in same schema
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 4. MIGRATE ORDERS (from orders table)
-- ============================================
INSERT INTO orders (
  id,
  user_id,
  product_id,
  original_amount,
  paid_amount,
  currency,
  coupon_code,
  discount_amount,
  payment_gateway,
  installment_plan,
  gateway_order_id,
  gateway_txn_id,
  status,
  created_at,
  updated_at,
  completed_at
)
SELECT
  o.id,
  o.user_id,
  COALESCE(o.course_id, o.template_id),
  o.total_amount,
  o.amount,
  o.currency,
  o.coupon_code,
  o.discount_amount,
  'paymob', -- old orders were paymob
  CASE
    WHEN o.installment_plan = '2-installments' THEN '2'
    WHEN o.installment_plan = '4-installments' THEN '4'
    ELSE 'full'
  END,
  o.paymob_order_id,
  o.paymob_transaction_id,
  o.status::TEXT,
  o.created_at,
  o.updated_at,
  o.completed_at
FROM orders o
WHERE COALESCE(o.course_id, o.template_id) IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 5. MIGRATE TEMPLATE PURCHASES (guest orders)
-- ============================================
INSERT INTO orders (
  user_id,
  guest_email,
  guest_name,
  guest_phone,
  product_id,
  original_amount,
  paid_amount,
  currency,
  payment_gateway,
  installment_plan,
  gateway_txn_id,
  status,
  created_at,
  completed_at
)
SELECT
  NULL,
  email,
  name,
  phone,
  template_id,
  amount,
  amount,
  currency,
  'paymob',
  'full',
  paymob_transaction_id,
  status::TEXT,
  purchased_at,
  CASE WHEN status = 'completed' THEN purchased_at ELSE NULL END
FROM template_purchases
ON CONFLICT DO NOTHING;

-- ============================================
-- 6. MIGRATE DOWNLOAD TOKENS (from template_purchases)
-- Only migrate valid, completed ones
-- ============================================
INSERT INTO download_tokens (
  token,
  order_id,
  product_id,
  email,
  download_count,
  max_downloads,
  expires_at,
  created_at
)
SELECT
  tp.download_token,
  o.id,       -- matched order we just inserted
  tp.template_id,
  tp.email,
  tp.download_count,
  tp.max_downloads,
  tp.token_expires_at,
  tp.purchased_at
FROM template_purchases tp
JOIN orders o ON o.guest_email = tp.email
             AND o.product_id = tp.template_id
             AND o.gateway_txn_id = tp.paymob_transaction_id
WHERE tp.status = 'completed'
  AND tp.token_expires_at > NOW()
ON CONFLICT (token) DO NOTHING;

-- ============================================
-- 7. MIGRATE COUPONS
-- ============================================
INSERT INTO coupons (
  id,
  code,
  discount_type,
  discount_value,
  min_amount,
  max_discount,
  product_id,
  max_uses,
  usage_count,
  valid_from,
  valid_until,
  is_active,
  created_at
)
SELECT
  id,
  code,
  discount_type,
  discount_value,
  min_purchase_amount,
  max_discount_amount,
  course_id, -- NULL = all products (already correct)
  max_uses,
  usage_count,
  valid_from,
  valid_until,
  is_active,
  created_at
FROM coupons
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- VERIFY MIGRATION
-- ============================================
SELECT 'products'             AS table_name, COUNT(*) FROM products
UNION ALL
SELECT 'orders'               AS table_name, COUNT(*) FROM orders
UNION ALL
SELECT 'download_tokens'      AS table_name, COUNT(*) FROM download_tokens
UNION ALL
SELECT 'coupons'              AS table_name, COUNT(*) FROM coupons
UNION ALL
SELECT 'users'                AS table_name, COUNT(*) FROM public.users;
