/**
 * Shared branding overrides for the contact email templates.
 * Stored in `email_template_settings` and merged into the rendered email.
 * Any field left blank falls back to the template default.
 */
export interface ContactEmailBranding {
  subject?: string
  preheader?: string
  eyebrow?: string
  heading?: string
  introText?: string
  accentColor?: string
  bgColor?: string
  containerBg?: string
  cardBg?: string
  textColor?: string
  mutedColor?: string
  borderColor?: string
  signatureName?: string
  signatureUrl?: string
  signatureUrlLabel?: string
  footerNote?: string
}

export const DEFAULT_CONFIRMATION_BRANDING: Required<Omit<ContactEmailBranding, 'subject' | 'preheader'>> & {
  subject: string
  preheader: string
} = {
  subject: 'Thanks for reaching out{{name?}} — Ali Nur Hasan',
  preheader: 'Thanks for reaching out, {{name}} — I’ll get back to you soon.',
  eyebrow: 'Message received',
  heading: 'Thanks, {{name}} 👋',
  introText:
    'I’ve got your message and I’ll get back to you as soon as I can — usually within a day or two.',
  accentColor: '#c9a961',
  bgColor: '#ffffff',
  containerBg: '#0b0b0d',
  cardBg: '#141418',
  textColor: '#f5f5f7',
  mutedColor: '#9b9ba3',
  borderColor: '#2a2a30',
  signatureName: 'Ali Nur Hasan',
  signatureUrl: 'https://alii.uk',
  signatureUrlLabel: 'alii.uk',
  footerNote: '',
}

export const DEFAULT_NOTIFICATION_BRANDING: Required<Omit<ContactEmailBranding, 'subject' | 'preheader'>> & {
  subject: string
  preheader: string
} = {
  subject: 'New message from {{name}}{{subject?}}',
  preheader: 'New message from {{name}}: {{subject}}',
  eyebrow: '',
  heading: '📬 New contact message',
  introText: 'Someone just reached out from your portfolio.',
  accentColor: '#c9a961',
  bgColor: '#0b0b0d',
  containerBg: '#141418',
  cardBg: '#1c1c22',
  textColor: '#f5f5f7',
  mutedColor: '#9b9ba3',
  borderColor: '#2a2a30',
  signatureName: '',
  signatureUrl: '',
  signatureUrlLabel: '',
  footerNote: 'Reply directly to {{email}} to respond.',
}

/** Merge stored partial overrides with defaults; blank strings fall back. */
export function mergeBranding<T extends Record<string, string>>(
  defaults: T,
  overrides: Partial<Record<keyof T, string>> | null | undefined,
): T {
  if (!overrides) return defaults
  const out = { ...defaults }
  for (const [k, v] of Object.entries(overrides)) {
    if (typeof v === 'string' && v.trim().length > 0) {
      ;(out as any)[k] = v
    }
  }
  return out
}

/** Replace {{token}} or {{token?}} placeholders. `token?` resolves to a leading ", value" if present. */
export function applyTokens(template: string, vars: Record<string, string | undefined>): string {
  return template.replace(/\{\{(\w+)(\?)?\}\}/g, (_, key: string, optional?: string) => {
    const v = vars[key]
    if (optional) return v ? `, ${v}` : ''
    return v ?? ''
  })
}
