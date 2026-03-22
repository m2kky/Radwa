import type { Metadata } from 'next'
import LegalShell from '@/components/legal/legal-shell'
import { getSiteContentSettings } from '@/lib/site-content-server'

export const metadata: Metadata = {
  title: 'سياسة الاسترجاع',
  description: 'سياسة الاسترجاع والاسترداد للمنتجات الرقمية على منصة رضوى محمد',
}

export default async function RefundPage() {
  const { legalRefund } = await getSiteContentSettings()
  return (
    <LegalShell
      title={legalRefund.title}
      subtitle={legalRefund.subtitle}
      lastUpdated={legalRefund.lastUpdated}
      sections={legalRefund.sections}
    />
  )
}
