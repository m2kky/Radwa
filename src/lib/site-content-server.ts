import { createAdminClient } from '@/lib/supabase/server'
import {
  defaultAboutMilestones,
  defaultLegalPrivacy,
  defaultLegalRefund,
  defaultLegalTerms,
  defaultHomeTestimonials,
  defaultHomeTimeline,
  defaultSiteGeneral,
  parseAboutMilestones,
  parseHomeTestimonials,
  parseHomeTimeline,
  parseLegalPage,
  parseSiteGeneral,
  SITE_CONTENT_KEYS,
  type SiteContentKey,
} from '@/lib/site-content'

type SettingsRow = { key: string; value: unknown }

async function fetchSettings(keys: SiteContentKey[]): Promise<Partial<Record<SiteContentKey, unknown>>> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('settings')
      .select('key, value')
      .in('key', keys)

    if (error) throw error

    const rows = (data ?? []) as SettingsRow[]
    return rows.reduce<Partial<Record<SiteContentKey, unknown>>>((acc, row) => {
      if (SITE_CONTENT_KEYS.includes(row.key as SiteContentKey)) {
        acc[row.key as SiteContentKey] = row.value
      }
      return acc
    }, {})
  } catch (error) {
    console.error('[site-content] failed to fetch settings:', error)
    return {}
  }
}

export async function getSiteContentSettings() {
  const raw = await fetchSettings([...SITE_CONTENT_KEYS])

  return {
    siteGeneral: parseSiteGeneral(raw.site_general ?? defaultSiteGeneral),
    homeTimeline: parseHomeTimeline(raw.home_timeline ?? defaultHomeTimeline),
    homeTestimonials: parseHomeTestimonials(
      raw.home_testimonials ?? defaultHomeTestimonials
    ),
    aboutMilestones: parseAboutMilestones(raw.about_milestones ?? defaultAboutMilestones),
    legalTerms: parseLegalPage(raw.legal_terms ?? defaultLegalTerms, defaultLegalTerms),
    legalPrivacy: parseLegalPage(
      raw.legal_privacy ?? defaultLegalPrivacy,
      defaultLegalPrivacy
    ),
    legalRefund: parseLegalPage(raw.legal_refund ?? defaultLegalRefund, defaultLegalRefund),
  }
}
