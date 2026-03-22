/**
 * Global TypeScript Types
 * @author Antigravity
 * @created 2026
 */

export type ProductType = 'course' | 'digital'
export type ProductStatus = 'draft' | 'published' | 'archived'
export type OrderStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'suspended'
export type InstallmentStatus = 'none' | 'pending' | 'approved' | 'rejected'
export type InstallmentPlan = 'full' | '2' | '4'
export type PaymentMethod = 'card' | 'wallet'
export type PaymentGateway = 'paymob'
export type InstallmentPaymentStatus = 'pending' | 'paid' | 'overdue'

export interface Product {
  id: string
  slug: string
  type: ProductType
  title: string
  description: string | null
  thumbnail_url: string | null
  price: number
  compare_at_price: number | null
  currency: string
  installments_enabled: boolean
  files: ProductFile[] | null
  lessons: ProductLesson[] | null
  is_featured: boolean
  status: ProductStatus
  meta_title: string | null
  meta_description: string | null
  created_at: string
  updated_at: string
}

export interface ProductFile {
  name: string
  storage_path: string
  size: number
}

export interface ProductLesson {
  title: string
  bunny_id: string
  duration_seconds: number
  is_free_preview: boolean
}

export interface Order {
  id: string
  user_id: string | null
  guest_email: string | null
  guest_name: string | null
  guest_phone: string | null
  product_id: string
  original_amount: number
  paid_amount: number
  currency: string
  coupon_code: string | null
  discount_amount: number
  payment_method: PaymentMethod | null
  payment_gateway: PaymentGateway | null
  installment_plan: InstallmentPlan | null
  gateway_order_id: string | null
  gateway_txn_id: string | null
  status: OrderStatus
  created_at: string
  updated_at: string
  completed_at: string | null
}

export interface InstallmentPayment {
  id: string
  order_id: string
  user_id: string
  amount: number
  due_date: string
  paid_at: string | null
  gateway_order_id: string | null
  gateway_txn_id: string | null
  status: InstallmentPaymentStatus
  created_at: string
}

export interface DownloadToken {
  id: string
  token: string
  order_id: string
  product_id: string
  user_id: string | null
  email: string
  download_count: number
  max_downloads: number
  expires_at: string
  created_at: string
}

export interface Coupon {
  id: string
  code: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  min_amount: number | null
  max_discount: number | null
  product_id: string | null
  max_uses: number | null
  usage_count: number
  valid_from: string
  valid_until: string | null
  is_active: boolean
  created_at: string
}

export interface User {
  id: string
  name: string
  phone: string | null
  installment_status: InstallmentStatus
  id_front_url: string | null
  id_back_url: string | null
  photo_url: string | null
  rejection_reason: string | null
  created_at: string
  updated_at: string
}

// User progress tracking for courses
export interface UserProgress {
  id: string
  user_id: string
  product_id: string
  lesson_index: number
  watched_seconds: number
  completed: boolean
  last_watched_at: string
  created_at: string
}

// Course enrollment tracking
export interface UserEnrollment {
  id: string
  user_id: string
  product_id: string
  order_id: string | null
  status: 'active' | 'completed' | 'suspended'
  progress_percent: number
  started_at: string
  completed_at: string | null
  last_accessed_at: string
  created_at: string
}

// Checkout types
export interface CheckoutCustomer {
  name: string
  email: string
  phone: string
}

export interface CheckoutPayload {
  product_id: string
  payment_method: PaymentMethod
  payment_gateway: PaymentGateway
  installment_plan: InstallmentPlan
  coupon_code?: string
  customer: CheckoutCustomer
}
