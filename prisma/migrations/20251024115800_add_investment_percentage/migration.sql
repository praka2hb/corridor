/*
  Warnings:

  - You are about to drop the column `gridStandingOrderId` on the `PayrollStream` table. All the data in the column will be lost.
  - You are about to drop the column `gridTransferId` on the `StreamRun` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PayrollStream" DROP COLUMN "gridStandingOrderId";

-- AlterTable
ALTER TABLE "StreamRun" DROP COLUMN "gridTransferId";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "investmentPercentage" INTEGER DEFAULT 0;
