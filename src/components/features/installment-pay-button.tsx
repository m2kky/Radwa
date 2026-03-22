/**
 * Installment Pay Button
 *
 * Shows payment method options then redirects to gateway.
 *
 * @author Agent (Antigravity)
 * @created 2026-02-15
 * @updated 2026-02-15
 */
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

type PaymentMethod = 'card' | 'wallet'

const methods: { value: PaymentMethod; label: string }[] = [
  { value: 'card',   label: 'بطاقة بنكية' },
  { value: 'wallet', label: 'محفظة إلكترونية' },
]

interface Props {
  installmentId: string
  amount: number
}

export default function InstallmentPayButton({ installmentId, amount }: Props) {
  const [open, setOpen]       = useState(false)
  const [loading, setLoading] = useState(false)

  const handlePay = async (method: PaymentMethod) => {
    setLoading(true)
    try {
      const res = await fetch('/api/installments/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ installment_id: installmentId, payment_method: method }),
      })
      const json = await res.json()
      if (json.data?.payment_url) {
        window.location.href = json.data.payment_url
      }
    } catch (error) {
      console.error('[InstallmentPayButton]', error)
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <Button size="sm" onClick={() => setOpen(true)}>
        ادفع {amount} ج.م
      </Button>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {methods.map(m => (
        <Button
          key={m.value}
          size="sm"
          variant="outline"
          disabled={loading}
          onClick={() => handlePay(m.value)}
        >
          {m.label}
        </Button>
      ))}
      <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>إلغاء</Button>
    </div>
  )
}
