DROP TABLE "PromotionRedemption";

ALTER TABLE "Order"
DROP COLUMN "couponCode",
DROP COLUMN "productDiscountAmount";