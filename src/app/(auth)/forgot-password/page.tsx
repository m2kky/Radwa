'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSent(false)

    try {
      const supabase = createClient()
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      })

      if (resetError) {
        throw resetError
      }

      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء إرسال رابط الاستعادة')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold">استعادة كلمة المرور</h1>
          <p className="text-sm text-muted-foreground">أدخل بريدك الإلكتروني لإرسال رابط إعادة التعيين</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {sent && <p className="text-sm text-primary">تم إرسال رابط الاستعادة على بريدك.</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'جاري الإرسال...' : 'إرسال رابط الاستعادة'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          <Link href="/login" className="text-primary hover:underline">العودة لتسجيل الدخول</Link>
        </p>
      </div>
    </main>
  )
}
