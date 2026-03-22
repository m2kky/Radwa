'use client'

import { useState, type Dispatch, type SetStateAction } from 'react'
import { Plus, CheckCircle, Trash2 } from 'lucide-react'
import type {
  AboutStoryMilestone,
  HomeTimelineContent,
  LegalPageContent,
  PartnerTestimonial,
  SiteGeneralSettings,
  TimelineAccent,
} from '@/lib/site-content'

interface ContentSettings {
  siteGeneral: SiteGeneralSettings
  homeTimeline: HomeTimelineContent
  aboutMilestones: AboutStoryMilestone[]
  homeTestimonials: PartnerTestimonial[]
  legalTerms: LegalPageContent
  legalPrivacy: LegalPageContent
  legalRefund: LegalPageContent
}

const inputClass =
  'w-full bg-cold-black border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cyan-glow/50'
const textareaClass = `${inputClass} min-h-24`
const labelClass = 'block text-xs font-medium text-muted-foreground mb-1'
const cardClass = 'bg-cold-dark border border-border rounded-xl p-5 space-y-4'

const accentOptions: TimelineAccent[] = [
  'text-indigo-400',
  'text-blue-400',
  'text-yellow-400',
  'text-cyan-glow',
  'text-emerald-400',
  'text-rose-400',
]

export default function ContentManager({ initial }: { initial: ContentSettings }) {
  const [siteGeneral, setSiteGeneral] = useState(initial.siteGeneral)
  const [homeTimeline, setHomeTimeline] = useState(initial.homeTimeline)
  const [aboutMilestones, setAboutMilestones] = useState(initial.aboutMilestones)
  const [homeTestimonials, setHomeTestimonials] = useState(initial.homeTestimonials)
  const [legalTerms, setLegalTerms] = useState(initial.legalTerms)
  const [legalPrivacy, setLegalPrivacy] = useState(initial.legalPrivacy)
  const [legalRefund, setLegalRefund] = useState(initial.legalRefund)

  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const updateTimelineItem = (
    index: number,
    key: keyof HomeTimelineContent['items'][number],
    value: string
  ) => {
    setHomeTimeline((prev) => ({
      ...prev,
      items: prev.items.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [key]: value,
            }
          : item
      ),
    }))
  }

  const updateMilestoneItem = (
    index: number,
    key: keyof AboutStoryMilestone,
    value: string
  ) => {
    setAboutMilestones((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [key]: value,
            }
          : item
      )
    )
  }

  const updateTestimonialItem = (
    index: number,
    key: keyof PartnerTestimonial,
    value: string
  ) => {
    setHomeTestimonials((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [key]: value,
            }
          : item
      )
    )
  }

  const updateLegalSection = (
    setPage: Dispatch<SetStateAction<LegalPageContent>>,
    index: number,
    key: 'title' | 'items',
    value: string
  ) => {
    setPage((prev) => ({
      ...prev,
      sections: prev.sections.map((section, sectionIndex) =>
        sectionIndex === index
          ? {
              ...section,
              [key]:
                key === 'items'
                  ? value
                      .split('\n')
                      .map((line) => line.trim())
                      .filter(Boolean)
                  : value,
            }
          : section
      ),
    }))
  }

  const addLegalSection = (
    setPage: Dispatch<SetStateAction<LegalPageContent>>
  ) => {
    setPage((prev) => ({
      ...prev,
      sections: [
        ...prev.sections,
        {
          id: crypto.randomUUID(),
          title: 'عنوان جديد',
          items: ['نص جديد'],
        },
      ],
    }))
  }

  const removeLegalSection = (
    setPage: Dispatch<SetStateAction<LegalPageContent>>,
    index: number
  ) => {
    setPage((prev) => ({
      ...prev,
      sections: prev.sections.filter((_, sectionIndex) => sectionIndex !== index),
    }))
  }

  const saveAll = async () => {
    setSaving(true)
    setMessage(null)
    setError(null)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updates: {
            site_general: siteGeneral,
            home_timeline: homeTimeline,
            about_milestones: aboutMilestones,
            home_testimonials: homeTestimonials,
            legal_terms: legalTerms,
            legal_privacy: legalPrivacy,
            legal_refund: legalRefund,
          },
        }),
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error?.message ?? 'فشل حفظ الإعدادات')
      }

      setMessage('تم حفظ إعدادات المحتوى بنجاح')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء الحفظ')
    } finally {
      setSaving(false)
    }
  }

  const renderLegalEditor = (
    title: string,
    page: LegalPageContent,
    setPage: Dispatch<SetStateAction<LegalPageContent>>
  ) => (
    <div className={cardClass}>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>

      <div>
        <label className={labelClass}>العنوان</label>
        <input
          className={inputClass}
          value={page.title}
          onChange={(e) => setPage((prev) => ({ ...prev, title: e.target.value }))}
        />
      </div>

      <div>
        <label className={labelClass}>الوصف المختصر</label>
        <textarea
          className={textareaClass}
          value={page.subtitle}
          onChange={(e) => setPage((prev) => ({ ...prev, subtitle: e.target.value }))}
        />
      </div>

      <div>
        <label className={labelClass}>آخر تحديث</label>
        <input
          className={inputClass}
          value={page.lastUpdated}
          onChange={(e) =>
            setPage((prev) => ({ ...prev, lastUpdated: e.target.value }))
          }
        />
      </div>

      <div className="space-y-3">
        {page.sections.map((section, sectionIndex) => (
          <div key={section.id} className="border border-border rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <label className={labelClass}>عنوان القسم</label>
              <button
                type="button"
                onClick={() => removeLegalSection(setPage, sectionIndex)}
                className="text-xs text-red-400 hover:text-red-300 inline-flex items-center gap-1"
              >
                <Trash2 size={14} />
                حذف
              </button>
            </div>
            <input
              className={inputClass}
              value={section.title}
              onChange={(e) =>
                updateLegalSection(setPage, sectionIndex, 'title', e.target.value)
              }
            />
            <label className={labelClass}>نقاط القسم (كل نقطة في سطر)</label>
            <textarea
              className={textareaClass}
              value={section.items.join('\n')}
              onChange={(e) =>
                updateLegalSection(setPage, sectionIndex, 'items', e.target.value)
              }
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => addLegalSection(setPage)}
        className="inline-flex items-center gap-2 text-sm text-cyan-glow hover:text-cyan-glow/80"
      >
        <Plus size={15} />
        إضافة قسم
      </button>
    </div>
  )

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      {message && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-lg text-sm">
          {message}
        </div>
      )}

      <section className={cardClass}>
        <h2 className="text-lg font-semibold text-foreground">بيانات الموقع</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>اسم الواجهة</label>
            <input
              className={inputClass}
              value={siteGeneral.display_name}
              onChange={(e) =>
                setSiteGeneral((prev) => ({ ...prev, display_name: e.target.value }))
              }
            />
          </div>
          <div>
            <label className={labelClass}>اسم البراند المختصر</label>
            <input
              className={inputClass}
              value={siteGeneral.brand_name}
              onChange={(e) =>
                setSiteGeneral((prev) => ({ ...prev, brand_name: e.target.value }))
              }
            />
          </div>
        </div>
        <div>
          <label className={labelClass}>الوصف المختصر</label>
          <textarea
            className={textareaClass}
            value={siteGeneral.tagline}
            onChange={(e) =>
              setSiteGeneral((prev) => ({ ...prev, tagline: e.target.value }))
            }
          />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>الإيميل</label>
            <input
              className={inputClass}
              value={siteGeneral.contact_email}
              onChange={(e) =>
                setSiteGeneral((prev) => ({ ...prev, contact_email: e.target.value }))
              }
              dir="ltr"
            />
          </div>
          <div>
            <label className={labelClass}>رقم الموبايل</label>
            <input
              className={inputClass}
              value={siteGeneral.contact_phone}
              onChange={(e) =>
                setSiteGeneral((prev) => ({ ...prev, contact_phone: e.target.value }))
              }
              dir="ltr"
            />
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>واتساب</label>
            <input
              className={inputClass}
              value={siteGeneral.contact_whatsapp}
              onChange={(e) =>
                setSiteGeneral((prev) => ({ ...prev, contact_whatsapp: e.target.value }))
              }
              dir="ltr"
            />
          </div>
          <div>
            <label className={labelClass}>زر حجز الاستشارة</label>
            <input
              className={inputClass}
              value={siteGeneral.booking_cta_label}
              onChange={(e) =>
                setSiteGeneral((prev) => ({ ...prev, booking_cta_label: e.target.value }))
              }
            />
          </div>
        </div>
        <div>
          <label className={labelClass}>رابط زر الاستشارة</label>
          <input
            className={inputClass}
            value={siteGeneral.booking_cta_href}
            onChange={(e) =>
              setSiteGeneral((prev) => ({ ...prev, booking_cta_href: e.target.value }))
            }
            dir="ltr"
          />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>عنوان شركاء النجاح</label>
            <input
              className={inputClass}
              value={siteGeneral.testimonials_title}
              onChange={(e) =>
                setSiteGeneral((prev) => ({
                  ...prev,
                  testimonials_title: e.target.value,
                }))
              }
            />
          </div>
          <div>
            <label className={labelClass}>وصف شركاء النجاح</label>
            <input
              className={inputClass}
              value={siteGeneral.testimonials_subtitle}
              onChange={(e) =>
                setSiteGeneral((prev) => ({
                  ...prev,
                  testimonials_subtitle: e.target.value,
                }))
              }
            />
          </div>
        </div>
      </section>

      <section className={cardClass}>
        <h2 className="text-lg font-semibold text-foreground">رحلتي المهنية (Home Timeline)</h2>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>العنوان الرئيسي</label>
            <input
              className={inputClass}
              value={homeTimeline.intro_title}
              onChange={(e) =>
                setHomeTimeline((prev) => ({ ...prev, intro_title: e.target.value }))
              }
            />
          </div>
          <div>
            <label className={labelClass}>وصف المقدمة</label>
            <input
              className={inputClass}
              value={homeTimeline.intro_description}
              onChange={(e) =>
                setHomeTimeline((prev) => ({
                  ...prev,
                  intro_description: e.target.value,
                }))
              }
            />
          </div>
          <div>
            <label className={labelClass}>نص التنقل</label>
            <input
              className={inputClass}
              value={homeTimeline.browse_label}
              onChange={(e) =>
                setHomeTimeline((prev) => ({ ...prev, browse_label: e.target.value }))
              }
            />
          </div>
        </div>

        <div className="space-y-3">
          {homeTimeline.items.map((item, index) => (
            <div key={item.id} className="border border-border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">عنصر #{index + 1}</p>
                <button
                  type="button"
                  onClick={() =>
                    setHomeTimeline((prev) => ({
                      ...prev,
                      items: prev.items.filter((_, itemIndex) => itemIndex !== index),
                    }))
                  }
                  className="text-xs text-red-400 hover:text-red-300 inline-flex items-center gap-1"
                >
                  <Trash2 size={14} />
                  حذف
                </button>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <input
                  className={inputClass}
                  placeholder="الشركة"
                  value={item.company}
                  onChange={(e) => updateTimelineItem(index, 'company', e.target.value)}
                />
                <input
                  className={inputClass}
                  placeholder="الدور"
                  value={item.role}
                  onChange={(e) => updateTimelineItem(index, 'role', e.target.value)}
                />
              </div>
              <div className="grid md:grid-cols-3 gap-3">
                <input
                  className={inputClass}
                  placeholder="الفترة"
                  value={item.period}
                  onChange={(e) => updateTimelineItem(index, 'period', e.target.value)}
                />
                <input
                  className={inputClass}
                  placeholder="النتيجة"
                  value={item.metric}
                  onChange={(e) => updateTimelineItem(index, 'metric', e.target.value)}
                />
                <select
                  className={inputClass}
                  value={item.accent}
                  onChange={(e) =>
                    updateTimelineItem(index, 'accent', e.target.value as TimelineAccent)
                  }
                >
                  {accentOptions.map((accent) => (
                    <option key={accent} value={accent}>
                      {accent}
                    </option>
                  ))}
                </select>
              </div>
              <textarea
                className={textareaClass}
                value={item.description}
                placeholder="الوصف"
                onChange={(e) => updateTimelineItem(index, 'description', e.target.value)}
              />
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() =>
            setHomeTimeline((prev) => ({
              ...prev,
              items: [
                ...prev.items,
                {
                  id: crypto.randomUUID(),
                  company: '',
                  role: '',
                  period: '',
                  metric: '',
                  description: '',
                  accent: 'text-cyan-glow',
                },
              ],
            }))
          }
          className="inline-flex items-center gap-2 text-sm text-cyan-glow hover:text-cyan-glow/80"
        >
          <Plus size={15} />
          إضافة محطة
        </button>
      </section>

      <section className={cardClass}>
        <h2 className="text-lg font-semibold text-foreground">شركاء النجاح (Testimonials)</h2>
        <div className="space-y-3">
          {homeTestimonials.map((item, index) => (
            <div key={item.id} className="border border-border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">شهادة #{index + 1}</p>
                <button
                  type="button"
                  onClick={() =>
                    setHomeTestimonials((prev) =>
                      prev.filter((_, itemIndex) => itemIndex !== index)
                    )
                  }
                  className="text-xs text-red-400 hover:text-red-300 inline-flex items-center gap-1"
                >
                  <Trash2 size={14} />
                  حذف
                </button>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <input
                  className={inputClass}
                  value={item.author}
                  placeholder="الاسم"
                  onChange={(e) =>
                    updateTestimonialItem(index, 'author', e.target.value)
                  }
                />
                <input
                  className={inputClass}
                  value={item.role}
                  placeholder="المنصب"
                  onChange={(e) => updateTestimonialItem(index, 'role', e.target.value)}
                />
              </div>
              <textarea
                className={textareaClass}
                value={item.text}
                placeholder="نص الشهادة"
                onChange={(e) => updateTestimonialItem(index, 'text', e.target.value)}
              />
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() =>
            setHomeTestimonials((prev) => [
              ...prev,
              { id: crypto.randomUUID(), text: '', author: '', role: '' },
            ])
          }
          className="inline-flex items-center gap-2 text-sm text-cyan-glow hover:text-cyan-glow/80"
        >
          <Plus size={15} />
          إضافة شهادة
        </button>
      </section>

      <section className={cardClass}>
        <h2 className="text-lg font-semibold text-foreground">Timeline صفحة About</h2>
        <div className="space-y-3">
          {aboutMilestones.map((item, index) => (
            <div key={item.id} className="border border-border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">مرحلة #{index + 1}</p>
                <button
                  type="button"
                  onClick={() =>
                    setAboutMilestones((prev) =>
                      prev.filter((_, itemIndex) => itemIndex !== index)
                    )
                  }
                  className="text-xs text-red-400 hover:text-red-300 inline-flex items-center gap-1"
                >
                  <Trash2 size={14} />
                  حذف
                </button>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <input
                  className={inputClass}
                  value={item.year}
                  placeholder="السنة"
                  onChange={(e) => updateMilestoneItem(index, 'year', e.target.value)}
                />
                <input
                  className={inputClass}
                  value={item.title}
                  placeholder="العنوان"
                  onChange={(e) => updateMilestoneItem(index, 'title', e.target.value)}
                />
              </div>
              <textarea
                className={textareaClass}
                value={item.desc}
                placeholder="الوصف"
                onChange={(e) => updateMilestoneItem(index, 'desc', e.target.value)}
              />
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() =>
            setAboutMilestones((prev) => [
              ...prev,
              { id: crypto.randomUUID(), year: '', title: '', desc: '' },
            ])
          }
          className="inline-flex items-center gap-2 text-sm text-cyan-glow hover:text-cyan-glow/80"
        >
          <Plus size={15} />
          إضافة مرحلة
        </button>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">الصفحات القانونية</h2>
        {renderLegalEditor('شروط الخدمة', legalTerms, setLegalTerms)}
        {renderLegalEditor('سياسة الخصوصية', legalPrivacy, setLegalPrivacy)}
        {renderLegalEditor('سياسة الاسترجاع', legalRefund, setLegalRefund)}
      </section>

      <div className="sticky bottom-4 z-20">
        <button
          type="button"
          onClick={saveAll}
          disabled={saving}
          className="inline-flex items-center gap-2 bg-cyan-glow text-cold-black px-6 py-3 rounded-lg text-sm font-semibold hover:bg-cyan-glow/90 disabled:opacity-50"
        >
          <CheckCircle size={16} />
          {saving ? 'جاري الحفظ...' : 'حفظ كل الإعدادات'}
        </button>
      </div>
    </div>
  )
}
