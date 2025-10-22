-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MEMBER', 'OWNER');

-- CreateEnum
CREATE TYPE "TeamRole" AS ENUM ('LEAD', 'MEMBER');

-- CreateEnum
CREATE TYPE "ComplianceStatus" AS ENUM ('PENDING', 'SUBMITTED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('USDC');

-- CreateEnum
CREATE TYPE "StreamFrequency" AS ENUM ('ONCE', 'WEEKLY', 'BIWEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "StreamStatus" AS ENUM ('ACTIVE', 'PAUSED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "RunStatus" AS ENUM ('QUEUED', 'PROCESSING', 'SUCCESS', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LedgerEntryType" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "LedgerCategory" AS ENUM ('PAYROLL', 'INVESTMENT', 'FEE', 'TRANSFER', 'FUNDING', 'REFUND');

-- CreateEnum
CREATE TYPE "InvestmentStrategy" AS ENUM ('OFF', 'MANUAL', 'AUTO_INVEST');

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gridOrgId" TEXT,
    "treasuryAccountId" TEXT,
    "kybStatus" "ComplianceStatus",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "gridUserId" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'MEMBER',
    "kycStatus" "ComplianceStatus",
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "orgId" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "orgId" TEXT NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMember" (
    "id" TEXT NOT NULL,
    "role" "TeamRole" NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeProfile" (
    "id" TEXT NOT NULL,
    "payoutWallet" TEXT NOT NULL,
    "gridPaymentAccountId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,

    CONSTRAINT "EmployeeProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollStream" (
    "id" TEXT NOT NULL,
    "amount" DECIMAL(20,6) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'USDC',
    "frequency" "StreamFrequency" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "status" "StreamStatus" NOT NULL DEFAULT 'ACTIVE',
    "gridStreamId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "orgId" TEXT NOT NULL,
    "employeeProfileId" TEXT NOT NULL,

    CONSTRAINT "PayrollStream_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StreamRun" (
    "id" TEXT NOT NULL,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "executedAt" TIMESTAMP(3),
    "amount" DECIMAL(20,6) NOT NULL,
    "status" "RunStatus" NOT NULL DEFAULT 'QUEUED',
    "transactionId" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payrollStreamId" TEXT NOT NULL,

    CONSTRAINT "StreamRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestmentPreference" (
    "id" TEXT NOT NULL,
    "assetSymbol" TEXT NOT NULL,
    "allocationPercent" INTEGER NOT NULL,
    "strategy" "InvestmentStrategy" NOT NULL DEFAULT 'MANUAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "orgId" TEXT NOT NULL,

    CONSTRAINT "InvestmentPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerTransaction" (
    "id" TEXT NOT NULL,
    "type" "LedgerEntryType" NOT NULL,
    "category" "LedgerCategory" NOT NULL,
    "amount" DECIMAL(20,6) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'USDC',
    "memo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "orgId" TEXT NOT NULL,
    "userId" TEXT,
    "streamRunId" TEXT,

    CONSTRAINT "LedgerTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_gridOrgId_key" ON "Organization"("gridOrgId");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_treasuryAccountId_key" ON "Organization"("treasuryAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_gridUserId_key" ON "User"("gridUserId");

-- CreateIndex
CREATE INDEX "User_orgId_idx" ON "User"("orgId");

-- CreateIndex
CREATE INDEX "Team_orgId_idx" ON "Team"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "Team_orgId_name_key" ON "Team"("orgId", "name");

-- CreateIndex
CREATE INDEX "TeamMember_userId_idx" ON "TeamMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_teamId_userId_key" ON "TeamMember"("teamId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeProfile_gridPaymentAccountId_key" ON "EmployeeProfile"("gridPaymentAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeProfile_userId_key" ON "EmployeeProfile"("userId");

-- CreateIndex
CREATE INDEX "EmployeeProfile_orgId_idx" ON "EmployeeProfile"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollStream_gridStreamId_key" ON "PayrollStream"("gridStreamId");

-- CreateIndex
CREATE INDEX "PayrollStream_orgId_status_idx" ON "PayrollStream"("orgId", "status");

-- CreateIndex
CREATE INDEX "PayrollStream_employeeProfileId_idx" ON "PayrollStream"("employeeProfileId");

-- CreateIndex
CREATE INDEX "StreamRun_payrollStreamId_status_idx" ON "StreamRun"("payrollStreamId", "status");

-- CreateIndex
CREATE INDEX "InvestmentPreference_orgId_idx" ON "InvestmentPreference"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "InvestmentPreference_orgId_assetSymbol_key" ON "InvestmentPreference"("orgId", "assetSymbol");

-- CreateIndex
CREATE INDEX "LedgerTransaction_orgId_idx" ON "LedgerTransaction"("orgId");

-- CreateIndex
CREATE INDEX "LedgerTransaction_userId_idx" ON "LedgerTransaction"("userId");

-- CreateIndex
CREATE INDEX "LedgerTransaction_streamRunId_idx" ON "LedgerTransaction"("streamRunId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeProfile" ADD CONSTRAINT "EmployeeProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeProfile" ADD CONSTRAINT "EmployeeProfile_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollStream" ADD CONSTRAINT "PayrollStream_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollStream" ADD CONSTRAINT "PayrollStream_employeeProfileId_fkey" FOREIGN KEY ("employeeProfileId") REFERENCES "EmployeeProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StreamRun" ADD CONSTRAINT "StreamRun_payrollStreamId_fkey" FOREIGN KEY ("payrollStreamId") REFERENCES "PayrollStream"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestmentPreference" ADD CONSTRAINT "InvestmentPreference_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerTransaction" ADD CONSTRAINT "LedgerTransaction_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerTransaction" ADD CONSTRAINT "LedgerTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerTransaction" ADD CONSTRAINT "LedgerTransaction_streamRunId_fkey" FOREIGN KEY ("streamRunId") REFERENCES "StreamRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;
