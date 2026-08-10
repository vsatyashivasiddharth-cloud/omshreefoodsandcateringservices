-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "Product_isActive_idx" ON "Product"("isActive");

-- CreateIndex
CREATE INDEX "Product_isActive_createdAt_idx" ON "Product"("isActive", "createdAt");

-- CreateIndex
CREATE INDEX "Product_isActive_categoryId_createdAt_idx" ON "Product"("isActive", "categoryId", "createdAt");

-- CreateIndex
CREATE INDEX "Product_isActive_featured_createdAt_idx" ON "Product"("isActive", "featured", "createdAt");
