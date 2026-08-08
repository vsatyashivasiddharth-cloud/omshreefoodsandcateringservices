-- CreateTable
CREATE TABLE "ShippingQuoteAttempt" (
    "id" TEXT NOT NULL,
    "ipHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShippingQuoteAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ShippingQuoteAttempt_ipHash_createdAt_idx" ON "ShippingQuoteAttempt"("ipHash", "createdAt");

-- CreateIndex
CREATE INDEX "ShippingQuoteAttempt_createdAt_idx" ON "ShippingQuoteAttempt"("createdAt");
