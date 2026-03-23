import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import ShopCatalog from '@/components/features/shop-catalog'
import FAQSection from '@/components/features/faq-section'
import type { Product } from '@/types'

export const metadata: Metadata = {
  title: 'المتجر',
  description: 'قوالب احترافية وكورسات متخصصة في الاستراتيجية والتسويق الرقمي للسوق المصري',
}

export default async function ShopPage() {
  const supabase = await createClient()

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('status', 'published')
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })

  const all = (products ?? []) as Product[]
  const faqItems = [
    {
      question: 'هل التحميل متاح مباشرة بعد الدفع؟',
      answer: 'نعم، بعد تأكيد الدفع يظهر زر التحميل فورًا ويتم إرسال رابط دائم أيضًا على البريد الإلكتروني.',
    },
    {
      question: 'هل يمكن الدفع بالمحفظة الإلكترونية؟',
      answer: 'نعم، بوابة Paymob تدعم الدفع بالبطاقات البنكية والمحافظ الإلكترونية.',
    },
    {
      question: 'هل يمكنني استرجاع المنتج بعد الشراء؟',
      answer: 'يرجى مراجعة سياسة الاسترجاع في الموقع، لأن المنتجات الرقمية غالبًا تكون غير قابلة للاسترجاع بعد التحميل.',
    },
    {
      question: 'هل في إمكانية التقسيط؟',
      answer: 'بعض المنتجات تدعم التقسيط. ستجد علامة "متاح بالأقساط" على المنتج قبل إتمام الشراء.',
    },
  ]

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }

  return (
    <main className="min-h-screen bg-background">
      <ShopCatalog products={all} />
      <FAQSection
        title="أسئلة شائعة قبل الشراء"
        subtitle="إجابات سريعة على أكثر الأسئلة تكرارًا في المتجر."
        items={faqItems}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    </main>
  )
}
