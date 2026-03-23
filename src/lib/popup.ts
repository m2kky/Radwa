export const popupVariantValues = ['spotlight', 'minimal', 'split'] as const
export type PopupVariant = (typeof popupVariantValues)[number]

export const popupActionTypeValues = ['link', 'copy_code', 'close'] as const
export type PopupActionType = (typeof popupActionTypeValues)[number]

export const popupActionStyleValues = ['primary', 'secondary', 'ghost'] as const
export type PopupActionStyle = (typeof popupActionStyleValues)[number]

export interface PopupAction {
  id: string
  label: string
  action: PopupActionType
  url: string | null
  style: PopupActionStyle
  new_tab: boolean
  copy_text: string | null
}

interface PopupActionLike {
  id?: unknown
  label?: unknown
  action?: unknown
  url?: unknown
  style?: unknown
  new_tab?: unknown
  copy_text?: unknown
}

export function isValidPopupUrl(value: string): boolean {
  const url = value.trim()
  if (!url) return false

  if (url.startsWith('/')) return true
  if (url.startsWith('http://') || url.startsWith('https://')) return true

  return false
}

function isPopupActionType(value: unknown): value is PopupActionType {
  return typeof value === 'string' && popupActionTypeValues.includes(value as PopupActionType)
}

function isPopupActionStyle(value: unknown): value is PopupActionStyle {
  return typeof value === 'string' && popupActionStyleValues.includes(value as PopupActionStyle)
}

function safeString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function normalizePopupVariant(value: unknown): PopupVariant {
  if (typeof value === 'string' && popupVariantValues.includes(value as PopupVariant)) {
    return value as PopupVariant
  }

  return 'spotlight'
}

export function normalizePopupActions(
  actions: unknown,
  fallback?: { ctaText?: string | null; ctaUrl?: string | null }
): PopupAction[] {
  const rawActions = Array.isArray(actions) ? actions : []
  const normalized: PopupAction[] = []

  rawActions.forEach((raw, index) => {
    if (!raw || typeof raw !== 'object') return
    const value = raw as PopupActionLike
    const label = safeString(value.label)
    if (!label) return

    const action: PopupActionType = isPopupActionType(value.action) ? value.action : 'link'
    const style: PopupActionStyle = isPopupActionStyle(value.style) ? value.style : 'primary'
    const url = safeString(value.url)
    const copyText = safeString(value.copy_text)

    if (action === 'link' && (!url || !isValidPopupUrl(url))) return
    if (action === 'copy_code' && !copyText) {
      normalized.push({
        id: safeString(value.id) ?? `popup-action-${index + 1}`,
        label,
        action,
        url: null,
        style,
        new_tab: Boolean(value.new_tab),
        copy_text: null,
      })
      return
    }

    normalized.push({
      id: safeString(value.id) ?? `popup-action-${index + 1}`,
      label,
      action,
      url: action === 'link' ? url : null,
      style,
      new_tab: action === 'link' ? Boolean(value.new_tab) : false,
      copy_text: action === 'copy_code' ? copyText : null,
    })
  })

  if (normalized.length > 0) {
    return normalized.slice(0, 4)
  }

  const fallbackText = safeString(fallback?.ctaText)
  const fallbackUrl = safeString(fallback?.ctaUrl)

  if (fallbackText && fallbackUrl && isValidPopupUrl(fallbackUrl)) {
    return [
      {
        id: 'popup-action-fallback',
        label: fallbackText,
        action: 'link',
        url: fallbackUrl,
        style: 'primary',
        new_tab: false,
        copy_text: null,
      },
    ]
  }

  return []
}
