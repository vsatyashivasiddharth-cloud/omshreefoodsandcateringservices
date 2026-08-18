CREATE TABLE "Coupon" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "discountPercent" DECIMAL(5,2) NOT NULL,
    "maxUses" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "oneUsePerPhone" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Coupon_code_key"
ON "Coupon"("code");

CREATE INDEX "Coupon_isActive_idx"
ON "Coupon"("isActive");

CREATE INDEX "Coupon_startsAt_idx"
ON "Coupon"("startsAt");

CREATE INDEX "Coupon_endsAt_idx"
ON "Coupon"("endsAt");

CREATE INDEX "Coupon_isActive_startsAt_endsAt_idx"
ON "Coupon"("isActive", "startsAt", "endsAt");

CREATE INDEX "Coupon_createdAt_idx"
ON "Coupon"("createdAt");