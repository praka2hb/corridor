-- AlterTable
ALTER TABLE "User" ADD COLUMN     "authSessionAuthTag" TEXT,
ADD COLUMN     "authSessionIV" TEXT,
ADD COLUMN     "encryptedAuthSession" TEXT;
