import type { Metadata } from 'next'
import { Tajawal } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/layout/navbar'
import Footer from '@/components/layout/footer'

const tajawal = Tajawal({
  subsets: ['arabic'],
  weight: ['300', '400', '500', '700', '800'],
  variable: '--font-tajawal',
})

export const metadata: Metadata = {
  title: { default: 'Radwa Muhammed', template: '%s | Radwa Muhammed' },
  description: 'استراتيجية تسويقية، قوالب احترافية، وكورسات متخصصة للسوق المصري',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL!),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${tajawal.variable} dark`}>
      <body>
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  )
}
