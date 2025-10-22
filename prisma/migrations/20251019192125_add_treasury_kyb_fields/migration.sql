/*
  Warnings:

  - Made the column `kybStatus` on table `Organization` required. This step will fail if there are existing NULL values in that column.

*/

-- First, update existing NULL values to 'incomplete'
UPDATE "Organization" SET "kybStatus" = 'incomplete' WHERE "kybStatus" IS NULL;

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "bankAccountNumber" TEXT,
ADD COLUMN     "bankBeneficiaryName" TEXT,
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "bankRoutingNumber" TEXT,
ADD COLUMN     "kybApprovedAt" TIMESTAMP(3),
ADD COLUMN     "kybCompletedAt" TIMESTAMP(3),
ADD COLUMN     "kybId" TEXT,
ADD COLUMN     "kybLink" TEXT,
ADD COLUMN     "kybRejectionReasons" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "tosLink" TEXT,
ADD COLUMN     "treasuryGridId" TEXT,
ADD COLUMN     "treasuryGridUserId" TEXT,
ADD COLUMN     "treasuryStatus" TEXT NOT NULL DEFAULT 'pending_kyb',
ADD COLUMN     "virtualAccountId" TEXT,
ALTER COLUMN "kybStatus" SET NOT NULL,
ALTER COLUMN "kybStatus" SET DEFAULT 'incomplete';
