-- AlterTable
ALTER TABLE "Organization" ALTER COLUMN "kybStatus" SET DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "kycStatus" SET DEFAULT 'PENDING';
