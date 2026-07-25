import { Mail } from 'lucide-react'
import type { ContactMessage } from '@/types'

export default function ContactsManager({ contacts }: { contacts: ContactMessage[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-cold-dark">
      <div className="border-b border-border px-5 py-4">
        <h2 className="font-semibold text-foreground">رسائل التواصل</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          كل الرسائل المرسلة من فورم التواصل العام.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="px-6 py-3 text-right font-medium">العميل</th>
              <th className="px-6 py-3 text-right font-medium">الشركة</th>
              <th className="px-6 py-3 text-right font-medium">الخدمة</th>
              <th className="px-6 py-3 text-right font-medium">الرسالة</th>
              <th className="px-6 py-3 text-right font-medium">المصدر</th>
              <th className="px-6 py-3 text-right font-medium">التاريخ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {contacts.map((contact) => (
              <tr key={contact.id} className="align-top hover:bg-white/[0.02]">
                <td className="px-6 py-4">
                  <p className="font-medium text-foreground">{contact.name}</p>
                  <a
                    href={`mailto:${contact.email}`}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-cyan-glow"
                    dir="ltr"
                  >
                    <Mail size={12} />
                    {contact.email}
                  </a>
                </td>
                <td className="px-6 py-4 text-muted-foreground">{contact.company || '-'}</td>
                <td className="px-6 py-4 text-foreground">{contact.service}</td>
                <td className="max-w-md whitespace-pre-line px-6 py-4 leading-7 text-muted-foreground">
                  {contact.message}
                </td>
                <td className="px-6 py-4 text-xs text-muted-foreground">{contact.source || '-'}</td>
                <td className="px-6 py-4 text-xs text-muted-foreground">
                  {new Date(contact.created_at).toLocaleString('ar-EG')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {contacts.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">لا توجد رسائل تواصل حتى الآن.</p>
      ) : null}
    </div>
  )
}
