'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, BriefcaseBusiness, Sparkles, type LucideIcon } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'

const panels: Array<{
  href: string
  word: string
  title: string
  description: string
  cta: string
  image: string
  imageAlt: string
  icon: LucideIcon
  imageClassName: string
}> = [
  {
    href: '/portfolio',
    word: 'الأعمال',
    title: 'شوف الأثر قبل القرار',
    description: 'مشاريع ودراسات حالة تكشف طريقة التفكير، جودة التنفيذ، والنتائج الحقيقية.',
    cta: 'استكشف الأعمال',
    image: '/portfolio_hero.png',
    imageAlt: 'نماذج من أعمال رضوى محمد',
    icon: BriefcaseBusiness,
    imageClassName: 'object-cover object-center',
  },
  {
    href: '/services',
    word: 'الخدمات',
    title: 'ابدأ التنفيذ بخطوة واضحة',
    description: 'اختار الخدمة المناسبة وحوّل احتياجك لخطة عملية قابلة للتنفيذ والقياس.',
    cta: 'استكشف الخدمات',
    image: '/radwa-transparent.png',
    imageAlt: 'رضوى محمد',
    icon: Sparkles,
    imageClassName: 'object-contain object-bottom',
  },
]

export function AboutActionLinks() {
  const reduceMotion = useReducedMotion()

  return (
    <section id="about-pathways" className="relative z-20 overflow-hidden bg-cold-black py-16 md:py-28">
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        viewport={{ once: true, margin: '-12%' }}
        className="container mx-auto mb-10 max-w-7xl px-5 md:mb-14 md:px-8"
      >
        <h2 className="max-w-5xl text-4xl font-black leading-[1.08] text-ice-white sm:text-6xl md:text-8xl lg:text-9xl">
          اختار من أين <span className="text-cyan-glow">تبدأ.</span>
        </h2>
      </motion.div>

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, scale: 0.985 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
        viewport={{ once: true, margin: '-8%' }}
        className="group/stage relative flex flex-col border-y border-white/10 bg-[#090909] md:flex-row"
      >
        <div className="pointer-events-none absolute left-1/2 top-0 z-20 hidden h-full w-px -translate-x-1/2 rotate-[5deg] bg-gradient-to-b from-transparent via-cyan-glow/75 to-transparent md:block" />

        {panels.map((item, index) => (
          <motion.div
            key={item.href}
            className="relative isolate flex min-h-[440px] flex-1 overflow-hidden transition-opacity duration-500 group-hover/stage:opacity-55 hover:!opacity-100 md:min-h-[680px]"
            whileHover={reduceMotion ? undefined : { flexGrow: 1.16 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link
              href={item.href}
              aria-label={`${item.cta}: ${item.title}`}
              className="group/panel relative flex w-full flex-col justify-between overflow-hidden px-5 py-7 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-glow sm:px-8 md:px-10 md:py-12 lg:px-16"
            >
              <div className="absolute inset-0 bg-cold-black" />
              <Image
                src={item.image}
                alt={item.imageAlt}
                fill
                sizes="(min-width: 768px) 58vw, 100vw"
                className={`absolute inset-0 ${item.imageClassName} opacity-30 grayscale transition-[transform,filter,opacity] duration-700 ease-out group-hover/panel:scale-[1.035] group-hover/panel:opacity-65 group-hover/panel:grayscale-0`}
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.14)_0%,rgba(5,5,5,0.34)_42%,rgba(5,5,5,0.98)_100%)]" />
              <div
                className={`absolute inset-y-0 w-2/3 ${
                  index === 0
                    ? 'right-0 bg-gradient-to-l from-cold-black/85 to-transparent'
                    : 'left-0 bg-gradient-to-r from-cold-black/85 to-transparent'
                }`}
              />

              <div className="absolute inset-x-0 top-0 h-1 origin-right scale-x-0 bg-cyan-glow transition-transform duration-500 ease-out group-hover/panel:scale-x-100" />

              <span
                aria-hidden="true"
                className="pointer-events-none absolute -right-2 top-12 whitespace-nowrap text-[6rem] font-black leading-none text-transparent opacity-70 transition-all duration-700 group-hover/panel:right-5 group-hover/panel:opacity-100 sm:text-[8rem] md:-right-6 md:top-16 md:text-[9rem] lg:text-[11rem]"
                style={{ WebkitTextStroke: '1px rgba(250, 250, 250, 0.18)' }}
              >
                {item.word}
              </span>

              <div className="relative z-10 flex items-center gap-3 text-sm font-bold text-cyan-glow md:text-base">
                <item.icon className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
                <span>{index === 0 ? 'الدليل' : 'التنفيذ'}</span>
              </div>

              <div className="relative z-10 max-w-xl pb-2">
                <h3 className="text-4xl font-black leading-[1.15] text-ice-white sm:text-5xl md:text-6xl lg:text-7xl">
                  {item.title}
                </h3>
                <p className="mt-5 max-w-lg text-base leading-8 text-ice-white/70 md:text-lg">
                  {item.description}
                </p>

                <span className="mt-8 inline-flex items-center gap-4 text-base font-black text-ice-white md:text-lg">
                  <span className="border-b border-cyan-glow/70 pb-1 transition-colors group-hover/panel:text-cyan-glow">
                    {item.cta}
                  </span>
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-glow text-cold-black transition-transform duration-300 group-hover/panel:-translate-x-2">
                    <ArrowLeft className="h-5 w-5" strokeWidth={2.2} aria-hidden="true" />
                  </span>
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}
