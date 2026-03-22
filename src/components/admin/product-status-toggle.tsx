/**
 * Product Status Toggle
 *
 * Client component — toggles boolean fields on a product via PATCH API.
 *
 * @phase Phase 5: Admin
 * @author Agent (Antigravity)
 * @created 2026-02-15
 */
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  id: string
  field: 'installments_enabled' | 'is_featured'
  value: boolean
}

export default function ProductStatusToggle({ id, field, value }: Props) {
  const [checked, setChecked] = useState(value)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const toggle = async () => {
    setLoading(true)
    const next = !checked
    setChecked(next)
    try {
      await fetch(`/api/admin/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: next }),
      })
      router.refresh()
    } catch {
      setChecked(!next)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`w-10 h-5 rounded-full transition-colors relative ${checked ? 'bg-cyan-glow' : 'bg-zinc-700'}`}
    >
      <span
        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${checked ? 'right-0.5' : 'left-0.5'}`}
      />
    </button>
  )
}
