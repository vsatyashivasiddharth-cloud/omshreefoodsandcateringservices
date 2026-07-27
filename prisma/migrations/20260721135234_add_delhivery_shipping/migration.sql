/*
  Warnings:

  - A unique constraint covering the columns `[delhiveryWaybill]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ShippingProvider" AS ENUM ('DELHIVERY', 'MANUAL');

-- CreateEnum
CREATE TYPE "ShippingMode" AS ENUM ('SURFACE', 'EXPRESS');

-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('NOT_CREATED', 'QUOTED', 'CREATED', 'PICKUP_SCHEDULED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'RTO', 'CANCELLED', 'FAILED');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "delhiveryOrderId" TEXT,
ADD COLUMN     "delhiveryShipmentId" TEXT,
ADD COLUMN     "delhiveryStatus" TEXT,
ADD COLUMN     "delhiveryWaybill" TEXT,
ADD COLUMN     "deliveredAt" TIMESTAMP(3),
ADD COLUMN     "estimatedDeliveryAt" TIMESTAMP(3),
ADD COLUMN     "packageBreadthCm" DECIMAL(8,2),
ADD COLUMN     "packageHeightCm" DECIMAL(8,2),
ADD COLUMN     "packageId" TEXT,
ADD COLUMN     "packageLengthCm" DECIMAL(8,2),
ADD COLUMN     "packageWeightGrams" INTEGER,
ADD COLUMN     "pickupScheduledAt" TIMESTAMP(3),
ADD COLUMN     "shipmentStatus" "ShipmentStatus" NOT NULL DEFAULT 'NOT_CREATED',
ADD COLUMN     "shippedAt" TIMESTAMP(3),
ADD COLUMN     "shippingChargedAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "shippingDiscountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "shippingEstimatedAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "shippingMode" "ShippingMode",
ADD COLUMN     "shippingProvider" "ShippingProvider" NOT NULL DEFAULT 'DELHIVERY',
ADD COLUMN     "shippingQuotedAt" TIMESTAMP(3),
ADD COLUMN     "subtotalAmount" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "shippingWeightGrams" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ShippingPackage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "lengthCm" DECIMAL(8,2) NOT NULL,
    "breadthCm" DECIMAL(8,2) NOT NULL,
    "heightCm" DECIMAL(8,2) NOT NULL,
    "emptyWeightGrams" INTEGER NOT NULL DEFAULT 0,
    "maxWeightGrams" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShippingPackage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShippingPackage_code_key" ON "ShippingPackage"("code");

-- CreateIndex
CREATE INDEX "ShippingPackage_active_idx" ON "ShippingPackage"("active");

-- CreateIndex
CREATE INDEX "ShippingPackage_maxWeightGrams_idx" ON "ShippingPackage"("maxWeightGrams");

-- CreateIndex
CREATE INDEX "ShippingPackage_createdAt_idx" ON "ShippingPackage"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Order_delhiveryWaybill_key" ON "Order"("delhiveryWaybill");

-- CreateIndex
CREATE INDEX "Order_packageId_idx" ON "Order"("packageId");

-- CreateIndex
CREATE INDEX "Order_pincode_idx" ON "Order"("pincode");

-- CreateIndex
CREATE INDEX "Order_shippingProvider_idx" ON "Order"("shippingProvider");

-- CreateIndex
CREATE INDEX "Order_shippingMode_idx" ON "Order"("shippingMode");

-- CreateIndex
CREATE INDEX "Order_shipmentStatus_idx" ON "Order"("shipmentStatus");

-- CreateIndex
CREATE INDEX "Order_shipmentStatus_createdAt_idx" ON "Order"("shipmentStatus", "createdAt");

-- CreateIndex
CREATE INDEX "Order_delhiveryShipmentId_idx" ON "Order"("delhiveryShipmentId");

-- CreateIndex
CREATE INDEX "Order_delhiveryOrderId_idx" ON "Order"("delhiveryOrderId");

-- CreateIndex
CREATE INDEX "Product_shippingWeightGrams_idx" ON "Product"("shippingWeightGrams");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "ShippingPackage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
