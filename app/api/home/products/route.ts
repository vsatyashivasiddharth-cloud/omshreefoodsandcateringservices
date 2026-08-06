import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";

function normalizeNonNegativeInteger(
  value: unknown,
) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.max(
    0,
    Math.floor(number),
  );
}

function normalizePrice(
  value: unknown,
) {
  const number = Number(value);

  if (
    !Number.isFinite(number) ||
    number < 0
  ) {
    return 0;
  }

  return number;
}

export async function GET() {
  try {
    const products =
      await prisma.product.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          price: true,
          image: true,
          stock: true,
          featured: true,
          shippingWeightGrams:
            true,
          categoryId: true,
          createdAt: true,
          updatedAt: true,

          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              image: true,
            },
          },

          variants: {
            where: {
              isActive: true,
            },

            orderBy: [
              {
                sortOrder: "asc",
              },
              {
                weightGrams: "asc",
              },
            ],

            select: {
              id: true,
              label: true,
              weightGrams: true,
              shippingWeightGrams:
                true,
              price: true,
              stock: true,
              sku: true,
              isActive: true,
              isDefault: true,
              sortOrder: true,
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },
      });

    return NextResponse.json(
      products.map(
        (product) => ({
          ...product,

          price: normalizePrice(
            product.price,
          ),

          stock:
            normalizeNonNegativeInteger(
              product.stock,
            ),

          shippingWeightGrams:
            normalizeNonNegativeInteger(
              product
                .shippingWeightGrams,
            ),

          variants:
            product.variants.map(
              (variant) => ({
                ...variant,

                price:
                  normalizePrice(
                    variant.price,
                  ),

                stock:
                  normalizeNonNegativeInteger(
                    variant.stock,
                  ),

                weightGrams:
                  normalizeNonNegativeInteger(
                    variant
                      .weightGrams,
                  ),

                shippingWeightGrams:
                  normalizeNonNegativeInteger(
                    variant
                      .shippingWeightGrams,
                  ),
              }),
            ),

          createdAt:
            product.createdAt.toISOString(),

          updatedAt:
            product.updatedAt.toISOString(),
        }),
      ),
      {
        status: 200,

        headers: {
          "Cache-Control":
            "no-store",
        },
      },
    );
  } catch (error) {
    console.error(
      "Failed to load home products:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Failed to fetch products.",
      },
      {
        status: 500,
      },
    );
  }
}