/*
  Warnings:

  - You are about to drop the column `allocationPercent` on the `InvestmentPreference` table. All the data in the column will be lost.
  - You are about to drop the column `assetSymbol` on the `InvestmentPreference` table. All the data in the column will be lost.
  - You are about to drop the column `orgId` on the `InvestmentPreference` table. All the data in the column will be lost.
  - You are about to drop the column `strategy` on the `InvestmentPreference` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `LedgerTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `memo` on the `LedgerTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `streamRunId` on the `LedgerTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `LedgerTransaction` table. All the data in the column will be lost.
  - You are about to alter the column `amount` on the `LedgerTransaction` table. The data in that column could be lost. The data in that column will be cast from `Decimal(20,6)` to `DoublePrecision`.
  - The `currency` column on the `LedgerTransaction` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `kybStatus` column on the `Organization` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `amount` on the `PayrollStream` table. All the data in the column will be lost.
  - You are about to drop the column `employeeProfileId` on the `PayrollStream` table. All the data in the column will be lost.
  - You are about to drop the column `endDate` on the `PayrollStream` table. All the data in the column will be lost.
  - You are about to drop the column `frequency` on the `PayrollStream` table. All the data in the column will be lost.
  - You are about to drop the column `gridStreamId` on the `PayrollStream` table. All the data in the column will be lost.
  - You are about to drop the column `orgId` on the `PayrollStream` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `PayrollStream` table. All the data in the column will be lost.
  - The `currency` column on the `PayrollStream` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `PayrollStream` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `amount` on the `StreamRun` table. All the data in the column will be lost.
  - You are about to drop the column `executedAt` on the `StreamRun` table. All the data in the column will be lost.
  - You are about to drop the column `payrollStreamId` on the `StreamRun` table. All the data in the column will be lost.
  - You are about to drop the column `scheduledFor` on the `StreamRun` table. All the data in the column will be lost.
  - You are about to drop the column `transactionId` on the `StreamRun` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `TeamMember` table. All the data in the column will be lost.
  - The `role` column on the `TeamMember` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `publicKey` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `username` on the `User` table. All the data in the column will be lost.
  - The `kycStatus` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[employeeId]` on the table `InvestmentPreference` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[teamId,employeeId]` on the table `TeamMember` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name` to the `EmployeeProfile` table without a default value. This is not possible if the table is not empty.
  - Made the column `orgId` on table `EmployeeProfile` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `employeeId` to the `InvestmentPreference` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `LedgerTransaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `LedgerTransaction` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `LedgerTransaction` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `amountMonthly` to the `PayrollStream` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cadence` to the `PayrollStream` table without a default value. This is not possible if the table is not empty.
  - Added the required column `employeeId` to the `PayrollStream` table without a default value. This is not possible if the table is not empty.
  - Added the required column `runAt` to the `StreamRun` table without a default value. This is not possible if the table is not empty.
  - Added the required column `streamId` to the `StreamRun` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `StreamRun` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `status` on the `StreamRun` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `employeeId` to the `TeamMember` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `role` on the `User` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `orgId` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."EmployeeProfile" DROP CONSTRAINT "EmployeeProfile_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."InvestmentPreference" DROP CONSTRAINT "InvestmentPreference_orgId_fkey";

-- DropForeignKey
ALTER TABLE "public"."LedgerTransaction" DROP CONSTRAINT "LedgerTransaction_streamRunId_fkey";

-- DropForeignKey
ALTER TABLE "public"."LedgerTransaction" DROP CONSTRAINT "LedgerTransaction_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PayrollStream" DROP CONSTRAINT "PayrollStream_employeeProfileId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PayrollStream" DROP CONSTRAINT "PayrollStream_orgId_fkey";

-- DropForeignKey
ALTER TABLE "public"."StreamRun" DROP CONSTRAINT "StreamRun_payrollStreamId_fkey";

-- DropForeignKey
ALTER TABLE "public"."TeamMember" DROP CONSTRAINT "TeamMember_userId_fkey";

-- DropIndex
DROP INDEX "public"."EmployeeProfile_gridPaymentAccountId_key";

-- DropIndex
DROP INDEX "public"."EmployeeProfile_orgId_idx";

-- DropIndex
DROP INDEX "public"."EmployeeProfile_userId_key";

-- DropIndex
DROP INDEX "public"."InvestmentPreference_orgId_assetSymbol_key";

-- DropIndex
DROP INDEX "public"."InvestmentPreference_orgId_idx";

-- DropIndex
DROP INDEX "public"."LedgerTransaction_orgId_idx";

-- DropIndex
DROP INDEX "public"."LedgerTransaction_streamRunId_idx";

-- DropIndex
DROP INDEX "public"."LedgerTransaction_userId_idx";

-- DropIndex
DROP INDEX "public"."Organization_treasuryAccountId_key";

-- DropIndex
DROP INDEX "public"."PayrollStream_employeeProfileId_idx";

-- DropIndex
DROP INDEX "public"."PayrollStream_gridStreamId_key";

-- DropIndex
DROP INDEX "public"."PayrollStream_orgId_status_idx";

-- DropIndex
DROP INDEX "public"."StreamRun_payrollStreamId_status_idx";

-- DropIndex
DROP INDEX "public"."Team_orgId_idx";

-- DropIndex
DROP INDEX "public"."Team_orgId_name_key";

-- DropIndex
DROP INDEX "public"."TeamMember_teamId_userId_key";

-- DropIndex
DROP INDEX "public"."TeamMember_userId_idx";

-- DropIndex
DROP INDEX "public"."User_orgId_idx";

-- DropIndex
DROP INDEX "public"."User_publicKey_key";

-- DropIndex
DROP INDEX "public"."User_username_key";

-- AlterTable
ALTER TABLE "EmployeeProfile" ADD COLUMN     "email" TEXT,
ADD COLUMN     "kycStatus" TEXT,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active',
ALTER COLUMN "payoutWallet" DROP NOT NULL,
ALTER COLUMN "userId" DROP NOT NULL,
ALTER COLUMN "orgId" SET NOT NULL;

-- AlterTable
ALTER TABLE "InvestmentPreference" DROP COLUMN "allocationPercent",
DROP COLUMN "assetSymbol",
DROP COLUMN "orgId",
DROP COLUMN "strategy",
ADD COLUMN     "employeeId" TEXT NOT NULL,
ADD COLUMN     "externalWallet" TEXT,
ADD COLUMN     "investmentAccountId" TEXT,
ADD COLUMN     "percentToInvestment" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "strategyId" TEXT;

-- AlterTable
ALTER TABLE "LedgerTransaction" DROP COLUMN "category",
DROP COLUMN "memo",
DROP COLUMN "streamRunId",
DROP COLUMN "userId",
ADD COLUMN     "employeeId" TEXT,
ADD COLUMN     "gridTransferId" TEXT,
ADD COLUMN     "metadata" TEXT,
ADD COLUMN     "status" TEXT NOT NULL,
ADD COLUMN     "teamId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "type",
ADD COLUMN     "type" TEXT NOT NULL,
ALTER COLUMN "amount" SET DATA TYPE DOUBLE PRECISION,
DROP COLUMN "currency",
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USDC';

-- AlterTable
ALTER TABLE "Organization" DROP COLUMN "kybStatus",
ADD COLUMN     "kybStatus" TEXT;

-- AlterTable
ALTER TABLE "PayrollStream" DROP COLUMN "amount",
DROP COLUMN "employeeProfileId",
DROP COLUMN "endDate",
DROP COLUMN "frequency",
DROP COLUMN "gridStreamId",
DROP COLUMN "orgId",
DROP COLUMN "startDate",
ADD COLUMN     "amountMonthly" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "cadence" TEXT NOT NULL,
ADD COLUMN     "employeeId" TEXT NOT NULL,
ADD COLUMN     "nextRunAt" TIMESTAMP(3),
ADD COLUMN     "teamId" TEXT,
DROP COLUMN "currency",
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USDC',
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active';

-- AlterTable
ALTER TABLE "StreamRun" DROP COLUMN "amount",
DROP COLUMN "executedAt",
DROP COLUMN "payrollStreamId",
DROP COLUMN "scheduledFor",
DROP COLUMN "transactionId",
ADD COLUMN     "runAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "streamId" TEXT NOT NULL,
ADD COLUMN     "transferId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "defaultCadence" TEXT,
ADD COLUMN     "defaultInvestmentPercent" DOUBLE PRECISION,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active';

-- AlterTable
ALTER TABLE "TeamMember" DROP COLUMN "userId",
ADD COLUMN     "employeeId" TEXT NOT NULL,
DROP COLUMN "role",
ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'member';

-- AlterTable
ALTER TABLE "User" DROP COLUMN "publicKey",
DROP COLUMN "username",
DROP COLUMN "role",
ADD COLUMN     "role" TEXT NOT NULL,
DROP COLUMN "kycStatus",
ADD COLUMN     "kycStatus" TEXT,
ALTER COLUMN "orgId" SET NOT NULL;

-- DropEnum
DROP TYPE "public"."ComplianceStatus";

-- DropEnum
DROP TYPE "public"."Currency";

-- DropEnum
DROP TYPE "public"."InvestmentStrategy";

-- DropEnum
DROP TYPE "public"."LedgerCategory";

-- DropEnum
DROP TYPE "public"."LedgerEntryType";

-- DropEnum
DROP TYPE "public"."RunStatus";

-- DropEnum
DROP TYPE "public"."StreamFrequency";

-- DropEnum
DROP TYPE "public"."StreamStatus";

-- DropEnum
DROP TYPE "public"."TeamRole";

-- DropEnum
DROP TYPE "public"."UserRole";

-- CreateTable
CREATE TABLE "InvestmentStrategy" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "strategyId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "asset" TEXT NOT NULL DEFAULT 'USDC',
    "apy" DOUBLE PRECISION,
    "riskLabel" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "allowlisted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvestmentStrategy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeePosition" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "strategyId" TEXT NOT NULL,
    "receiptTokenMint" TEXT,
    "positionId" TEXT,
    "shares" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastNav" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeePosition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderLedger" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "strategyId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "txSig" TEXT,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderLedger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InvestmentStrategy_strategyId_key" ON "InvestmentStrategy"("strategyId");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeePosition_employeeId_provider_strategyId_key" ON "EmployeePosition"("employeeId", "provider", "strategyId");

-- CreateIndex
CREATE UNIQUE INDEX "InvestmentPreference_employeeId_key" ON "InvestmentPreference"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_teamId_employeeId_key" ON "TeamMember"("teamId", "employeeId");

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "EmployeeProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollStream" ADD CONSTRAINT "PayrollStream_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "EmployeeProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollStream" ADD CONSTRAINT "PayrollStream_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StreamRun" ADD CONSTRAINT "StreamRun_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES "PayrollStream"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestmentPreference" ADD CONSTRAINT "InvestmentPreference_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "EmployeeProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeePosition" ADD CONSTRAINT "EmployeePosition_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "EmployeeProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerTransaction" ADD CONSTRAINT "LedgerTransaction_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerTransaction" ADD CONSTRAINT "LedgerTransaction_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "EmployeeProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
