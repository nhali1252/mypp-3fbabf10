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

interface ContactNotificationProps {
  name?: string
  email?: string
  phone?: string
  subject?: string
  message?: string
  submittedAt?: string
}

function ContactNotification({
  name = 'Anonymous',
  email = 'unknown@example.com',
  phone = '',
  subject = '(no subject)',
  message = '',
  submittedAt = new Date().toISOString(),
}: ContactNotificationProps) {
  return (
    <Html>
      <Head />
      <Preview>{`New message from ${name}: ${subject}`}</Preview>
      <Body style={{ backgroundColor: '#0b0b0d', fontFamily: 'system-ui, -apple-system, sans-serif', margin: 0, padding: '24px 0' }}>
        <Container style={{ backgroundColor: '#141418', border: '1px solid #2a2a30', borderRadius: 14, padding: 28, maxWidth: 560 }}>
          <Heading style={{ color: '#f5f5f7', fontSize: 20, margin: '0 0 4px' }}>📬 New contact message</Heading>
          <Text style={{ color: '#9b9ba3', fontSize: 13, margin: '0 0 20px' }}>
            Someone just reached out from your portfolio.
          </Text>

          <Section style={{ backgroundColor: '#1c1c22', borderRadius: 10, padding: '16px 18px', marginBottom: 16 }}>
            <Row label="From" value={`${name} <${email}>`} />
            {phone ? <Row label="Phone" value={phone} /> : null}
            <Row label="Subject" value={subject} />
            <Row label="Received" value={new Date(submittedAt).toLocaleString()} />
          </Section>

          <Heading as="h2" style={{ color: '#f5f5f7', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 8px' }}>
            Message
          </Heading>
          <Text style={{ color: '#e5e5ea', fontSize: 15, lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0 }}>
            {message}
          </Text>

          <Hr style={{ borderColor: '#2a2a30', margin: '24px 0 12px' }} />
          <Text style={{ color: '#6b6b75', fontSize: 12, margin: 0 }}>
            Reply directly to <a href={`mailto:${email}`} style={{ color: '#c9a961' }}>{email}</a> to respond.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Text style={{ color: '#e5e5ea', fontSize: 14, margin: '4px 0' }}>
      <span style={{ color: '#9b9ba3', display: 'inline-block', width: 80 }}>{label}:</span>
      <span>{value}</span>
    </Text>
  )
}

export const template = {
  component: ContactNotification,
  subject: (data: Record<string, any>) =>
    `New message from ${data?.name || 'Anonymous'}${data?.subject ? ` — ${data.subject}` : ''}`,
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
