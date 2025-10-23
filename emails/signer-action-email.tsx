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
} from '@react-email/components';

interface SignerActionEmailProps {
  ownerName: string;
  ownerEmail: string;
  organizationName: string;
  accountAddress: string;
  requestedChanges: string;
  actionLink: string;
}

export default function SignerActionEmail({
  ownerName,
  ownerEmail,
  organizationName,
  accountAddress,
  requestedChanges,
  actionLink,
}: SignerActionEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>🔐 Signer Approval Required</Heading>

          <Text style={text}>
            <strong>{ownerName}</strong> ({ownerEmail}) has requested to update the multisig signers for{' '}
            <strong>{organizationName}</strong>.
          </Text>

          <Section style={infoBox}>
            <Text style={infoLabel}>Account:</Text>
            <Text style={infoValue}>{accountAddress}</Text>
            
            <Text style={infoLabel}>Requested Changes:</Text>
            <Text style={infoValue}>{requestedChanges}</Text>
          </Section>

          <Text style={text}>
            Your approval is required to proceed with this change. Please review the request and sign if you approve.
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={actionLink}>
              Review & Sign Request
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            This is an important security action. Only approve if you recognize this request.
          </Text>

          <Text style={footer}>
            If you did not expect this request, please contact {ownerName} immediately.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const h1 = {
  color: '#1a1a1a',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0 40px',
};

const text = {
  color: '#484848',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
  padding: '0 40px',
};

const infoBox = {
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 40px',
};

const infoLabel = {
  color: '#6b7280',
  fontSize: '14px',
  fontWeight: '600',
  margin: '8px 0 4px 0',
};

const infoValue = {
  color: '#1a1a1a',
  fontSize: '15px',
  margin: '0 0 16px 0',
  wordBreak: 'break-all' as const,
};

const buttonContainer = {
  padding: '27px 40px 27px',
};

const button = {
  backgroundColor: '#5469d4',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '100%',
  padding: '14px 20px',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 40px',
};

const footer = {
  color: '#8898aa',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '12px 0',
  padding: '0 40px',
};
