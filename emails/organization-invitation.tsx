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
          
          <Text style={greeting}>
            Hi there,
          </Text>

          <Text style={text}>
            <strong>{inviterName}</strong> has invited you to join <strong>{organizationName}</strong> on Corridor.
          </Text>

          <Section style={detailsBox}>
            <Text style={detailsTitle}>Invitation Details</Text>
            <Hr style={divider} />
            <Text style={detailRow}>
              <span style={detailLabel}>Organization:</span> 
              <span style={detailValue}>{organizationName}</span>
            </Text>
            <Text style={detailRow}>
              <span style={detailLabel}>Role:</span> 
              <span style={detailValue}>{role.charAt(0).toUpperCase() + role.slice(1)}</span>
            </Text>
            {position && (
              <Text style={detailRow}>
                <span style={detailLabel}>Position:</span> 
                <span style={detailValue}>{position}</span>
              </Text>
            )}
          </Section>

          <Text style={text}>
            Corridor is a modern platform for managing payroll, payments, and treasury operations. 
            Accept this invitation to get started with your new role.
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={acceptLink}>
              Accept Invitation
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            This invitation will expire in 7 days. If you don't want to join this organization, 
            you can safely ignore this email.
          </Text>
          
          <Text style={footer}>
            If you have any questions, please contact {inviterName} directly.
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

const greeting = {
  color: '#374151',
  fontSize: '18px',
  lineHeight: '24px',
  margin: '16px 0',
  padding: '0 48px',
}

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
  padding: '0 48px',
}

const detailsBox = {
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 48px',
}

const detailsTitle = {
  color: '#1f2937',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 12px 0',
}

const divider = {
  borderColor: '#e5e7eb',
  margin: '12px 0',
}

const detailRow = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '8px 0',
  display: 'flex' as const,
  justifyContent: 'space-between' as const,
}

const detailLabel = {
  color: '#6b7280',
  fontWeight: '500',
}

const detailValue = {
  color: '#1f2937',
  fontWeight: 'bold',
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
