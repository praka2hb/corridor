/*
  Warnings:

  - You are about to drop the column `bankAccountNumber` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `bankBeneficiaryName` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `bankName` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `bankRoutingNumber` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `gridOrgId` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `treasuryAccountId` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `treasuryGridId` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `treasuryGridUserId` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `treasurySignerAddress` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `treasuryStatus` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `virtualAccountId` on the `Organization` table. All the data in the column will be lost.
  - Added the required column `creatorAccountAddress` to the `Organization` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."Organization_gridOrgId_key";

-- AlterTable
ALTER TABLE "Organization" DROP COLUMN "bankAccountNumber",
DROP COLUMN "bankBeneficiaryName",
DROP COLUMN "bankName",
DROP COLUMN "bankRoutingNumber",
DROP COLUMN "gridOrgId",
DROP COLUMN "treasuryAccountId",
DROP COLUMN "treasuryGridId",
DROP COLUMN "treasuryGridUserId",
DROP COLUMN "treasurySignerAddress",
DROP COLUMN "treasuryStatus",
DROP COLUMN "virtualAccountId",
ADD COLUMN     "creatorAccountAddress" TEXT NOT NULL;
