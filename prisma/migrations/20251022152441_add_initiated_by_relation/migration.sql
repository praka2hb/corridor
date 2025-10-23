-- CreateIndex
CREATE INDEX "AccountUpdateRequest_initiatedByUserId_idx" ON "AccountUpdateRequest"("initiatedByUserId");

-- AddForeignKey
ALTER TABLE "AccountUpdateRequest" ADD CONSTRAINT "AccountUpdateRequest_initiatedByUserId_fkey" FOREIGN KEY ("initiatedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
