-- CreateTable
CREATE TABLE "AccountUpdateRequest" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "initiatedByUserId" TEXT NOT NULL,
    "accountAddress" TEXT NOT NULL,
    "requestedSignersJson" TEXT NOT NULL,
    "threshold" INTEGER,
    "gridTransaction" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountUpdateRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountUpdateSigner" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "signerUserId" TEXT NOT NULL,
    "signerAddress" TEXT NOT NULL,
    "hasSigned" BOOLEAN NOT NULL DEFAULT false,
    "signedAt" TIMESTAMP(3),
    "signaturePayloadJson" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountUpdateSigner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "metadataJson" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AccountUpdateRequest_orgId_idx" ON "AccountUpdateRequest"("orgId");

-- CreateIndex
CREATE INDEX "AccountUpdateRequest_accountAddress_idx" ON "AccountUpdateRequest"("accountAddress");

-- CreateIndex
CREATE INDEX "AccountUpdateRequest_status_idx" ON "AccountUpdateRequest"("status");

-- CreateIndex
CREATE INDEX "AccountUpdateSigner_requestId_idx" ON "AccountUpdateSigner"("requestId");

-- CreateIndex
CREATE INDEX "AccountUpdateSigner_signerUserId_idx" ON "AccountUpdateSigner"("signerUserId");

-- CreateIndex
CREATE UNIQUE INDEX "AccountUpdateSigner_requestId_signerUserId_key" ON "AccountUpdateSigner"("requestId", "signerUserId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- AddForeignKey
ALTER TABLE "AccountUpdateSigner" ADD CONSTRAINT "AccountUpdateSigner_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "AccountUpdateRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
