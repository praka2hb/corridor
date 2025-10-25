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

interface PaymentExecutedNotificationProps {
  employeeName: string
  organizationName: string
  amount: number
  paymentDate: string
  nextPaymentDate?: string
  dashboardLink: string
}

export default function PaymentExecutedNotification({
  employeeName,
  organizationName,
  amount,
  paymentDate,
  nextPaymentDate,
  dashboardLink,
}: PaymentExecutedNotificationProps) {
  const formattedNextDate = nextPaymentDate
    ? new Date(nextPaymentDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Payment Received! 💸</Heading>
          
          <Text style={greeting}>
            Hi {employeeName},
          </Text>

          <Text style={text}>
            Good news! You've received a payment from <strong>{organizationName}</strong>.
          </Text>

          <Section style={amountBox}>
            <Text style={amountLabel}>Amount Received</Text>
            <Text style={amountValue}>{amount} USDC</Text>
            <Text style={dateText}>{paymentDate}</Text>
          </Section>

          <Text style={text}>
            The payment has been sent to your wallet and should be available now.
          </Text>

          {nextPaymentDate && (
            <Section style={nextPaymentBox}>
              <Text style={nextPaymentLabel}>Next Payment</Text>
              <Text style={nextPaymentValue}>{formattedNextDate}</Text>
            </Section>
          )}

          <Section style={buttonContainer}>
            <Button style={button} href={dashboardLink}>
              View Payment History
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            You can view all your payment details and history in your dashboard.
          </Text>
          
          <Text style={footer}>
            This is an automated notification from Corridor.
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

const amountBox = {
  backgroundColor: '#ecfdf5',
  borderRadius: '12px',
  padding: '32px',
  margin: '24px 48px',
  textAlign: 'center' as const,
  border: '2px solid #10b981',
}

const amountLabel = {
  color: '#065f46',
  fontSize: '14px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0 0 8px 0',
}

const amountValue = {
  color: '#047857',
  fontSize: '36px',
  fontWeight: 'bold',
  margin: '8px 0',
}

const dateText = {
  color: '#059669',
  fontSize: '14px',
  margin: '8px 0 0 0',
}

const nextPaymentBox = {
  backgroundColor: '#f3f4f6',
  borderRadius: '8px',
  padding: '16px',
  margin: '16px 48px',
  textAlign: 'center' as const,
}

const nextPaymentLabel = {
  color: '#6b7280',
  fontSize: '12px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0 0 4px 0',
}

const nextPaymentValue = {
  color: '#1f2937',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '4px 0 0 0',
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
