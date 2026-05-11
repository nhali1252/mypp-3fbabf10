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

interface ContactConfirmationProps {
  name?: string
  subject?: string
  message?: string
  submittedAt?: string
}

function ContactConfirmation({
  name = 'there',
  subject = '(no subject)',
  message = '',
  submittedAt = new Date().toISOString(),
}: ContactConfirmationProps) {
  return (
    <Html>
      <Head />
      <Preview>{`Thanks for reaching out, ${name} — I’ll get back to you soon.`}</Preview>
      <Body style={{ backgroundColor: '#ffffff', fontFamily: 'system-ui, -apple-system, sans-serif', margin: 0, padding: '24px 0' }}>
        <Container style={{ backgroundColor: '#0b0b0d', border: '1px solid #2a2a30', borderRadius: 14, padding: 28, maxWidth: 560 }}>
          <Heading style={{ color: '#f5f5f7', fontSize: 22, margin: '0 0 6px' }}>
            Thanks, {name} 👋
          </Heading>
          <Text style={{ color: '#c9a961', fontSize: 13, letterSpacing: 1, textTransform: 'uppercase', margin: '0 0 18px' }}>
            Message received
          </Text>

          <Text style={{ color: '#e5e5ea', fontSize: 15, lineHeight: 1.6, margin: '0 0 16px' }}>
            I’ve got your message and I’ll get back to you as soon as I can — usually within a day or two.
          </Text>

          <Section style={{ backgroundColor: '#141418', borderRadius: 10, padding: '16px 18px', marginBottom: 16 }}>
            <Text style={{ color: '#9b9ba3', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 6px' }}>
              Your message
            </Text>
            <Text style={{ color: '#f5f5f7', fontSize: 14, fontWeight: 600, margin: '0 0 8px' }}>
              {subject}
            </Text>
            <Text style={{ color: '#cfcfd6', fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0 }}>
              {message}
            </Text>
            <Text style={{ color: '#6b6b75', fontSize: 12, margin: '12px 0 0' }}>
              Sent {new Date(submittedAt).toLocaleString()}
            </Text>
          </Section>

          <Hr style={{ borderColor: '#2a2a30', margin: '20px 0 12px' }} />
          <Text style={{ color: '#9b9ba3', fontSize: 13, lineHeight: 1.6, margin: 0 }}>
            — Ali Nur Hasan
            <br />
            <a href="https://alii.uk" style={{ color: '#c9a961', textDecoration: 'none' }}>alii.uk</a>
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: ContactConfirmation,
  subject: (data: Record<string, any>) =>
    `Thanks for reaching out${data?.name ? `, ${data.name}` : ''} — Ali Nur Hasan`,
  displayName: 'Contact confirmation (to sender)',
  previewData: {
    name: 'Jane',
    subject: 'Project enquiry',
    message: 'Hi Ali, I’d love to chat about a portfolio redesign.',
    submittedAt: new Date().toISOString(),
  },
} satisfies TemplateEntry
