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

interface BookingNotificationProps {
  name?: string
  email?: string
  phone?: string
  service?: string
  preferredDate?: string
  preferredTime?: string
  notes?: string
  submittedAt?: string
}

function BookingNotification({
  name = '',
  email = '',
  phone = '',
  service = '',
  preferredDate = '',
  preferredTime = '',
  notes = '',
  submittedAt = new Date().toISOString(),
}: BookingNotificationProps) {
  return (
    <Html>
      <Head />
      <Preview>{`New booking from ${name || email}`}</Preview>
      <Body style={{ backgroundColor: '#ffffff', fontFamily: 'system-ui, -apple-system, sans-serif', margin: 0, padding: '24px 0' }}>
        <Container style={{ backgroundColor: '#0b0b0d', border: '1px solid #2a2a30', borderRadius: 14, padding: 28, maxWidth: 560 }}>
          <Heading style={{ color: '#f5f5f7', fontSize: 20, margin: '0 0 6px' }}>
            📅 New booking request
          </Heading>
          <Text style={{ color: '#c9a961', fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', margin: '0 0 18px' }}>
            Pending review
          </Text>

          <Section style={{ backgroundColor: '#141418', borderRadius: 10, padding: '16px 18px', marginBottom: 14 }}>
            <Text style={{ color: '#9b9ba3', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 8px' }}>
              Client
            </Text>
            <Text style={{ color: '#f5f5f7', fontSize: 14, margin: '0 0 4px' }}>{name}</Text>
            <Text style={{ color: '#cfcfd6', fontSize: 13, margin: '0 0 4px' }}>{email}</Text>
            {phone ? <Text style={{ color: '#cfcfd6', fontSize: 13, margin: 0 }}>{phone}</Text> : null}
          </Section>

          <Section style={{ backgroundColor: '#141418', borderRadius: 10, padding: '16px 18px', marginBottom: 14 }}>
            <Text style={{ color: '#9b9ba3', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 8px' }}>
              Booking
            </Text>
            <Text style={{ color: '#f5f5f7', fontSize: 14, margin: '0 0 4px' }}>
              <strong style={{ color: '#9b9ba3', fontWeight: 500 }}>Service: </strong>{service || '—'}
            </Text>
            <Text style={{ color: '#f5f5f7', fontSize: 14, margin: '0 0 4px' }}>
              <strong style={{ color: '#9b9ba3', fontWeight: 500 }}>Date: </strong>{preferredDate || '—'}
            </Text>
            {preferredTime ? (
              <Text style={{ color: '#f5f5f7', fontSize: 14, margin: 0 }}>
                <strong style={{ color: '#9b9ba3', fontWeight: 500 }}>Time: </strong>{preferredTime}
              </Text>
            ) : null}
          </Section>

          {notes ? (
            <Section style={{ backgroundColor: '#141418', borderRadius: 10, padding: '16px 18px', marginBottom: 14 }}>
              <Text style={{ color: '#9b9ba3', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 8px' }}>
                Notes
              </Text>
              <Text style={{ color: '#cfcfd6', fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0 }}>
                {notes}
              </Text>
            </Section>
          ) : null}

          <Text style={{ color: '#6b6b75', fontSize: 12, margin: '12px 0 0' }}>
            Submitted {new Date(submittedAt).toLocaleString()}
          </Text>

          <Hr style={{ borderColor: '#2a2a30', margin: '18px 0 10px' }} />
          <Text style={{ color: '#9b9ba3', fontSize: 12, margin: 0 }}>
            Manage in <a href="https://alii.uk/admin/bookings" style={{ color: '#c9a961', textDecoration: 'none' }}>Admin → Bookings</a>
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: BookingNotification,
  subject: (data: Record<string, any>) =>
    `📅 New booking — ${data?.name || data?.email || 'unknown'}`,
  displayName: 'Booking notification (to admin)',
  previewData: {
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '+44 7000 111222',
    service: 'Brand Identity',
    preferredDate: new Date().toISOString().slice(0, 10),
    preferredTime: '14:00',
    notes: 'Refresh of packaging line.',
    submittedAt: new Date().toISOString(),
  },
} satisfies TemplateEntry
