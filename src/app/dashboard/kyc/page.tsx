'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

export default function KycPage() {
  const [idFrontFile, setIdFrontFile] = useState<File | null>(null)
  const [idBackFile, setIdBackFile] = useState<File | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      if (!idFrontFile || !idBackFile || !photoFile) {
        throw new Error('يرجى رفع كل المستندات المطلوبة')
      }

      const body = new FormData()
      body.append('id_front', idFrontFile)
      body.append('id_back', idBackFile)
      body.append('photo', photoFile)

      const res = await fetch('/api/installments/kyc', {
        method: 'POST',
        body,
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
            ارفع صور البطاقة والصورة الشخصية من جهازك. سيتم مراجعة الطلب وتفعيل التقسيط بعد الموافقة.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="id_front_file">صورة البطاقة (أمام)</Label>
            <input
              id="id_front_file"
              type="file"
              accept="image/*,.pdf"
              required
              onChange={(e) => setIdFrontFile(e.target.files?.[0] ?? null)}
              className="w-full bg-cold-black border border-border rounded-lg px-4 py-2.5 text-sm text-foreground"
            />
            {idFrontFile ? <p className="text-xs text-muted-foreground">{idFrontFile.name}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="id_back_file">صورة البطاقة (خلف)</Label>
            <input
              id="id_back_file"
              type="file"
              accept="image/*,.pdf"
              required
              onChange={(e) => setIdBackFile(e.target.files?.[0] ?? null)}
              className="w-full bg-cold-black border border-border rounded-lg px-4 py-2.5 text-sm text-foreground"
            />
            {idBackFile ? <p className="text-xs text-muted-foreground">{idBackFile.name}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="photo_file">الصورة الشخصية</Label>
            <input
              id="photo_file"
              type="file"
              accept="image/*,.pdf"
              required
              onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
              className="w-full bg-cold-black border border-border rounded-lg px-4 py-2.5 text-sm text-foreground"
            />
            {photoFile ? <p className="text-xs text-muted-foreground">{photoFile.name}</p> : null}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && (
            <p className="text-sm text-primary">
              تم إرسال طلب التفعيل بنجاح. حالة حسابك الآن: قيد المراجعة.
            </p>
          )}

          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
              {loading ? 'جاري الرفع...' : 'إرسال طلب التفعيل'}
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
