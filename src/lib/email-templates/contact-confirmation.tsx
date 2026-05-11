import * as React from 'react'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'
import {
  DEFAULT_CONFIRMATION_BRANDING,
  type ContactEmailBranding,
  applyTokens,
  mergeBranding,
} from './branding'

interface ContactConfirmationProps {
  name?: string
  subject?: string
  message?: string
  submittedAt?: string
  branding?: ContactEmailBranding | null
}

function ContactConfirmation({
  name = 'there',
  subject = '(no subject)',
  message = '',
  submittedAt = new Date().toISOString(),
  branding,
}: ContactConfirmationProps) {
  const b = mergeBranding(DEFAULT_CONFIRMATION_BRANDING, branding as any)
  const tokens = { name, subject, message }
  const heading = applyTokens(b.heading, tokens)
  const preheader = applyTokens(b.preheader, tokens)
  const intro = applyTokens(b.introText, tokens)
  const footer = applyTokens(b.footerNote, tokens)

  return (
    <Html>
      <Head />
      <Preview>{preheader}</Preview>
      <Body style={{ backgroundColor: b.bgColor, fontFamily: 'system-ui, -apple-system, sans-serif', margin: 0, padding: '24px 0' }}>
        <Container style={{ backgroundColor: b.containerBg, border: `1px solid ${b.borderColor}`, borderRadius: 14, padding: 28, maxWidth: 560 }}>
          <Heading style={{ color: b.textColor, fontSize: 22, margin: '0 0 6px' }}>
            {heading}
          </Heading>
          {b.eyebrow ? (
            <Text style={{ color: b.accentColor, fontSize: 13, letterSpacing: 1, textTransform: 'uppercase', margin: '0 0 18px' }}>
              {b.eyebrow}
            </Text>
          ) : null}

          <Text style={{ color: b.textColor, fontSize: 15, lineHeight: 1.6, margin: '0 0 16px' }}>
            {intro}
          </Text>

          <Section style={{ backgroundColor: b.cardBg, borderRadius: 10, padding: '16px 18px', marginBottom: 16 }}>
            <Text style={{ color: b.mutedColor, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 6px' }}>
              Your message
            </Text>
            <Text style={{ color: b.textColor, fontSize: 14, fontWeight: 600, margin: '0 0 8px' }}>
              {subject}
            </Text>
            <Text style={{ color: b.mutedColor, fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0 }}>
              {message}
            </Text>
            <Text style={{ color: b.mutedColor, fontSize: 12, margin: '12px 0 0' }}>
              Sent {new Date(submittedAt).toLocaleString()}
            </Text>
          </Section>

          <Hr style={{ borderColor: b.borderColor, margin: '20px 0 12px' }} />
          <Text style={{ color: b.mutedColor, fontSize: 13, lineHeight: 1.6, margin: 0 }}>
            {b.signatureName ? <>— {b.signatureName}<br /></> : null}
            {b.signatureUrl ? (
              <a href={b.signatureUrl} style={{ color: b.accentColor, textDecoration: 'none' }}>
                {b.signatureUrlLabel || b.signatureUrl}
              </a>
            ) : null}
          </Text>
          {footer ? (
            <Text style={{ color: b.mutedColor, fontSize: 12, margin: '12px 0 0' }}>{footer}</Text>
          ) : null}
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: ContactConfirmation,
  subject: (data: Record<string, any>) => {
    const b = mergeBranding(DEFAULT_CONFIRMATION_BRANDING, data?.branding ?? null)
    return applyTokens(b.subject, { name: data?.name, subject: data?.subject })
  },
  displayName: 'Contact confirmation (to sender)',
  previewData: {
    name: 'Jane',
    subject: 'Project enquiry',
    message: 'Hi Ali, I’d love to chat about a portfolio redesign.',
    submittedAt: new Date().toISOString(),
  },
} satisfies TemplateEntry
