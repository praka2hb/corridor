-- AlterTable
ALTER TABLE "AccountUpdateRequest" ADD COLUMN     "pendingUserEmail" TEXT,
ADD COLUMN     "pendingUserId" TEXT,
ADD COLUMN     "pendingUserPosition" TEXT,
ADD COLUMN     "pendingUserRole" TEXT;
