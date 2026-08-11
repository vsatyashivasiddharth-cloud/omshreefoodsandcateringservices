-- Alter OrderItem.productId to allow the Product reference
-- to be cleared when a Product is permanently deleted.
ALTER TABLE "OrderItem"
ALTER COLUMN "productId" DROP NOT NULL;

-- Replace the original RESTRICT foreign key with SET NULL.
ALTER TABLE "OrderItem"
DROP CONSTRAINT "OrderItem_productId_fkey";

ALTER TABLE "OrderItem"
ADD CONSTRAINT "OrderItem_productId_fkey"
FOREIGN KEY ("productId")
REFERENCES "Product"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
