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
  DEFAULT_NOTIFICATION_BRANDING,
  type ContactEmailBranding,
  applyTokens,
  mergeBranding,
} from './branding'

interface ContactNotificationProps {
  name?: string
  email?: string
  phone?: string
  subject?: string
  message?: string
  submittedAt?: string
  branding?: ContactEmailBranding | null
}

function ContactNotification({
  name = 'Anonymous',
  email = 'unknown@example.com',
  phone = '',
  subject = '(no subject)',
  message = '',
  submittedAt = new Date().toISOString(),
  branding,
}: ContactNotificationProps) {
  const b = mergeBranding(DEFAULT_NOTIFICATION_BRANDING, branding as any)
  const tokens = { name, email, subject, message, phone }
  const preheader = applyTokens(b.preheader, tokens)
  const heading = applyTokens(b.heading, tokens)
  const intro = applyTokens(b.introText, tokens)
  const footer = applyTokens(b.footerNote, tokens)

  return (
    <Html>
      <Head />
      <Preview>{preheader}</Preview>
      <Body style={{ backgroundColor: b.bgColor, fontFamily: 'system-ui, -apple-system, sans-serif', margin: 0, padding: '24px 0' }}>
        <Container style={{ backgroundColor: b.containerBg, border: `1px solid ${b.borderColor}`, borderRadius: 14, padding: 28, maxWidth: 560 }}>
          <Heading style={{ color: b.textColor, fontSize: 20, margin: '0 0 4px' }}>{heading}</Heading>
          {intro ? (
            <Text style={{ color: b.mutedColor, fontSize: 13, margin: '0 0 20px' }}>
              {intro}
            </Text>
          ) : null}

          <Section style={{ backgroundColor: b.cardBg, borderRadius: 10, padding: '16px 18px', marginBottom: 16 }}>
            <Row label="From" value={`${name} <${email}>`} muted={b.mutedColor} text={b.textColor} />
            {phone ? <Row label="Phone" value={phone} muted={b.mutedColor} text={b.textColor} /> : null}
            <Row label="Subject" value={subject} muted={b.mutedColor} text={b.textColor} />
            <Row label="Received" value={new Date(submittedAt).toLocaleString()} muted={b.mutedColor} text={b.textColor} />
          </Section>

          {b.eyebrow ? (
            <Heading as="h2" style={{ color: b.textColor, fontSize: 14, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 8px' }}>
              {b.eyebrow}
            </Heading>
          ) : (
            <Heading as="h2" style={{ color: b.textColor, fontSize: 14, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 8px' }}>
              Message
            </Heading>
          )}
          <Text style={{ color: b.textColor, fontSize: 15, lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0 }}>
            {message}
          </Text>

          <Hr style={{ borderColor: b.borderColor, margin: '24px 0 12px' }} />
          <Text style={{ color: b.mutedColor, fontSize: 12, margin: 0 }}>
            {footer ? (
              <>
                {footer.split(email).map((part, i, arr) =>
                  i < arr.length - 1 ? (
                    <React.Fragment key={i}>
                      {part}
                      <a href={`mailto:${email}`} style={{ color: b.accentColor }}>{email}</a>
                    </React.Fragment>
                  ) : (
                    <React.Fragment key={i}>{part}</React.Fragment>
                  ),
                )}
              </>
            ) : null}
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

function Row({ label, value, muted, text }: { label: string; value: string; muted: string; text: string }) {
  return (
    <Text style={{ color: text, fontSize: 14, margin: '4px 0' }}>
      <span style={{ color: muted, display: 'inline-block', width: 80 }}>{label}:</span>
      <span>{value}</span>
    </Text>
  )
}

export const template = {
  component: ContactNotification,
  subject: (data: Record<string, any>) => {
    const b = mergeBranding(DEFAULT_NOTIFICATION_BRANDING, data?.branding ?? null)
    return applyTokens(b.subject, { name: data?.name || 'Anonymous', subject: data?.subject })
  },
  displayName: 'Contact form notification',
  previewData: {
    name: 'Jane Doe',
    email: 'jane@example.com',
    phone: '+1 555 123 4567',
    subject: 'Project inquiry',
    message: 'Hi! I would love to chat about a portfolio project.',
    submittedAt: new Date().toISOString(),
  },
} satisfies TemplateEntry
