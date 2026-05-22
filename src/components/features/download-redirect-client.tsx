'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface Props {
  token: string
  isGuest?: boolean
}

export default function DownloadRedirectClient({ token, isGuest = false }: Props) {
  useEffect(() => {
    // Start download via main window, it won't navigate away if it's a file attachment
    window.location.href = `/api/download/${encodeURIComponent(token)}`
  }, [token])

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-4">
        <h1 className="text-2xl font-bold font-serif">جاري بدء التحميل...</h1>
        <p className="text-muted-foreground">
          إذا لم يبدأ التحميل تلقائياً، يمكنك الضغط على زر التحميل بالأسفل.
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

