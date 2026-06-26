import GuideForm from '@/components/admin/guide-form'

export default function NewGuidePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground">إضافة Guide / Template</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          أضف مورد مجاني بملف تحميل ومحتوى rich text.
        </p>
      </div>

      <GuideForm />
    </div>
  )
}
