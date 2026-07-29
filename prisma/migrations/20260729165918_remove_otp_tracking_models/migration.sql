/*
  Warnings:

  - You are about to drop the `OrderTrackingSession` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PhoneOtpChallenge` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "OrderTrackingSession";

-- DropTable
DROP TABLE "PhoneOtpChallenge";

-- DropEnum
DROP TYPE "OtpPurpose";
