
export const metadata = {
  title: 'أعمالي ودراسات الحالة | رضوى محمد',
  description: 'معرض يضم أبرز المشاريع التسويقية ودراسات الحالة التي قمت بتنفيذها.',
}

export default async function PortfolioPage() {
  return (
    <div className="min-h-screen bg-cold-black text-ice-white pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-center mb-6">
          أعمالي و <span className="text-cyan-glow">دراسات الحالة</span>
        </h1>
        <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-16">
          قريباً... نعمل على تجهيز هذا المعرض لعرض أبرز المشاريع والأرقام.
        </p>
      </div>
    </div>
  )
}
