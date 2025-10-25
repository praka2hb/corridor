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

interface PayrollCreatedNotificationProps {
  employeeName: string
  organizationName: string
  amount: number
  frequency: string
  startDate: string
  dashboardLink: string
}

export default function PayrollCreatedNotification({
  employeeName,
  organizationName,
  amount,
  frequency,
  startDate,
  dashboardLink,
}: PayrollCreatedNotificationProps) {
  const formattedDate = new Date(startDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Welcome to Payroll! 💰</Heading>
          
          <Text style={greeting}>
            Hi {employeeName},
          </Text>

          <Text style={text}>
            Great news! You've been added to <strong>{organizationName}</strong>'s payroll on Corridor.
          </Text>

          <Section style={detailsBox}>
            <Text style={detailsTitle}>Payroll Details</Text>
            <Hr style={divider} />
            <Text style={detailRow}>
              <span style={detailLabel}>Amount:</span> 
              <span style={detailValue}>{amount} USDC {frequency}</span>
            </Text>
            <Text style={detailRow}>
              <span style={detailLabel}>Frequency:</span> 
              <span style={detailValue}>{frequency.charAt(0).toUpperCase() + frequency.slice(1)}</span>
            </Text>
            <Text style={detailRow}>
              <span style={detailLabel}>Start Date:</span> 
              <span style={detailValue}>{formattedDate}</span>
            </Text>
          </Section>

          <Text style={text}>
            Your payments will be automatically sent to your wallet on the scheduled frequency. 
            You'll receive notifications each time a payment is processed.
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={dashboardLink}>
              View Payroll Dashboard
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            You can track your payment history and upcoming payments in your dashboard.
          </Text>
          
          <Text style={footer}>
            If you have any questions, please contact {organizationName}.
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
  backgroundColor: '#10b981',
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
