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

interface BookingConfirmationProps {
  name?: string
  service?: string
  preferredDate?: string
  preferredTime?: string
  notes?: string
}

function fmtDate(iso?: string) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

function BookingConfirmation({
  name = 'there',
  service = '(no service selected)',
  preferredDate,
  preferredTime,
  notes,
}: BookingConfirmationProps) {
  return (
    <Html>
      <Head />
      <Preview>{`Booking received, ${name} — I'll confirm shortly.`}</Preview>
      <Body style={{ backgroundColor: '#ffffff', fontFamily: 'system-ui, -apple-system, sans-serif', margin: 0, padding: '24px 0' }}>
        <Container style={{ backgroundColor: '#0b0b0d', border: '1px solid #2a2a30', borderRadius: 14, padding: 28, maxWidth: 560 }}>
          <Heading style={{ color: '#f5f5f7', fontSize: 22, margin: '0 0 6px' }}>
            Booking received, {name} ✨
          </Heading>
          <Text style={{ color: '#c9a961', fontSize: 13, letterSpacing: 1, textTransform: 'uppercase', margin: '0 0 18px' }}>
            Pending confirmation
          </Text>

          <Text style={{ color: '#e5e5ea', fontSize: 15, lineHeight: 1.6, margin: '0 0 16px' }}>
            Thanks for the booking request — I'll review the details and confirm the slot
            within 24 hours. You'll get another email as soon as it's locked in.
          </Text>

          <Section style={{ backgroundColor: '#141418', borderRadius: 10, padding: '16px 18px', marginBottom: 16 }}>
            <Text style={{ color: '#9b9ba3', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 10px' }}>
              Your booking
            </Text>
            <Text style={{ color: '#f5f5f7', fontSize: 14, margin: '0 0 6px' }}>
              <strong style={{ color: '#9b9ba3', fontWeight: 500 }}>Service: </strong>
              {service}
            </Text>
            <Text style={{ color: '#f5f5f7', fontSize: 14, margin: '0 0 6px' }}>
              <strong style={{ color: '#9b9ba3', fontWeight: 500 }}>Date: </strong>
              {fmtDate(preferredDate)}
            </Text>
            {preferredTime ? (
              <Text style={{ color: '#f5f5f7', fontSize: 14, margin: '0 0 6px' }}>
                <strong style={{ color: '#9b9ba3', fontWeight: 500 }}>Time: </strong>
                {preferredTime}
              </Text>
            ) : null}
            {notes ? (
              <Text style={{ color: '#cfcfd6', fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: '10px 0 0' }}>
                <strong style={{ color: '#9b9ba3', fontWeight: 500 }}>Notes: </strong>
                {notes}
              </Text>
            ) : null}
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
  component: BookingConfirmation,
  subject: (data: Record<string, any>) =>
    `Booking received${data?.name ? `, ${data.name}` : ''} — Ali Nur Hasan`,
  displayName: 'Booking confirmation (to client)',
  previewData: {
    name: 'Jane',
    service: 'Brand Identity',
    preferredDate: new Date().toISOString().slice(0, 10),
    preferredTime: '14:00',
    notes: 'Looking for a refresh of my packaging line.',
  },
} satisfies TemplateEntry
