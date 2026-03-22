import type { Metadata } from 'next'
import LegalShell from '@/components/legal/legal-shell'
import { getSiteContentSettings } from '@/lib/site-content-server'

export const metadata: Metadata = {
  title: 'سياسة الخصوصية',
  description: 'طريقة جمع واستخدام وحماية البيانات على منصة رضوى محمد',
}

export default async function PrivacyPage() {
  const { legalPrivacy } = await getSiteContentSettings()
  return (
    <LegalShell
      title={legalPrivacy.title}
      subtitle={legalPrivacy.subtitle}
      lastUpdated={legalPrivacy.lastUpdated}
      sections={legalPrivacy.sections}
    />
  )
}
