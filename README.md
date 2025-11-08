# Corridor - Modern Global Payroll Platform

<div align="center">

**Transforming team payments with onchain automation**

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Solana](https://img.shields.io/badge/Solana-Web3-purple?style=flat&logo=solana)](https://solana.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.2-2D3748?style=flat&logo=prisma)](https://www.prisma.io/)

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [Architecture](#-architecture)
  - [Frontend Architecture](#frontend-architecture)
  - [Backend Architecture](#backend-architecture)
  - [Database Schema](#database-schema)
- [Squads Grid Protocol Integration](#-squads-grid-protocol-integration)
- [Kamino Finance Integration](#-kamino-finance-integration)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Security & Compliance](#-security--compliance)
- [Development](#-development)
- [Contributing](#-contributing)
- [License](#-license)
- [Links](#-links)

---

## 🌟 Overview

**Corridor** is a next-generation global payroll platform built on Solana blockchain that enables organizations to pay employees worldwide using USDC stablecoins. The platform combines institutional-grade security through multi-signature wallets, automated payroll streams, and DeFi yield generation to create a comprehensive financial management solution for modern businesses.

### Why Corridor?

- **Instant Global Payments**: Pay employees anywhere in the world in seconds, not days
- **Minimal Fees**: Transaction costs are fractions of a penny compared to traditional wire transfers
- **Non-Custodial Security**: Organizations maintain full control of their funds through multi-sig wallets
- **Auto-Investment**: Employees can automatically invest portions of their payroll into high-yield DeFi protocols
- **Regulatory Compliance**: Built-in KYC/AML compliance through Grid Protocol
- **Transparent & Auditable**: All transactions are recorded on-chain for complete transparency

---

## 🚀 Key Features

### 1. **Atomic Bulk Payments**
Pay 1 or 1,000 employees in a single, secure transaction for a fraction of a penny. Powered by Solana's high-throughput blockchain.

### 2. **Non-Custodial Security**
Built on self-custody principles with multi-signature wallet architecture powered by Squads Grid Protocol.

### 3. **Fiat-to-Crypto Ramps**
Seamlessly move between USDC and local currencies through integrated on/off-ramp partners.

### 4. **Auto-Invest Savings**
Employees can automatically allocate a percentage of each paycheck to high-yield DeFi protocols like Kamino Finance.

### 5. **Treasury Management**
Institutional-grade treasury with dedicated USDC virtual accounts.

### 6. **Payroll Streams**
Configure automated recurring payments with customizable cadences (weekly, bi-weekly, monthly).

### 7. **Team Management**
Organize employees into teams with custom payroll configurations.

### 8. **Compliance & Monitoring**
Built-in KYC verification through Grid Protocol with automated reporting.

---

## 🛠 Technology Stack

### Frontend
- **Framework**: Next.js 14.2 with App Router
- **Language**: TypeScript 5.0
- **Styling**: Tailwind CSS 4.1
- **UI Components**: Radix UI
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **Authentication**: Privy
- **Theme**: next-themes

### Backend
- **Runtime**: Node.js with Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Blockchain**: Solana Web3.js
- **Email**: Resend + React Email
- **Notifications**: Sonner

### Blockchain & DeFi
- **Wallet Infrastructure**: Squads Grid Protocol (@sqds/grid)
- **Multi-sig SDK**: @sqds/multisig
- **DeFi Integration**: Kamino Finance (@kamino-finance/klend-sdk)
- **Token Standard**: SPL Token (@solana/spl-token)
- **Network**: Solana Mainnet Beta

---

## 🏗 Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                        │
│  • React Components                                          │
│  • Privy Authentication                                      │
│  • Real-time Updates                                         │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  Backend API (Next.js Routes)                │
│  • Grid Client Service                                       │
│  • Kamino Service                                            │
│  • Payroll Service                                           │
│  • Investment Service                                        │
└────────┬──────────────────────────┬─────────────────────────┘
         │                          │
         ▼                          ▼
┌──────────────────┐      ┌──────────────────┐
│  PostgreSQL DB   │      │  Solana Blockchain│
│  • Prisma ORM    │      │  • Grid Protocol  │
│  • User Data     │      │  • Kamino Finance │
│  • Transactions  │      │  • SPL Tokens     │
└──────────────────┘      └──────────────────┘
```

### Frontend Architecture

Built with Next.js 14 using the App Router pattern.

#### Key Components

**Authentication Flow**
```
User → Privy Auth → Grid KYC → Session Management → Dashboard
```

**Organization Hierarchy**
```
Organization
  ├── Members (owner, admin, member)
  ├── Teams
  │   └── Team Members
  ├── Employees
  │   ├── Payroll Streams
  │   ├── Investment Preferences
  │   └── Positions (Kamino)
  └── Treasury (Grid Account)
```

**Page Structure**
```
app/
├── page.tsx              # Landing page
├── auth/                 # Authentication
├── home/                 # Dashboard
├── organization/         # Org management
│   ├── treasury/        # Treasury overview
│   ├── members/         # Member management
│   └── settings/        # Settings
├── payroll/             # Payroll config
├── payments/            # Payment history
├── investments/         # Investment dashboard
└── api/                 # API routes
```

### Backend Architecture

#### Core Services

**1. Grid Client Service** (`lib/grid/client.ts`)
- `updateAccount()` - Add/remove signers, change threshold
- `sign()` - MPC transaction signing
- `signAndSend()` - Sign and submit transaction
- `createStandingOrder()` - Recurring payments
- `getTransfers()` - Transaction history
- `prepareArbitraryTransaction()` - Custom Solana transactions

**2. Kamino Service** (`lib/kamino-service.ts`)
- `depositToKamino()` - Deposit USDC to earn yield
- `withdrawFromKamino()` - Withdraw USDC + interest
- `getObligationAddress()` - Get user's lending position
- `getReserveData()` - Fetch APY and liquidity
- `syncPosition()` - Update position from on-chain data

**3. Payroll Service** (`lib/services/payroll.ts`)
- `createPayrollStream()` - Set up recurring payments
- `executePayroll()` - Process payroll run
- `pauseStream()` - Pause/resume streams
- `calculateNextRun()` - Schedule next payment

**4. Investment Service** (`lib/services/investment.ts`)
- `processAutoInvestment()` - Execute auto-invest on payroll
- `updatePreferences()` - Set investment percentage
- `getPositions()` - Fetch employee positions
- `calculateYield()` - Calculate earned interest

### Database Schema

#### Core Models

**User & Organization**
```prisma
model User {
  id                      String    @id @default(cuid())
  email                   String    @unique
  gridUserId              String?   @unique
  publicKey               String?   @unique
  kycStatus               String?
  encryptedSessionSecrets String?   // Encrypted MPC secrets
  investmentPercentage    Int?      // Auto-invest %
}

model Organization {
  id                    String   @id
  name                  String
  creatorAccountAddress String   // Grid account
  members               OrganizationMember[]
  teams                 Team[]
  employees             EmployeeProfile[]
}
```

**Payroll**
```prisma
model PayrollStream {
  id                  String    @id
  employeeId          String
  amountMonthly       Float
  currency            String    @default("USDC")
  cadence             String    // monthly, biweekly, weekly
  status              String    // active, paused, stopped
  gridStandingOrderId String?
  nextRunAt           DateTime?
}
```

**Investments**
```prisma
model EmployeeObligation {
  id                String   @id
  employeeId        String
  obligationAddress String   @unique  // Kamino position
  marketAddress     String
}

model EmployeePosition {
  id            String   @id
  employeeId    String
  provider      String   // 'kamino'
  depositShares Float    // kToken balance
  depositValue  Float    // USD value
}
```

---

## 🔐 Squads Grid Protocol Integration

Corridor leverages [Squads Grid Protocol](https://squads.xyz/grid) for institutional-grade wallet infrastructure.

### What is Grid Protocol?

Grid provides:
- **Multi-Party Computation (MPC)**: Distributed key generation and signing
- **Multi-Signature Wallets**: Require multiple approvals
- **Virtual Accounts**: Dedicated accounts per employee
- **Standing Orders**: Automated recurring payments
- **Compliance**: Built-in KYC/AML verification

### Grid Architecture

```
Corridor App → Grid Client → Grid SDK → Grid API → Solana
```

### Key Features

#### 1. Multi-Signature Accounts

```typescript
await updateAccount({
  accountAddress: "org_multisig_address",
  signers: ["signer1", "signer2", "signer3"],
  threshold: 2, // Require 2 of 3 signatures
});
```

#### 2. MPC Transaction Signing

```typescript
const signedTx = await sign({
  sessionSecrets: decryptedSecrets,
  transactionPayload: gridTransaction,
  session: authSession
});
```

#### 3. Standing Orders

```typescript
const standingOrder = await createStandingOrder(accountAddress, {
  recipient: employeeWallet,
  amount: 5000,
  token: "USDC",
  frequency: "monthly"
});
```

#### 4. KYC Integration

```typescript
const kycLink = await initiateKYC({
  userId: user.id,
  email: user.email,
  type: "individual"
});
```

### Security

- Session secrets encrypted with AES-256-GCM
- JWT-based authentication with 1-hour expiration
- HTTP-only cookies with secure flags
- Transaction limits and velocity checks
- Anomaly detection

---

## 💰 Kamino Finance Integration

Corridor integrates with [Kamino Finance](https://kamino.finance/) for DeFi yield generation.

### What is Kamino Finance?

Kamino offers:
- **High-Yield Lending**: Earn interest by supplying assets
- **Automated Strategies**: Optimized yield farming
- **Risk Management**: Conservative, audited strategies
- **Deep Liquidity**: Billions in TVL

### Kamino Architecture

```
Employee → Kamino Service → Kamino SDK → Kamino Protocol → Solana
```

### How It Works

#### Deposit Flow

```typescript
// 1. Prepare deposit transaction
const depositTx = await depositToKamino({
  employeeId: "emp_123",
  assetSymbol: "USDC",
  amount: 1000,
  employeeWallet: "wallet_address"
});

// 2. Employee signs with Grid wallet
const signedTx = await signTransactionWithGrid(
  depositTx.serializedTransaction
);

// 3. Submit to Solana
const signature = await submitTransaction(signedTx);

// 4. Confirm and update database
await confirmInvestment({
  employeeId: "emp_123",
  transactionSignature: signature
});
```

#### What Happens On-Chain

1. USDC transferred to Kamino reserve
2. kTokens minted to employee (receipt tokens)
3. Interest accrues automatically
4. kToken value increases over time

#### Withdrawal Flow

```typescript
const withdrawTx = await withdrawFromKamino({
  employeeId: "emp_123",
  assetSymbol: "USDC",
  amount: 1050, // Original + interest
  employeeWallet: "wallet_address"
});
```

### Auto-Investment

Employees can auto-invest a percentage of each paycheck:

```typescript
await updateInvestmentPreference({
  employeeId: "emp_123",
  percentToInvestment: 20 // 20% of each paycheck
});
```

### Supported Assets

| Asset | Symbol | Typical APY |
|-------|--------|-------------|
| USD Coin | USDC | 3-5% |
| Solana | SOL | 5-8% |
| Marinade SOL | mSOL | 6-9% |
| Jito SOL | JitoSOL | 6-9% |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Solana RPC endpoint
- Grid Protocol API credentials
- Kamino market address

### Installation

```bash
# Clone the repository
git clone https://github.com/praka2hb/corridor.git
cd corridor

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Set up database
npx prisma generate
npx prisma db push

# Seed database (optional)
npm run db:seed

# Start development server
npm run dev
```

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/corridor"

# Grid Protocol
GRID_API_KEY="your_grid_api_key"
GRID_API_SECRET="your_grid_api_secret"

# Kamino Finance
KAMINO_MARKET_ADDRESS="7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF"

# Solana
SOLANA_RPC_ENDPOINT="https://api.mainnet-beta.solana.com"
SOLANA_CLUSTER="mainnet-beta"

# Encryption
ENCRYPTION_KEY="your_32_byte_encryption_key"

# Privy
NEXT_PUBLIC_PRIVY_APP_ID="your_privy_app_id"
PRIVY_APP_SECRET="your_privy_secret"

# Email
RESEND_API_KEY="your_resend_api_key"
```

---

## 📁 Project Structure

```
corridor/
├── app/                      # Next.js app directory
│   ├── api/                 # API routes
│   │   ├── organization/   # Org management
│   │   ├── employee/       # Employee management
│   │   ├── investments/    # Kamino integration
│   │   ├── kyc/            # KYC verification
│   │   └── transactions/   # Payment processing
│   ├── auth/               # Authentication pages
│   ├── home/               # Dashboard
│   ├── organization/       # Org pages
│   ├── payroll/            # Payroll management
│   ├── payments/           # Payment history
│   └── investments/        # Investment dashboard
├── components/              # React components
│   ├── ui/                 # Reusable UI components
│   ├── kamino-modal.tsx    # Investment modal
│   ├── payments.tsx        # Payment interface
│   └── payroll.tsx         # Payroll interface
├── lib/                     # Core libraries
│   ├── grid/               # Grid Protocol client
│   │   ├── client.ts      # Grid operations
│   │   └── sdkClient.ts   # SDK wrapper
│   ├── services/           # Business logic
│   │   ├── payroll.ts     # Payroll service
│   │   └── investment.ts  # Investment service
│   ├── kamino-service.ts   # Kamino integration
│   ├── crypto.ts           # Encryption utilities
│   └── utils.ts            # Helper functions
├── prisma/                  # Database
│   ├── schema.prisma       # Database schema
│   ├── migrations/         # Migration history
│   └── seed.ts             # Seed data
├── docs/                    # Documentation
│   └── KAMINO_INTEGRATION.md
├── scripts/                 # Utility scripts
└── public/                  # Static assets
```

---

## 📚 API Documentation

### Organization Management

**Create Organization**
```http
POST /api/organization/create
Content-Type: application/json

{
  "name": "Acme Corp",
  "creatorAccountAddress": "grid_account_address"
}
```

**Add Member**
```http
POST /api/organization/:id/members
Content-Type: application/json

{
  "email": "member@example.com",
  "role": "admin",
  "position": "CFO"
}
```

### Payroll

**Create Employee**
```http
POST /api/employee/create
Content-Type: application/json

{
  "orgId": "org_123",
  "name": "John Doe",
  "email": "john@example.com",
  "payoutWallet": "solana_wallet_address"
}
```

**Create Payroll Stream**
```http
POST /api/employee/:id/stream
Content-Type: application/json

{
  "amountMonthly": 5000,
  "currency": "USDC",
  "cadence": "monthly"
}
```

### Investments (Kamino)

**Deposit**
```http
POST /api/investments/stake
Content-Type: application/json

{
  "employeeId": "emp_123",
  "assetSymbol": "USDC",
  "amount": 1000,
  "employeeWallet": "wallet_address",
  "idempotencyKey": "unique_key"
}

Response:
{
  "success": true,
  "data": {
    "serializedTransaction": "base64_encoded_tx",
    "obligationAddress": "obligation_pda",
    "ledgerId": "ledger_123"
  }
}
```

**Confirm Transaction**
```http
POST /api/investments/confirm
Content-Type: application/json

{
  "employeeId": "emp_123",
  "transactionSignature": "solana_tx_sig",
  "ledgerId": "ledger_123"
}
```

---

## 🔒 Security & Compliance

### Security Measures

1. **Encryption at Rest**
   - Session secrets encrypted with AES-256-GCM
   - Database credentials stored securely
   - Environment variables never committed

2. **Multi-Signature Security**
   - Configurable threshold signatures
   - MPC key management
   - No single point of failure

3. **Session Management**
   - 30-minute inactivity timeout
   - Automatic re-authentication
   - Secure session storage

4. **Transaction Security**
   - Pre-flight validation
   - Spending limits
   - Anomaly detection

### Compliance

1. **KYC/AML**
   - Grid Protocol KYC integration
   - Identity verification
   - Sanctions screening

2. **Audit Trail**
   - All transactions recorded on-chain
   - Complete transaction history
   - Exportable reports

3. **Data Privacy**
   - GDPR compliant
   - User data encryption
   - Right to deletion

---

## 💻 Development

### Available Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint

# Database
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema to database
npm run db:seed          # Seed database
npm run db:studio        # Open Prisma Studio

# Scripts
npm run align-payroll    # Align payroll with Grid
```

### Testing

```bash
# Run tests (when implemented)
npm test

# Run specific test
npm test -- kamino-service.test.ts
```

### Code Style

- TypeScript for type safety
- ESLint for code quality
- Prettier for formatting
- Conventional commits

---

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

---

## 📄 License

This project is proprietary and confidential.

---

## 🔗 Links

- [Squads Grid Protocol](https://squads.xyz/grid)
- [Kamino Finance](https://kamino.finance/)
- [Solana Documentation](https://solana.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)