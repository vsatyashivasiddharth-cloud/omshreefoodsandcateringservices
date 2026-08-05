import "dotenv/config";

import prisma from "../lib/prisma";

async function main() {
  const products =
    await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        stock: true,
        shippingWeightGrams: true,

        variants: {
          select: {
            id: true,
          },
        },
      },

      orderBy: {
        name: "asc",
      },
    });

  const rows = products.map(
    (product) => {
      const existingVariantCount =
        product.variants.length;

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,

        currentPrice:
          Number(product.price),

        currentStock:
          product.stock,

        currentPackedShippingWeightGrams:
          product.shippingWeightGrams,

        existingVariantCount,

        verifiedNetWeightGrams:
          "",

        verifiedLabel:
          "",

        action:
          existingVariantCount > 0
            ? "SKIP_ALREADY_HAS_VARIANTS"
            : product
                  .shippingWeightGrams <
                1
              ? "REVIEW_INVALID_SHIPPING_WEIGHT"
              : "REVIEW_NET_WEIGHT_BEFORE_BACKFILL",
      };
    },
  );

  console.table(rows);

  console.log(
    JSON.stringify(
      rows,
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(
      "Variant backfill report failed:",
      error,
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });