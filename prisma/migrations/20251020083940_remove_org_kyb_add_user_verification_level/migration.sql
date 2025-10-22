/*
  Warnings:

  - You are about to drop the column `kybApprovedAt` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `kybCompletedAt` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `kybId` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `kybLink` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `kybRejectionReasons` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `kybStatus` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `tosLink` on the `Organization` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Organization" DROP COLUMN "kybApprovedAt",
DROP COLUMN "kybCompletedAt",
DROP COLUMN "kybId",
DROP COLUMN "kybLink",
DROP COLUMN "kybRejectionReasons",
DROP COLUMN "kybStatus",
DROP COLUMN "tosLink",
ALTER COLUMN "treasuryStatus" SET DEFAULT 'active';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "kycVerificationLevel" TEXT;
