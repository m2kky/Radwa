import ServiceForm from '@/components/admin/service-form'

export default function NewServicePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground">إضافة خدمة</h1>
        <p className="mt-1 text-sm text-muted-foreground">أضف خدمة جديدة وحدد نوع CTA الخاص بها.</p>
      </div>

      <ServiceForm />
    </div>
  )
}
