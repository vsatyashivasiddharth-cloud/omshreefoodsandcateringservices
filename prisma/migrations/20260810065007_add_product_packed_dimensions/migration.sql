-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "packedBreadthCm" DECIMAL(8,2),
ADD COLUMN     "packedHeightCm" DECIMAL(8,2),
ADD COLUMN     "packedLengthCm" DECIMAL(8,2);

-- AlterTable
ALTER TABLE "ProductVariant" ADD COLUMN     "packedBreadthCm" DECIMAL(8,2),
ADD COLUMN     "packedHeightCm" DECIMAL(8,2),
ADD COLUMN     "packedLengthCm" DECIMAL(8,2);
