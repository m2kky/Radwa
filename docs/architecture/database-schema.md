# Database Schema — Radwa v2

## Tables

### 1. `users`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | FK → auth.users(id) |
| `name` | TEXT | NOT NULL |
| `phone` | TEXT | nullable |
| `installment_status` | TEXT | `none` / `pending` / `approved` / `rejected` |
| `id_front_url` | TEXT | KYC: صورة البطاقة (أمام) |
| `id_back_url` | TEXT | KYC: صورة البطاقة (خلف) |
| `photo_url` | TEXT | صورة شخصية |
| `rejection_reason` | TEXT | nullable |
| `created_at` | TIMESTAMPTZ | auto |
| `updated_at` | TIMESTAMPTZ | auto (trigger) |

### 2. `products`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | auto |
| `slug` | TEXT UNIQUE | URL-safe identifier |
| `type` | TEXT | `course` / `digital` |
| `title` | TEXT | NOT NULL |
| `description` | TEXT | nullable |
| `thumbnail_url` | TEXT | nullable |
| `price` | NUMERIC(10,2) | NOT NULL |
| `compare_at_price` | NUMERIC(10,2) | nullable (strikethrough price) |
| `currency` | TEXT | default `EGP` |
| `installments_enabled` | BOOLEAN | default false |
| `files` | JSONB | `[{storage_path, name}]` for digital products |
| `lessons` | JSONB | for course products |
| `is_featured` | BOOLEAN | default false |
| `status` | TEXT | `draft` / `published` / `archived` |
| `meta_title` | TEXT | SEO |
| `meta_description` | TEXT | SEO |
| `created_at` / `updated_at` | TIMESTAMPTZ | auto |

### 3. `orders`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | auto |
| `user_id` | UUID FK→users | nullable (guest orders) |
| `guest_email` / `guest_name` / `guest_phone` | TEXT | for non-authenticated purchases |
| `product_id` | UUID FK→products | NOT NULL |
| `original_amount` | NUMERIC | قبل الخصم |
| `paid_amount` | NUMERIC | المبلغ المدفوع فعلاً |
| `currency` | TEXT | default `EGP` |
| `coupon_code` | TEXT | nullable |
| `discount_amount` | NUMERIC | default 0 |
| `payment_method` | TEXT | `card` / `wallet` |
| `payment_gateway` | TEXT | `paymob` |
| `installment_plan` | TEXT | `full` / `2` / `4` |
| `gateway_order_id` | TEXT | من بوابة الدفع |
| `gateway_txn_id` | TEXT | رقم المعاملة |
| `status` | TEXT | `pending` / `completed` / `failed` / `refunded` / `suspended` |
| `created_at` / `updated_at` / `completed_at` | TIMESTAMPTZ | |

### 4. `installment_payments`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | auto |
| `order_id` | UUID FK→orders | NOT NULL |
| `user_id` | UUID FK→users | NOT NULL |
| `amount` | NUMERIC | مبلغ القسط |
| `due_date` | DATE | تاريخ الاستحقاق |
| `paid_at` | TIMESTAMPTZ | nullable |
| `gateway_order_id` / `gateway_txn_id` | TEXT | |
| `status` | TEXT | `pending` / `paid` / `overdue` |
| `created_at` | TIMESTAMPTZ | auto |

### 5. `download_tokens`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | auto |
| `token` | TEXT UNIQUE | الرابط الفريد |
| `order_id` | UUID FK→orders | |
| `product_id` | UUID FK→products | |
| `user_id` | UUID FK→users | nullable |
| `email` | TEXT | NOT NULL |
| `download_count` | INTEGER | default 0 |
| `max_downloads` | INTEGER | default 5 |
| `expires_at` | TIMESTAMPTZ | NULL = permanent |
| `created_at` | TIMESTAMPTZ | auto |

### 6. `coupons`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | auto |
| `code` | TEXT UNIQUE | الكود |
| `discount_type` | TEXT | `percentage` / `fixed` |
| `discount_value` | NUMERIC | القيمة |
| `min_amount` | NUMERIC | الحد الأدنى للطلب |
| `max_discount` | NUMERIC | أقصى خصم (للنسبة المئوية) |
| `product_id` | UUID FK→products | nullable (null = all products) |
| `max_uses` | INTEGER | nullable (null = unlimited) |
| `usage_count` | INTEGER | default 0 |
| `valid_from` / `valid_until` | TIMESTAMPTZ | فترة الصلاحية |
| `is_active` | BOOLEAN | default true |
| `created_at` | TIMESTAMPTZ | auto |

### 7. `verification_otps`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | auto |
| `email` | TEXT | NOT NULL |
| `code` | TEXT | 6-digit code |
| `type` | TEXT | `signup` |
| `used` | BOOLEAN | default false |
| `used_at` | TIMESTAMPTZ | nullable |
| `expires_at` | TIMESTAMPTZ | NOT NULL (10 min from creation) |
| `created_at` | TIMESTAMPTZ | auto |

### 8. `blog_posts`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | auto |
| `slug` | VARCHAR UNIQUE | URL slug |
| `title` / `excerpt` / `content` | TEXT | |
| `thumbnail_url` / `featured_image_url` | TEXT | |
| `category` / `tags` | VARCHAR / TEXT[] | |
| `author_name` | TEXT | |
| `views_count` / `read_time_minutes` | INTEGER | |
| `status` | VARCHAR | `draft` / `published` / `archived` |
| `is_featured` | BOOLEAN | |
| `meta_title` / `meta_description` | TEXT | SEO |
| `published_at` / `created_at` / `updated_at` | TIMESTAMPTZ | |

## RLS Policies

| Table | Policy | Rule |
|-------|--------|------|
| `users` | `users_own` | `auth.uid() = id` |
| `products` | `products_public_read` | `status = 'published'` |
| `orders` | `orders_select_own` | `auth.uid() = user_id` |
| `installment_payments` | `installments_own` | `auth.uid() = user_id` |
| `download_tokens` | `tokens_own` | `auth.uid() = user_id` |
| `coupons` | `coupons_public_read` | `is_active = true` |
| `blog_posts` | `blog_public_read` | `status = 'published'` |
| `verification_otps` | (none) | Admin client only |

## Triggers

| Trigger | Table | Action |
|---------|-------|--------|
| `products_updated_at` | products | Set `updated_at = NOW()` on UPDATE |
| `orders_updated_at` | orders | Set `updated_at = NOW()` on UPDATE |
| `blog_posts_updated_at` | blog_posts | Set `updated_at = NOW()` on UPDATE |
| `users_updated_at` | users | Set `updated_at = NOW()` on UPDATE |
| `on_auth_user_created` | auth.users | Auto-create public.users record |

## Functions

| Function | Purpose |
|----------|---------|
| `set_updated_at()` | Trigger function — updates `updated_at` column |
| `handle_new_user()` | Creates public.users on auth.users INSERT |
| `increment_coupon_usage(code)` | Atomically increment coupon usage_count |
