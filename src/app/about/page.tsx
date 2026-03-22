/**
 * About Page
 *
 * Full about page mirroring v1: Hero → FocusText → Philosophy → Story → CTA
 *
 * @phase Phase 4: Public Pages
 * @author Agent (Antigravity)
 * @created 2026-02-15
 * @updated 2026-02-15
 */
import Link from 'next/link'
import { AboutHero } from '@/components/about/about-hero'
import { AboutFocusText } from '@/components/about/about-focus-text'
import { AboutPhilosophy } from '@/components/about/about-philosophy'
import { AboutStory } from '@/components/about/about-story'
import { getSiteContentSettings } from '@/lib/site-content-server'

export const metadata = { title: 'من أنا — رضوى محمد' }

export default async function AboutPage() {
  const contentSettings = await getSiteContentSettings()

  return (
    <main className="min-h-screen bg-cold-black">
      <AboutHero />

      <div className="relative z-20 bg-cold-black">
        <AboutFocusText />
      </div>

      <AboutPhilosophy />
      <AboutStory milestones={contentSettings.aboutMilestones} />

      {/* CTA */}
      <section className="py-24 relative overflow-hidden text-center">
        <div className="absolute inset-0 bg-gradient-to-t from-cyan-glow/10 to-transparent pointer-events-none" />
        <div className="container px-6 mx-auto relative z-10">
          <h2 className="text-4xl md:text-6xl font-serif text-ice-white font-bold mb-8">
            دعنا نبني شيئًا <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-glow to-purple-500">أسطوريًا</span>
          </h2>
          <p className="text-ice-white/70 max-w-2xl mx-auto mb-10 text-lg">
            سواء كنت بحاجة إلى إصلاح استراتيجي كامل أو مجرد منظور جديد، أنا مستعدة للاستماع والمساعدة.
          </p>
          <Link
            href="/#contact"
            className="inline-flex h-14 px-10 rounded-full bg-ice-white text-cold-black font-bold text-lg hover:bg-cyan-glow hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] transition-all duration-300 items-center"
          >
            ابدأ المحادثة
          </Link>
        </div>
      </section>
    </main>
  )
}
