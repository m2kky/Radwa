import type { Metadata } from 'next'
import { Tajawal } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import Navbar from '@/components/layout/navbar'
import Footer from '@/components/layout/footer'
import SitePopup from '@/components/layout/site-popup'
import { getSiteContentSettings } from '@/lib/site-content-server'

const tajawal = Tajawal({
  subsets: ['arabic'],
  weight: ['300', '400', '500', '700', '800'],
  variable: '--font-tajawal',
})

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.radwamuhammed.com'
const siteTitle = 'Radwa Muhammed'
const siteDescription = 'استراتيجية تسويقية، قوالب احترافية، وكورسات متخصصة للسوق المصري'
const ogImage = {
  url: '/og-radwa.jpg',
  width: 1200,
  height: 630,
  alt: 'Radwa Muhammed',
}

export const metadata: Metadata = {
  title: { default: siteTitle, template: `%s | ${siteTitle}` },
  description: siteDescription,
  applicationName: siteTitle,
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/radwa-icon.png', type: 'image/png', sizes: '512x512' },
    ],
    shortcut: '/favicon.ico',
    apple: { url: '/apple-icon.png', type: 'image/png', sizes: '180x180' },
  },
  openGraph: {
    type: 'website',
    locale: 'ar_EG',
    url: siteUrl,
    siteName: siteTitle,
    title: siteTitle,
    description: siteDescription,
    images: [ogImage],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteTitle,
    description: siteDescription,
    images: ['/og-radwa.jpg'],
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const contentSettings = await getSiteContentSettings()
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

  return (
    <html lang="ar" dir="rtl" className={`${tajawal.variable} dark`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        {gaId ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}');
              `}
            </Script>
          </>
        ) : null}
        <Navbar settings={contentSettings.siteGeneral} />
        <SitePopup />
        {children}
        <Footer settings={contentSettings.siteGeneral} />
      </body>
    </html>
  )
}
