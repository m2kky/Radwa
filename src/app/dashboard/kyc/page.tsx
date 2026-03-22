'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function KycPage() {
  const [idFrontUrl, setIdFrontUrl] = useState('')
  const [idBackUrl, setIdBackUrl] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const res = await fetch('/api/installments/kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_front_url: idFrontUrl,
          id_back_url: idBackUrl,
          photo_url: photoUrl,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error?.message ?? 'حدث خطأ أثناء إرسال الطلب')
      }

      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء إرسال الطلب')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="container max-w-2xl mx-auto px-4 py-12">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">تفعيل التقسيط (KYC)</h1>
          <p className="text-sm text-muted-foreground">
            ارفع روابط صور البطاقة والصورة الشخصية. سيتم مراجعة الطلب وتفعيل التقسيط بعد الموافقة.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="id_front_url">رابط صورة البطاقة (أمام)</Label>
            <Input
              id="id_front_url"
              type="url"
              required
              dir="ltr"
              value={idFrontUrl}
              onChange={(e) => setIdFrontUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="id_back_url">رابط صورة البطاقة (خلف)</Label>
            <Input
              id="id_back_url"
              type="url"
              required
              dir="ltr"
              value={idBackUrl}
              onChange={(e) => setIdBackUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="photo_url">رابط الصورة الشخصية</Label>
            <Input
              id="photo_url"
              type="url"
              required
              dir="ltr"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && (
            <p className="text-sm text-primary">
              تم إرسال طلب التفعيل بنجاح. حالة حسابك الآن: قيد المراجعة.
            </p>
          )}

          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? 'جاري الإرسال...' : 'إرسال طلب التفعيل'}
            </Button>
            <Link href="/dashboard">
              <Button type="button" variant="outline">العودة للداشبورد</Button>
            </Link>
          </div>
        </form>
      </div>
    </main>
  )
}
