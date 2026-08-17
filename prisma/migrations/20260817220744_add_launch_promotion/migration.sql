-- AlterTable
ALTER TABLE "Order"
ADD COLUMN "couponCode" TEXT,
ADD COLUMN "productDiscountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "PromotionRedemption" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "phoneNormalized" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "reservedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "redeemedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromotionRedemption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PromotionRedemption_orderId_key"
ON "PromotionRedemption"("orderId");

-- CreateIndex
CREATE INDEX "PromotionRedemption_code_expiresAt_idx"
ON "PromotionRedemption"("code", "expiresAt");

-- CreateIndex
CREATE INDEX "PromotionRedemption_code_redeemedAt_idx"
ON "PromotionRedemption"("code", "redeemedAt");

-- CreateIndex
CREATE INDEX "PromotionRedemption_redeemedAt_idx"
ON "PromotionRedemption"("redeemedAt");

-- CreateIndex
CREATE INDEX "PromotionRedemption_createdAt_idx"
ON "PromotionRedemption"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PromotionRedemption_code_phoneNormalized_key"
ON "PromotionRedemption"("code", "phoneNormalized");

-- AddForeignKey
ALTER TABLE "PromotionRedemption"
ADD CONSTRAINT "PromotionRedemption_orderId_fkey"
FOREIGN KEY ("orderId")
REFERENCES "Order"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;