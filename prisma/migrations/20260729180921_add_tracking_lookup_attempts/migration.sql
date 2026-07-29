-- CreateTable
CREATE TABLE "TrackingLookupAttempt" (
    "id" TEXT NOT NULL,
    "phoneHash" TEXT NOT NULL,
    "ipHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrackingLookupAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrackingLookupAttempt_phoneHash_createdAt_idx" ON "TrackingLookupAttempt"("phoneHash", "createdAt");

-- CreateIndex
CREATE INDEX "TrackingLookupAttempt_ipHash_createdAt_idx" ON "TrackingLookupAttempt"("ipHash", "createdAt");

-- CreateIndex
CREATE INDEX "TrackingLookupAttempt_createdAt_idx" ON "TrackingLookupAttempt"("createdAt");
