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

interface WelcomeProps {
  name?: string
}

function WelcomeEmail({ name = 'there' }: WelcomeProps) {
  return (
    <Html>
      <Head />
      <Preview>{`Welcome to alii.uk, ${name} — glad to have you on board.`}</Preview>
      <Body style={{ backgroundColor: '#ffffff', fontFamily: 'system-ui, -apple-system, sans-serif', margin: 0, padding: '24px 0' }}>
        <Container style={{ backgroundColor: '#0b0b0d', border: '1px solid #2a2a30', borderRadius: 14, padding: 28, maxWidth: 560 }}>
          <Heading style={{ color: '#f5f5f7', fontSize: 22, margin: '0 0 6px' }}>
            Welcome, {name} 👋
          </Heading>
          <Text style={{ color: '#c9a961', fontSize: 13, letterSpacing: 1, textTransform: 'uppercase', margin: '0 0 18px' }}>
            Account created
          </Text>

          <Text style={{ color: '#e5e5ea', fontSize: 15, lineHeight: 1.6, margin: '0 0 16px' }}>
            Thanks for signing up. Your account is ready — you can sign in any time
            and start exploring the portfolio, projects, and services.
          </Text>

          <Section style={{ backgroundColor: '#141418', borderRadius: 10, padding: '16px 18px', marginBottom: 16 }}>
            <Text style={{ color: '#9b9ba3', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 6px' }}>
              What's next
            </Text>
            <Text style={{ color: '#cfcfd6', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
              • Browse the latest projects and case studies<br />
              • Get in touch via the contact form for new work<br />
              • Reply to this email any time — I read every one
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
  component: WelcomeEmail,
  subject: (data: Record<string, any>) =>
    `Welcome to alii.uk${data?.name ? `, ${data.name}` : ''} 👋`,
  displayName: 'Welcome (post-signup)',
  previewData: { name: 'Jane' },
} satisfies TemplateEntry
