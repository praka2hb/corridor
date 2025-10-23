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

interface OwnerReadyEmailProps {
  ownerName: string;
  organizationName: string;
  accountAddress: string;
  requestedChanges: string;
  finalizeLink: string;
  signersCount: number;
}

export default function OwnerReadyEmail({
  ownerName,
  organizationName,
  accountAddress,
  requestedChanges,
  finalizeLink,
  signersCount,
}: OwnerReadyEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>✅ All Signers Approved</Heading>

          <Text style={text}>
            Good news, <strong>{ownerName}</strong>!
          </Text>

          <Text style={text}>
            All {signersCount} required signer{signersCount > 1 ? 's have' : ' has'} approved your multisig update request for{' '}
            <strong>{organizationName}</strong>.
          </Text>

          <Section style={infoBox}>
            <Text style={infoLabel}>Account:</Text>
            <Text style={infoValue}>{accountAddress}</Text>
            
            <Text style={infoLabel}>Approved Changes:</Text>
            <Text style={infoValue}>{requestedChanges}</Text>
          </Section>

          <Text style={text}>
            You can now finalize and submit the changes to the blockchain.
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={finalizeLink}>
              Finalize & Submit
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            This action will execute the multisig account update on the Solana blockchain.
          </Text>

          <Text style={footer}>
            You received this email because you initiated a signer update request for {organizationName}.
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
  backgroundColor: '#f0fdf4',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 40px',
  borderLeft: '4px solid #10b981',
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
  backgroundColor: '#10b981',
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
