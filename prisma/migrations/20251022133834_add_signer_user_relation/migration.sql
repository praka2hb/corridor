-- AddForeignKey
ALTER TABLE "AccountUpdateSigner" ADD CONSTRAINT "AccountUpdateSigner_signerUserId_fkey" FOREIGN KEY ("signerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
