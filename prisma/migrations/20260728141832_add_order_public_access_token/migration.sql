ALTER TABLE "Order"
ADD COLUMN "publicAccessToken" TEXT;

UPDATE "Order"
SET "publicAccessToken" = gen_random_uuid()::text
WHERE "publicAccessToken" IS NULL;

ALTER TABLE "Order"
ALTER COLUMN "publicAccessToken" SET NOT NULL;

CREATE UNIQUE INDEX "Order_publicAccessToken_key"
ON "Order"("publicAccessToken");