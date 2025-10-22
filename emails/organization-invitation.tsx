import {
  Html,
  Head,
  Body,
  Container,
  Text,
  Button,
  Section,
  Heading,
  Hr,
} from '@react-email/components'

interface OrganizationInvitationProps {
  organizationName: string
  inviterName: string
  acceptLink: string
  role: string
  position?: string
}

export default function OrganizationInvitation({
  organizationName,
  inviterName,
  acceptLink,
  role,
  position,
}: OrganizationInvitationProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>You're Invited! 🎉</Heading>
          
          <Text style={text}>
            <strong>{inviterName}</strong> has invited you to join <strong>{organizationName}</strong> on Corridor.
          </Text>

          {position && (
            <Text style={text}>
              Position: <strong>{position}</strong>
            </Text>
          )}

          <Text style={text}>
            Role: <strong style={roleStyle}>{role.charAt(0).toUpperCase() + role.slice(1)}</strong>
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={acceptLink}>
              Accept Invitation
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            Or copy and paste this link into your browser:
          </Text>
          <Text style={linkText}>
            {acceptLink}
          </Text>

          <Text style={footer}>
            This invitation will expire in 7 days.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  borderRadius: '8px',
  maxWidth: '600px',
}

const h1 = {
  color: '#1f2937',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0 48px',
  textAlign: 'center' as const,
}

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
  padding: '0 48px',
}

const roleStyle = {
  color: '#2563eb',
}

const buttonContainer = {
  padding: '27px 0 27px',
  textAlign: 'center' as const,
}

const button = {
  backgroundColor: '#2563eb',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 24px',
  margin: '0 auto',
}

const hr = {
  borderColor: '#e5e7eb',
  margin: '20px 0',
}

const footer = {
  color: '#6b7280',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '8px 0',
  padding: '0 48px',
}

const linkText = {
  color: '#2563eb',
  fontSize: '12px',
  lineHeight: '16px',
  padding: '0 48px',
  wordBreak: 'break-all' as const,
}
