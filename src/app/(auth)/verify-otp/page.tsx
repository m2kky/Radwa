/**
 * Verify OTP Page
 * 
 * Handles 6-digit code entry and final account creation.
 * 
 * @endpoint GET /verify-otp
 */
'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message
  }
  return fallback
}

function decodeLegacyPassword(value: string | null): string | null {
  if (!value) return null
  try {
    return atob(value)
  } catch {
    return null
  }
}

function VerifyOTPContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const email = searchParams.get('email')
  const name = searchParams.get('name')
  const legacyPassword = searchParams.get('p')

  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [password, setPassword] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    if (!email) {
      setHydrated(true)
      return
    }

    const normalizedEmail = email.trim().toLowerCase()
    const stored = sessionStorage.getItem(`signup_password:${normalizedEmail}`)
    const legacy = decodeLegacyPassword(legacyPassword)
    setPassword(stored ?? legacy)
    setHydrated(true)
  }, [email, legacyPassword])

  // Redirect if missing params
  useEffect(() => {
    if (hydrated && (!email || !name || !password)) {
      router.push('/signup')
    }
  }, [email, name, password, router, hydrated])

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !name || !password) {
      toast.error('بيانات التسجيل غير مكتملة')
      router.push('/signup')
      return
    }

    if (code.length !== 6) {
      toast.error('يرجى إدخال كود التحقق المكون من 6 أرقام')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, code, password }),
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error?.message || 'فشل التحقق من الكود')
      }

      toast.success('تم تفعيل حسابك بنجاح!')
      const normalizedEmail = email.trim().toLowerCase()
      sessionStorage.removeItem(`signup_password:${normalizedEmail}`)

      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      })

      if (signInError) {
        router.push('/login?verified=true')
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'فشل التحقق من الكود'))
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    if (!email || !name) {
      toast.error('بيانات التسجيل غير مكتملة')
      router.push('/signup')
      return
    }

    setResending(true)
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      })

      if (!res.ok) throw new Error('فشل إرسال الكود مرة أخرى')
      
      toast.success('تم إرسال كود جديد لبريدك الإلكتروني')
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'فشل إرسال الكود مرة أخرى'))
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="w-full max-w-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold font-serif tracking-tight">تحقق من بريدك</h1>
        <p className="text-muted-foreground text-sm">
          أدخل الكود المرسل إلى <span className="text-foreground font-medium">{email}</span>
        </p>
      </div>

      <form onSubmit={handleVerify} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="code" className="text-right block">كود التحقق</Label>
          <Input
            id="code"
            type="text"
            placeholder="000000"
            className="text-center text-2xl tracking-[0.5em] h-14 font-mono font-bold"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            required
            autoComplete="one-time-code"
          />
        </div>

        <Button type="submit" className="w-full h-12 text-lg font-bold" disabled={loading}>
          {loading ? <Loader2 className="w-5 h-5 animate-spin ml-2" /> : null}
          {loading ? 'جاري التحقق...' : 'تأكيد الحساب'}
        </Button>
      </form>

      <div className="text-center">
        <button
          onClick={handleResend}
          disabled={resending}
          className="text-sm text-primary hover:underline disabled:opacity-50 disabled:no-underline"
        >
          {resending ? 'جاري الإرسال...' : 'إرسال الكود مرة أخرى'}
        </button>
      </div>
    </div>
  )
}

export default function VerifyOTPPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Suspense fallback={<Loader2 className="w-8 h-8 animate-spin text-primary" />}>
        <VerifyOTPContent />
      </Suspense>
    </main>
  )
}
