import type { Metadata } from 'next'
import LegalShell from '@/components/legal/legal-shell'
import { getSiteContentSettings } from '@/lib/site-content-server'

export const metadata: Metadata = {
  title: 'شروط الخدمة',
  description: 'شروط الاستخدام والخدمة لمنصة رضوى محمد',
}

export default async function TermsPage() {
  const { legalTerms } = await getSiteContentSettings()
  return (
    <LegalShell
      title={legalTerms.title}
      subtitle={legalTerms.subtitle}
      lastUpdated={legalTerms.lastUpdated}
      sections={legalTerms.sections}
    />
  )
}
