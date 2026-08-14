-- Create print-job enums.
CREATE TYPE "PrintJobType" AS ENUM (
  'ECOMMERCE_LABEL'
);

CREATE TYPE "PrintJobStatus" AS ENUM (
  'PENDING',
  'PRINTING',
  'PRINTED',
  'FAILED'
);

-- Record when staff first acknowledges a paid order.
ALTER TABLE "Order"
ADD COLUMN "staffSeenAt" TIMESTAMP(3);

-- Persistent print queue for ecommerce labels.
CREATE TABLE "PrintJob" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "type" "PrintJobType" NOT NULL,
  "status" "PrintJobStatus" NOT NULL DEFAULT 'PENDING',
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "claimedAt" TIMESTAMP(3),
  "printedAt" TIMESTAMP(3),
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PrintJob_pkey"
  PRIMARY KEY ("id")
);

-- Staff Orders unread/seen lookup.
CREATE INDEX "Order_staffSeenAt_idx"
ON "Order"("staffSeenAt");

-- One automatic ecommerce-label job per order.
CREATE UNIQUE INDEX "PrintJob_orderId_type_key"
ON "PrintJob"("orderId", "type");

-- Print queue lookup indexes.
CREATE INDEX "PrintJob_orderId_createdAt_idx"
ON "PrintJob"("orderId", "createdAt");

CREATE INDEX "PrintJob_status_createdAt_idx"
ON "PrintJob"("status", "createdAt");

CREATE INDEX "PrintJob_createdAt_idx"
ON "PrintJob"("createdAt");

-- Remove print jobs automatically if their order is permanently removed.
ALTER TABLE "PrintJob"
ADD CONSTRAINT "PrintJob_orderId_fkey"
FOREIGN KEY ("orderId")
REFERENCES "Order"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;