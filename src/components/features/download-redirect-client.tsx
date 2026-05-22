'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface Props {
  token: string
  isGuest?: boolean
}

export default function DownloadRedirectClient({ token, isGuest = false }: Props) {
  const router = useRouter()

  useEffect(() => {
    const iframe = document.createElement('iframe')
    iframe.style.display = 'none'
    iframe.src = `/api/download/${encodeURIComponent(token)}`
    document.body.appendChild(iframe)

    const timer = window.setTimeout(() => {
      if (isGuest) {
        router.replace('/')
      } else {
        router.replace('/dashboard')
      }
    }, 1800)

    return () => {
      window.clearTimeout(timer)
      iframe.remove()
    }
  }, [router, token, isGuest])

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-4">
        <h1 className="text-2xl font-bold font-serif">جاري بدء التحميل...</h1>
        <p className="text-muted-foreground">
          {isGuest 
            ? 'سيتم تحويلك تلقائيًا إلى الصفحة الرئيسية خلال ثوانٍ.'
            : 'سيتم تحويلك تلقائيًا إلى الداشبورد خلال ثوانٍ.'}
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <a href={`/api/download/${token}`} className="w-full sm:w-auto">
            <Button variant="outline" className="w-full">
              تحميل مرة أخرى
            </Button>
          </a>
          {isGuest ? (
            <Link href="/" className="w-full sm:w-auto">
              <Button className="w-full">الذهاب للرئيسية</Button>
            </Link>
          ) : (
            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button className="w-full">الذهاب للداشبورد</Button>
            </Link>
          )}
        </div>
      </div>
    </main>
  )
}
