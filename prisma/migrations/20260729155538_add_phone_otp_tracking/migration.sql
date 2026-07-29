-- CreateEnum
CREATE TYPE "OtpPurpose" AS ENUM ('ORDER_TRACKING');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "phoneNormalized" TEXT;

-- CreateTable
CREATE TABLE "PhoneOtpChallenge" (
    "id" TEXT NOT NULL,
    "phoneNormalized" TEXT NOT NULL,
    "purpose" "OtpPurpose" NOT NULL DEFAULT 'ORDER_TRACKING',
    "otpHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "verifiedAt" TIMESTAMP(3),
    "consumedAt" TIMESTAMP(3),
    "requestIpHash" TEXT,
    "userAgentHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PhoneOtpChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderTrackingSession" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "phoneNormalized" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "sourceChallengeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderTrackingSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PhoneOtpChallenge_phoneNormalized_idx" ON "PhoneOtpChallenge"("phoneNormalized");

-- CreateIndex
CREATE INDEX "PhoneOtpChallenge_phoneNormalized_purpose_createdAt_idx" ON "PhoneOtpChallenge"("phoneNormalized", "purpose", "createdAt");

-- CreateIndex
CREATE INDEX "PhoneOtpChallenge_purpose_createdAt_idx" ON "PhoneOtpChallenge"("purpose", "createdAt");

-- CreateIndex
CREATE INDEX "PhoneOtpChallenge_expiresAt_idx" ON "PhoneOtpChallenge"("expiresAt");

-- CreateIndex
CREATE INDEX "PhoneOtpChallenge_verifiedAt_idx" ON "PhoneOtpChallenge"("verifiedAt");

-- CreateIndex
CREATE INDEX "PhoneOtpChallenge_consumedAt_idx" ON "PhoneOtpChallenge"("consumedAt");

-- CreateIndex
CREATE UNIQUE INDEX "OrderTrackingSession_tokenHash_key" ON "OrderTrackingSession"("tokenHash");

-- CreateIndex
CREATE INDEX "OrderTrackingSession_phoneNormalized_idx" ON "OrderTrackingSession"("phoneNormalized");

-- CreateIndex
CREATE INDEX "OrderTrackingSession_phoneNormalized_expiresAt_idx" ON "OrderTrackingSession"("phoneNormalized", "expiresAt");

-- CreateIndex
CREATE INDEX "OrderTrackingSession_expiresAt_idx" ON "OrderTrackingSession"("expiresAt");

-- CreateIndex
CREATE INDEX "OrderTrackingSession_revokedAt_idx" ON "OrderTrackingSession"("revokedAt");

-- CreateIndex
CREATE INDEX "OrderTrackingSession_sourceChallengeId_idx" ON "OrderTrackingSession"("sourceChallengeId");

-- CreateIndex
CREATE INDEX "OrderTrackingSession_createdAt_idx" ON "OrderTrackingSession"("createdAt");

-- CreateIndex
CREATE INDEX "Order_phoneNormalized_idx" ON "Order"("phoneNormalized");

-- CreateIndex
CREATE INDEX "Order_phoneNormalized_createdAt_idx" ON "Order"("phoneNormalized", "createdAt");
