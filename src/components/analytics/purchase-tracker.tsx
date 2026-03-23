'use client'

import { useEffect } from 'react'
import { trackEvent } from '@/lib/analytics'

interface PurchaseTrackerProps {
  orderId: string
  amount: number
  currency?: string
  productId?: string
  productName?: string
  coupon?: string | null
}

export default function PurchaseTracker({
  orderId,
  amount,
  currency = 'EGP',
  productId,
  productName,
  coupon,
}: PurchaseTrackerProps) {
  useEffect(() => {
    const key = `ga4_purchase:${orderId}`
    if (window.sessionStorage.getItem(key) === '1') return

    trackEvent('purchase', {
      transaction_id: orderId,
      value: amount,
      currency,
      coupon: coupon || undefined,
      items: [
        {
          item_id: productId || orderId,
          item_name: productName || 'Digital Product',
          price: amount,
          quantity: 1,
        },
      ],
    })

    window.sessionStorage.setItem(key, '1')
  }, [amount, coupon, currency, orderId, productId, productName])

  return null
}
