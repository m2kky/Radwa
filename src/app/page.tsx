/**
 * Homepage
 *
 * Full homepage with all sections mirroring v1:
 * Hero → HomeAbout → StrategyWheel → Timeline → FeaturedProducts → Testimonials+Blog → CTA → ContactForm
 *
 * @endpoint GET /
 * @auth Not required (public)
 * @phase Phase 4: Public Pages
 * @author Agent (Antigravity)
 * @created 2026-02-15
 * @updated 2026-02-15
 */
import { createClient } from '@/lib/supabase/server'
import Hero from '@/components/home/hero'
import HomeAbout from '@/components/home/about-teaser'
import StrategyWheel from '@/components/home/strategy-wheel'
import Timeline from '@/components/home/timeline'
import FeaturedProducts from '@/components/home/featured-products'
import Testimonials from '@/components/home/testimonials'
import CTA from '@/components/home/cta'
import ContactForm from '@/components/home/contact-form'
import { getSiteContentSettings } from '@/lib/site-content-server'

export const metadata = {
  title: 'Radwa Muhammed | استراتيجية • تسويق • محتوى',
  description: 'منصة رضوى محمد للمنتجات الرقمية الاحترافية في الاستراتيجية والتسويق وإدارة المحتوى',
}

export default async function Home() {
  const supabase = await createClient()

  const [{ data: products }, { data: posts }, contentSettings] = await Promise.all([
    supabase.from('products').select('id, slug, title, description, thumbnail_url, price, compare_at_price, currency, installments_enabled').eq('is_featured', true).eq('status', 'published').limit(3),
    supabase
      .from('blog_posts')
      .select('id, slug, title, category, published_at, featured_image_url, thumbnail_url')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(3),
    getSiteContentSettings(),
  ])

  const normalizedPosts = (posts ?? []).map((post) => ({
    ...post,
    category: post.category ?? '',
    featured_image_url: post.featured_image_url ?? post.thumbnail_url ?? '',
  }))

  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: contentSettings.siteGeneral.display_name || 'Radwa Muhammed',
    url: process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.radwamuhammed.com',
    logo: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.radwamuhammed.com'}/radwa.jpg`,
    sameAs: [],
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: contentSettings.siteGeneral.contact_email || undefined,
        telephone: contentSettings.siteGeneral.contact_phone || undefined,
        areaServed: 'EG',
        availableLanguage: ['ar', 'en'],
      },
    ],
  }

  return (
    <div className="flex flex-col w-full">
      <Hero />
      <HomeAbout />
      <StrategyWheel />
      <Timeline content={contentSettings.homeTimeline} />
      <FeaturedProducts products={products ?? []} />
      <Testimonials
        blogPosts={normalizedPosts}
        testimonials={contentSettings.homeTestimonials}
        title={contentSettings.siteGeneral.testimonials_title}
        subtitle={contentSettings.siteGeneral.testimonials_subtitle}
      />
      <CTA />
      <ContactForm
        contactEmail={contentSettings.siteGeneral.contact_email}
        contactPhone={contentSettings.siteGeneral.contact_phone}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
    </div>
  )
}
