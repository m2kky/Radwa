interface FAQItem {
  question: string
  answer: string
}

interface FAQSectionProps {
  title: string
  subtitle?: string
  items: FAQItem[]
  className?: string
}

export default function FAQSection({ title, subtitle, items, className = '' }: FAQSectionProps) {
  if (items.length === 0) return null

  return (
    <section className={`container mx-auto px-4 py-16 ${className}`}>
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground">{title}</h2>
          {subtitle ? <p className="text-muted-foreground">{subtitle}</p> : null}
        </div>

        <div className="space-y-3">
          {items.map((item, index) => (
            <details
              key={`${item.question}-${index}`}
              className="bg-cold-dark border border-border rounded-xl px-4 py-3 open:border-primary/40 transition-colors"
            >
              <summary className="cursor-pointer font-medium text-foreground list-none">
                {item.question}
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
