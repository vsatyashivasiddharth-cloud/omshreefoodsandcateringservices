import {
  NextRequest,
  NextResponse,
} from "next/server";

import prisma from "@/lib/prisma";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

function noStoreHeaders() {
  return {
    "Cache-Control":
      "private, no-store, max-age=0",
    Pragma: "no-cache",
    Expires: "0",
  };
}

function errorResponse(
  error: string,
  status: number,
) {
  return NextResponse.json(
    {
      error,
    },
    {
      status,
      headers: noStoreHeaders(),
    },
  );
}

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

export async function GET(
  _request: NextRequest,
  { params }: RouteContext,
) {
  try {
    const { id } = await params;

    const productId =
      id.trim();

    if (!productId) {
      return errorResponse(
        "Product ID is required.",
        400,
      );
    }

    const currentProduct =
      await prisma.product.findFirst({
        where: {
          id: productId,
          isActive: true,

          category: {
            isActive: true,
          },
        },

        select: {
          id: true,
          categoryId: true,
        },
      });

    if (!currentProduct) {
      return errorResponse(
        "Product not found.",
        404,
      );
    }

    const relatedProducts =
      await prisma.product.findMany({
        where: {
          categoryId:
            currentProduct.categoryId,

          id: {
            not:
              currentProduct.id,
          },
          isActive: true,

          category: {
            isActive: true,
          },
        },

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
                weightGrams:
                  "asc",
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

        orderBy: [
          {
            featured: "desc",
          },
          {
            createdAt: "desc",
          },
        ],

        take: 4,
      });

    return NextResponse.json(
      relatedProducts.map(
        (product) => ({
          ...product,

          price:
            normalizePrice(
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
            product
              .createdAt
              .toISOString(),

          updatedAt:
            product
              .updatedAt
              .toISOString(),
        }),
      ),
      {
        status: 200,
        headers:
          noStoreHeaders(),
      },
    );
  } catch (error) {
    console.error(
      "Failed to load related products:",
      error,
    );

    return errorResponse(
      "Failed to fetch related products.",
      500,
    );
  }
}
