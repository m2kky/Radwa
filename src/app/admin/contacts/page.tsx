import { createAdminClient } from '@/lib/supabase/server'
import ContactsManager from '@/components/admin/contacts-manager'
import type { ContactMessage } from '@/types'

async function getContacts(): Promise<ContactMessage[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('contacts')
    .select('id, name, email, company, service, message, source, created_at')
    .order('created_at', { ascending: false })
    .limit(200)

  return (data ?? []) as ContactMessage[]
}

export default async function AdminContactsPage() {
  const contacts = await getContacts()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground">رسائل التواصل</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          متابعة الرسائل المرسلة من صفحة التواصل والفورم العام.
        </p>
      </div>

      <ContactsManager contacts={contacts} />
    </div>
  )
}
