import {
  Html,
  Head,
  Body,
  Container,
  Text,
  Section,
} from '@react-email/components'

interface PaymentReceivedNotificationProps {
  recipientName: string
  senderEmail: string
  amount: number
  currency: string
  transactionLink: string
}

export default function PaymentReceivedNotification({
  recipientName,
  senderEmail,
  amount,
  currency,
  transactionLink,
}: PaymentReceivedNotificationProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={h1}>Payment Received</Text>
          </Section>

          <Text style={text}>
            Hi {recipientName},
          </Text>

          <Text style={text}>
            You have received {amount} {currency} from {senderEmail}.
          </Text>

          <Section style={amountBox}>
            <Text style={amountValue}>{amount} {currency}</Text>
          </Section>

          <Text style={text}>
            The payment has been sent to your wallet on Solana.
          </Text>

          <Text style={footer}>
            <a href={transactionLink} style={link}>View Transaction</a>
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
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px',
  maxWidth: '600px',
}

const header = {
  borderBottom: '2px solid #e5e7eb',
  paddingBottom: '20px',
  marginBottom: '24px',
}

const h1 = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0',
}

const text = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '12px 0',
}

const amountBox = {
  backgroundColor: '#f0fdf4',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
  textAlign: 'center' as const,
  border: '1px solid #86efac',
}

const amountValue = {
  color: '#15803d',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0',
}

const link = {
  color: '#2563eb',
  textDecoration: 'none',
}

const footer = {
  color: '#6b7280',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '16px 0',
}
