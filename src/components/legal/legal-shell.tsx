import Link from 'next/link'

type LegalSection = {
  title: string
  items: string[]
}

type LegalShellProps = {
  title: string
  subtitle: string
  lastUpdated: string
  sections: LegalSection[]
}

export default function LegalShell({
  title,
  subtitle,
  lastUpdated,
  sections,
}: LegalShellProps) {
  return (
    <main className="relative min-h-screen bg-cold-black py-14 md:py-20 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 -left-20 w-80 h-80 rounded-full bg-cyan-glow/10 blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6">
        <div className="glass-teal rounded-2xl p-6 md:p-10 border border-primary/10">
          <header className="mb-8 md:mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-ice-white">{title}</h1>
            <p className="mt-3 text-sm md:text-base text-muted-foreground leading-relaxed">{subtitle}</p>
            <p className="mt-4 text-xs md:text-sm text-primary">آخر تحديث: {lastUpdated}</p>
          </header>

          <div className="space-y-7 md:space-y-8">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-xl md:text-2xl font-bold text-ice-white mb-3">{section.title}</h2>
                <ul className="space-y-2 text-sm md:text-base text-muted-foreground leading-relaxed list-disc pr-5">
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <div className="mt-10 pt-6 border-t border-white/10 flex flex-wrap items-center gap-3 text-sm">
            <Link href="/terms" className="text-primary hover:underline">شروط الخدمة</Link>
            <span className="text-muted-foreground">•</span>
            <Link href="/privacy" className="text-primary hover:underline">الخصوصية</Link>
            <span className="text-muted-foreground">•</span>
            <Link href="/refund" className="text-primary hover:underline">سياسة الاسترجاع</Link>
            <span className="text-muted-foreground">•</span>
            <Link href="/" className="text-primary hover:underline">العودة للرئيسية</Link>
          </div>
        </div>
      </div>
    </main>
  )
}
