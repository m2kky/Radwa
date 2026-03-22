import ContentManager from '@/components/admin/content-manager'
import { getSiteContentSettings } from '@/lib/site-content-server'

export const metadata = { title: 'محتوى الموقع' }

export default async function AdminContentPage() {
  const settings = await getSiteContentSettings()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground">محتوى الموقع</h1>
        <p className="text-sm text-muted-foreground mt-1">
          تحكم كامل في بيانات الموقع، الشهادات، الـ timeline، والصفحات القانونية.
        </p>
      </div>

      <ContentManager initial={settings} />
    </div>
  )
}
