-- AlterTable
ALTER TABLE "User" ADD COLUMN     "kycLink" TEXT,
ADD COLUMN     "kycLinkExpiresAt" TIMESTAMP(3);
