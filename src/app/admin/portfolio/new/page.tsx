import PortfolioForm from '@/components/admin/portfolio-form'

export default function NewPortfolioPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground">إضافة عمل جديد</h1>
        <p className="text-sm text-muted-foreground mt-1">
          أضف مشروعاً جديداً أو دراسة حالة للمعرض.
        </p>
      </div>

      <PortfolioForm />
    </div>
  )
}
