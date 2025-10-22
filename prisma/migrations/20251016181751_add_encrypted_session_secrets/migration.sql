-- AlterTable
ALTER TABLE "User" ADD COLUMN     "encryptedSessionSecrets" TEXT,
ADD COLUMN     "sessionSecretsAuthTag" TEXT,
ADD COLUMN     "sessionSecretsIV" TEXT;
