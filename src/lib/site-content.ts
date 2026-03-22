export const SITE_CONTENT_KEYS = [
  'site_general',
  'home_timeline',
  'home_testimonials',
  'about_milestones',
  'legal_terms',
  'legal_privacy',
  'legal_refund',
] as const

export type SiteContentKey = (typeof SITE_CONTENT_KEYS)[number]

const TIMELINE_ACCENTS = [
  'text-indigo-400',
  'text-blue-400',
  'text-yellow-400',
  'text-cyan-glow',
  'text-emerald-400',
  'text-rose-400',
] as const

export type TimelineAccent = (typeof TIMELINE_ACCENTS)[number]

export interface SiteGeneralSettings {
  display_name: string
  brand_name: string
  tagline: string
  contact_email: string
  contact_phone: string
  contact_whatsapp: string
  booking_cta_label: string
  booking_cta_href: string
  testimonials_title: string
  testimonials_subtitle: string
}

export interface HomeTimelineItem {
  id: string
  company: string
  role: string
  period: string
  metric: string
  description: string
  accent: TimelineAccent
}

export interface HomeTimelineContent {
  intro_title: string
  intro_description: string
  browse_label: string
  items: HomeTimelineItem[]
}

export interface PartnerTestimonial {
  id: string
  text: string
  author: string
  role: string
}

export interface AboutStoryMilestone {
  id: string
  year: string
  title: string
  desc: string
}

export interface LegalSection {
  id: string
  title: string
  items: string[]
}

export interface LegalPageContent {
  title: string
  subtitle: string
  lastUpdated: string
  sections: LegalSection[]
}

type AnyRecord = Record<string, unknown>

function isRecord(value: unknown): value is AnyRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter((item) => item.length > 0)
}

function asAccent(value: unknown, fallback: TimelineAccent = 'text-cyan-glow'): TimelineAccent {
  return typeof value === 'string' && TIMELINE_ACCENTS.includes(value as TimelineAccent)
    ? (value as TimelineAccent)
    : fallback
}

function clampItems<T>(items: T[], fallback: T[]): T[] {
  return items.length > 0 ? items : fallback
}

export const defaultSiteGeneral: SiteGeneralSettings = {
  display_name: 'رضوى محمد',
  brand_name: 'Radwa.M',
  tagline: 'أبني استراتيجيات عملية تقدم نمواً حقيقياً وقابلاً للقياس.',
  contact_email: 'hello@radwamuhammed.com',
  contact_phone: '+20 100 000 0000',
  contact_whatsapp: '+20 100 000 0000',
  booking_cta_label: 'احجزي جلسة',
  booking_cta_href: '/book',
  testimonials_title: 'شركاء النجاح',
  testimonials_subtitle:
    'آراء وتجارب بعض الشركات ورواد الأعمال الذين سارت معهم في رحلة النمو.',
}

export const defaultHomeTimeline: HomeTimelineContent = {
  intro_title: 'رحلتي المهنية',
  intro_description:
    'رحلة بدأت منذ 7 سنوات، تطورت فيها من إدارة المشاريع إلى قيادة الرؤى الاستراتيجية.',
  browse_label: 'تصفح المسار',
  items: [
    {
      id: 'timeline-1',
      company: 'Raketbe',
      role: 'مدير تسويق',
      period: 'مايو-نوفمبر 2024',
      metric: 'فريق من 8 أفراد',
      description:
        'قيادة فريق مكون من 8 أفراد لإعادة هندسة مسارات التسويق، وتعزيز الحضور الرقمي للعلامة التجارية عبر حملات دقيقة مبنية على البيانات.',
      accent: 'text-indigo-400',
    },
    {
      id: 'timeline-2',
      company: 'صناع الحياة الإسكندرية',
      role: 'قائد الفريق الإعلامي',
      period: 'فبراير 2023 - أبريل 2024',
      metric: 'نمو 40% في التبرعات',
      description:
        'إدارة الحملات الإعلامية وتوجيه فرق العمل، ما أثمر عن مضاعفة تفاعل المتبرعين بفضل صناعة محتوى استراتيجي هادف.',
      accent: 'text-blue-400',
    },
    {
      id: 'timeline-3',
      company: 'TOP 10',
      role: 'مستشار تسويق',
      period: '2024',
      metric: 'نمو استراتيجي',
      description:
        'تطوير استراتيجيات تسويقية شاملة لزيادة الحصة السوقية وتحقيق أهداف النمو لواحدة من أفضل 10 شركات في البحرين.',
      accent: 'text-yellow-400',
    },
    {
      id: 'timeline-4',
      company: 'beetleware — السعودية',
      role: 'مدير تسويق',
      period: 'حتى الآن',
      metric: 'الحالية',
      description:
        'قيادة العمليات التسويقية وتعزيز التواجد الرقمي للشركة في السوق السعودي لضمان التوسع والانتشار المستمر.',
      accent: 'text-cyan-glow',
    },
  ],
}

export const defaultHomeTestimonials: PartnerTestimonial[] = [
  {
    id: 'test-1',
    text: 'أعادت رضوى تشكيل استراتيجيتنا التسويقية بالكامل، ونجحنا في تحقيق قفزة ملحوظة في النمو خلال 3 أشهر فقط.',
    author: 'Sarah J.',
    role: 'المدير التنفيذي – TechStart',
  },
  {
    id: 'test-2',
    text: 'تتمتع بقدرة استثنائية على خلق رؤية واضحة من وسط الفوضى. أوصي بها بشدة لأي شركة تطمح للتوسع بذكاء.',
    author: 'Mark T.',
    role: 'مؤسس – GrowthOps',
  },
  {
    id: 'test-3',
    text: 'النماذج التي تقدمها بمثابة كنز حقيقي لأي فريق عمل، فهي تجمع بين البساطة والفعالية العالية.',
    author: 'Elena R.',
    role: 'مديرة التسويق',
  },
]

export const defaultAboutMilestones: AboutStoryMilestone[] = [
  {
    id: 'about-1',
    year: '2018',
    title: 'نقطة الانطلاق',
    desc: 'كانت الانطلاقة في عالم التسويق الرقمي، حيث أتقنت أسرار تحسين محركات البحث وإدارة الحملات الإعلانية وبناء استراتيجيات المحتوى.',
  },
  {
    id: 'about-2',
    year: '2020',
    title: 'توجيه الدفة',
    desc: 'خضت أولى تجاربي القيادية بإدارة فريق متنوع يضم نخبة من المصممين وكتّاب المحتوى لإطلاق حملات ذات أثر ملموس.',
  },
  {
    id: 'about-3',
    year: '2022',
    title: 'الرؤية الشاملة',
    desc: 'وجهت بوصلتي نحو بناء استراتيجيات شاملة للعلامات التجارية ترتكز على أهداف أعمال واضحة وقابلة للقياس.',
  },
  {
    id: 'about-4',
    year: '2024',
    title: 'توسيع الآفاق',
    desc: 'بدأت مسيرتي كمستشارة مستقلة مع شركات ناشئة وعلامات تجارية كبرى في الشرق الأوسط وشمال أفريقيا.',
  },
]

export const defaultLegalTerms: LegalPageContent = {
  title: 'شروط الخدمة',
  subtitle: 'هذه الشروط تنظم علاقتك بمنصة رضوى محمد عند التصفح أو الشراء أو استخدام أي منتج رقمي.',
  lastUpdated: '22 مارس 2026',
  sections: [
    {
      id: 'terms-1',
      title: '1. قبول الشروط',
      items: [
        'باستخدامك لهذا الموقع أو شراء أي منتج رقمي، فأنت توافق على هذه الشروط بالكامل.',
        'إذا كنت لا توافق على أي بند، يرجى التوقف عن استخدام الموقع والخدمات.',
      ],
    },
    {
      id: 'terms-2',
      title: '2. طبيعة المنتجات والخدمات',
      items: [
        'المنتجات المعروضة هي منتجات رقمية ويتم تسليمها إلكترونيًا.',
        'يتم منحك حق استخدام حسب وصف كل منتج، ولا يعني ذلك نقل ملكية حقوق المحتوى لك.',
      ],
    },
    {
      id: 'terms-3',
      title: '3. الدفع',
      items: [
        'يتم تنفيذ المدفوعات عبر Paymob باستخدام وسائل الدفع المتاحة داخل صفحة الدفع.',
        'في حالة التقسيط، يخضع الطلب لمتطلبات الأهلية والموافقة.',
      ],
    },
  ],
}

export const defaultLegalPrivacy: LegalPageContent = {
  title: 'سياسة الخصوصية',
  subtitle: 'نلتزم بالتعامل مع بياناتك بمسؤولية وشفافية، وباستخدامها فقط لتقديم الخدمة وتحسينها.',
  lastUpdated: '22 مارس 2026',
  sections: [
    {
      id: 'privacy-1',
      title: '1. البيانات التي نجمعها',
      items: [
        'بيانات الحساب مثل الاسم والبريد الإلكتروني.',
        'بيانات الشراء مثل حالة الطلب وطريقة الدفع.',
        'بيانات تواصل اختيارية مثل رقم الهاتف عند الحاجة.',
      ],
    },
    {
      id: 'privacy-2',
      title: '2. كيف نستخدم البيانات',
      items: [
        'إتمام الشراء وتسليم المنتجات الرقمية.',
        'إدارة الحسابات والتحقق الأمني وحماية المنصة.',
        'التواصل بخصوص الطلبات والإشعارات التشغيلية.',
      ],
    },
    {
      id: 'privacy-3',
      title: '3. مشاركة البيانات',
      items: [
        'قد تتم مشاركة البيانات اللازمة فقط مع مزودي الخدمة التقنيين لتشغيل المنصة.',
        'لا يتم بيع بياناتك الشخصية لأي طرف ثالث.',
      ],
    },
  ],
}

export const defaultLegalRefund: LegalPageContent = {
  title: 'سياسة الاسترجاع',
  subtitle: 'هذه السياسة توضح متى وكيف يمكن طلب استرجاع المدفوعات الخاصة بالمنتجات الرقمية.',
  lastUpdated: '22 مارس 2026',
  sections: [
    {
      id: 'refund-1',
      title: '1. طبيعة المنتجات الرقمية',
      items: [
        'نظرًا لأن المنتجات رقمية ويتم تسليمها فورًا أو خلال وقت قصير، فإن الاسترجاع ليس تلقائيًا بعد إتاحة الوصول.',
        'أي استثناءات تتم مراجعتها حالة بحالة وفق الشروط.',
      ],
    },
    {
      id: 'refund-2',
      title: '2. حالات يمكن قبول الاسترجاع فيها',
      items: [
        'حدوث خصم مكرر لنفس الطلب.',
        'تعذر تسليم المنتج بسبب خلل تقني من طرفنا وعدم القدرة على الحل خلال مدة مناسبة.',
        'تحصيل مبلغ غير صحيح عن طريق الخطأ.',
      ],
    },
    {
      id: 'refund-3',
      title: '3. آلية المعالجة',
      items: [
        'تتم مراجعة الطلب والرد عليه خلال مدة عمل مناسبة.',
        'إذا تمت الموافقة، يتم تنفيذ الاسترداد عبر نفس وسيلة الدفع قدر الإمكان.',
      ],
    },
  ],
}

function normalizeTimelineItem(value: unknown, index: number): HomeTimelineItem | null {
  if (!isRecord(value)) return null
  const company = asString(value.company).trim()
  const role = asString(value.role).trim()
  const period = asString(value.period).trim()
  const metric = asString(value.metric).trim()
  const description = asString(value.description).trim()
  if (!company || !role || !period || !metric || !description) return null
  return {
    id: asString(value.id, `timeline-${index + 1}`),
    company,
    role,
    period,
    metric,
    description,
    accent: asAccent(value.accent),
  }
}

function normalizeTestimonial(value: unknown, index: number): PartnerTestimonial | null {
  if (!isRecord(value)) return null
  const text = asString(value.text).trim()
  const author = asString(value.author).trim()
  const role = asString(value.role).trim()
  if (!text || !author || !role) return null
  return { id: asString(value.id, `test-${index + 1}`), text, author, role }
}

function normalizeMilestone(value: unknown, index: number): AboutStoryMilestone | null {
  if (!isRecord(value)) return null
  const year = asString(value.year).trim()
  const title = asString(value.title).trim()
  const desc = asString(value.desc).trim()
  if (!year || !title || !desc) return null
  return { id: asString(value.id, `about-${index + 1}`), year, title, desc }
}

function normalizeLegalSection(value: unknown, index: number): LegalSection | null {
  if (!isRecord(value)) return null
  const title = asString(value.title).trim()
  const items = asStringArray(value.items)
  if (!title || items.length === 0) return null
  return { id: asString(value.id, `section-${index + 1}`), title, items }
}

export function parseSiteGeneral(value: unknown): SiteGeneralSettings {
  if (!isRecord(value)) return defaultSiteGeneral
  return {
    display_name: asString(value.display_name, defaultSiteGeneral.display_name),
    brand_name: asString(value.brand_name, defaultSiteGeneral.brand_name),
    tagline: asString(value.tagline, defaultSiteGeneral.tagline),
    contact_email: asString(value.contact_email, defaultSiteGeneral.contact_email),
    contact_phone: asString(value.contact_phone, defaultSiteGeneral.contact_phone),
    contact_whatsapp: asString(value.contact_whatsapp, defaultSiteGeneral.contact_whatsapp),
    booking_cta_label: asString(value.booking_cta_label, defaultSiteGeneral.booking_cta_label),
    booking_cta_href: asString(value.booking_cta_href, defaultSiteGeneral.booking_cta_href),
    testimonials_title: asString(
      value.testimonials_title,
      defaultSiteGeneral.testimonials_title
    ),
    testimonials_subtitle: asString(
      value.testimonials_subtitle,
      defaultSiteGeneral.testimonials_subtitle
    ),
  }
}

export function parseHomeTimeline(value: unknown): HomeTimelineContent {
  if (!isRecord(value)) return defaultHomeTimeline
  const parsedItems = Array.isArray(value.items)
    ? value.items
        .map((item, index) => normalizeTimelineItem(item, index))
        .filter((item): item is HomeTimelineItem => item !== null)
    : []

  return {
    intro_title: asString(value.intro_title, defaultHomeTimeline.intro_title),
    intro_description: asString(
      value.intro_description,
      defaultHomeTimeline.intro_description
    ),
    browse_label: asString(value.browse_label, defaultHomeTimeline.browse_label),
    items: clampItems(parsedItems, defaultHomeTimeline.items),
  }
}

export function parseHomeTestimonials(value: unknown): PartnerTestimonial[] {
  if (!Array.isArray(value)) return defaultHomeTestimonials
  const parsed = value
    .map((item, index) => normalizeTestimonial(item, index))
    .filter((item): item is PartnerTestimonial => item !== null)
  return clampItems(parsed, defaultHomeTestimonials)
}

export function parseAboutMilestones(value: unknown): AboutStoryMilestone[] {
  if (!Array.isArray(value)) return defaultAboutMilestones
  const parsed = value
    .map((item, index) => normalizeMilestone(item, index))
    .filter((item): item is AboutStoryMilestone => item !== null)
  return clampItems(parsed, defaultAboutMilestones)
}

export function parseLegalPage(
  value: unknown,
  fallback: LegalPageContent
): LegalPageContent {
  if (!isRecord(value)) return fallback

  const parsedSections = Array.isArray(value.sections)
    ? value.sections
        .map((section, index) => normalizeLegalSection(section, index))
        .filter((section): section is LegalSection => section !== null)
    : []

  return {
    title: asString(value.title, fallback.title),
    subtitle: asString(value.subtitle, fallback.subtitle),
    lastUpdated: asString(value.lastUpdated, fallback.lastUpdated),
    sections: clampItems(parsedSections, fallback.sections),
  }
}

export function sanitizeSettingValue(key: SiteContentKey, value: unknown): unknown {
  switch (key) {
    case 'site_general':
      return parseSiteGeneral(value)
    case 'home_timeline':
      return parseHomeTimeline(value)
    case 'home_testimonials':
      return parseHomeTestimonials(value)
    case 'about_milestones':
      return parseAboutMilestones(value)
    case 'legal_terms':
      return parseLegalPage(value, defaultLegalTerms)
    case 'legal_privacy':
      return parseLegalPage(value, defaultLegalPrivacy)
    case 'legal_refund':
      return parseLegalPage(value, defaultLegalRefund)
    default:
      return value
  }
}
