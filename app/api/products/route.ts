import {
  NextRequest,
  NextResponse,
} from "next/server";
import {
  Prisma,
} from "@prisma/client";

import {
  requireAdmin,
} from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  normalizeProductWithVariants,
  parseProductVariants,
} from "@/lib/product-variant-input";

function createSlug(
  value: string,
) {
  return value
    .toLowerCase()
    .trim()
    .replace(
      /[^a-z0-9]+/g,
      "-",
    )
    .replace(
      /^-+|-+$/g,
      "",
    );
}

function isRecord(
  value: unknown,
): value is Record<
  string,
  unknown
> {
  return (
    value !== null &&
    typeof value ===
      "object" &&
    !Array.isArray(value)
  );
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
      headers:
        noStoreHeaders(),
    },
  );
}

export async function GET() {
  try {
    const products =
      await prisma.product.findMany({
        where: {
          isActive: true,
        },

        include: {
          category: true,

          variants: {
            orderBy: [
              {
                sortOrder: "asc",
              },
              {
                weightGrams:
                  "asc",
              },
            ],
          },
        },

        orderBy: {
          createdAt: "desc",
        },
      });

    return NextResponse.json(
      products.map(
        normalizeProductWithVariants,
      ),
      {
        status: 200,
        headers:
          noStoreHeaders(),
      },
    );
  } catch (error) {
    console.error(
      "GET Products Error:",
      error,
    );

    return errorResponse(
      "Failed to fetch products.",
      500,
    );
  }
}

export async function POST(
  request: NextRequest,
) {
  try {
    const authentication =
      await requireAdmin(
        request,
      );

    if (
      !authentication.authenticated
    ) {
      return errorResponse(
        authentication.error,
        authentication.status,
      );
    }

    const body: unknown =
      await request.json();

    if (!isRecord(body)) {
      return errorResponse(
        "Invalid request body.",
        400,
      );
    }

    const name =
      typeof body.name ===
      "string"
        ? body.name.trim()
        : "";

    const rawSlug =
      typeof body.slug ===
      "string"
        ? body.slug
        : "";

    const slug =
      createSlug(rawSlug);

    const description =
      typeof body.description ===
      "string"
        ? body.description.trim()
        : "";

    const categoryId =
      typeof body.categoryId ===
      "string"
        ? body.categoryId.trim()
        : "";

    const image =
      typeof body.image ===
      "string"
        ? body.image.trim()
        : "";

    const featured =
      typeof body.featured ===
      "boolean"
        ? body.featured
        : false;

    if (
      name.length < 1 ||
      name.length > 150
    ) {
      return errorResponse(
        "Product name must be between 1 and 150 characters.",
        400,
      );
    }

    if (
      !slug ||
      slug.length > 180
    ) {
      return errorResponse(
        "Enter a valid product slug.",
        400,
      );
    }

    if (
      description.length < 1 ||
      description.length >
        10_000
    ) {
      return errorResponse(
        "Product description must be between 1 and 10000 characters.",
        400,
      );
    }

    if (!categoryId) {
      return errorResponse(
        "Select a product category.",
        400,
      );
    }

    if (image.length > 2_000) {
      return errorResponse(
        "The product image URL is too long.",
        400,
      );
    }

    const variantResult =
      parseProductVariants(
        body.variants,
      );

    if (
      !variantResult.success
    ) {
      return errorResponse(
        variantResult.error,
        400,
      );
    }

    const [
      conflictingProduct,
      category,
    ] = await Promise.all([
      prisma.product.findUnique({
        where: {
          slug,
        },
        select: {
          id: true,
        },
      }),

      prisma.category.findUnique({
        where: {
          id: categoryId,
        },
        select: {
          id: true,
        },
      }),
    ]);

    if (conflictingProduct) {
      return errorResponse(
        "A product with this slug already exists.",
        409,
      );
    }

    if (!category) {
      return errorResponse(
        "The selected category does not exist.",
        400,
      );
    }

    const {
      variants,
      defaultVariant,
    } = variantResult;

    const product =
      await prisma.$transaction(
        async (transaction) => {
          const createdProduct =
            await transaction.product.create({
              data: {
                name,
                slug,
                description,
                image,
                featured,
                isActive: true,
                categoryId,

                price:
                  defaultVariant.price,

                stock:
                  defaultVariant.stock,

                shippingWeightGrams:
                  defaultVariant
                    .shippingWeightGrams,

                packedLengthCm:
                  defaultVariant
                    .packedLengthCm,

                packedBreadthCm:
                  defaultVariant
                    .packedBreadthCm,

                packedHeightCm:
                  defaultVariant
                    .packedHeightCm,

                variants: {
                  create:
                    variants.map(
                      (
                        variant,
                      ) => ({
                        label:
                          variant.label,

                        weightGrams:
                          variant
                            .weightGrams,

                        shippingWeightGrams:
                          variant
                            .shippingWeightGrams,

                        packedLengthCm:
                          variant
                            .packedLengthCm,

                        packedBreadthCm:
                          variant
                            .packedBreadthCm,

                        packedHeightCm:
                          variant
                            .packedHeightCm,

                        price:
                          variant.price,

                        stock:
                          variant.stock,

                        sku:
                          variant.sku,

                        isActive:
                          variant.isActive,

                        isDefault:
                          variant.isDefault,

                        sortOrder:
                          variant.sortOrder,
                      }),
                    ),
                },
              },

              include: {
                category: true,

                variants: {
                  orderBy: [
                    {
                      sortOrder:
                        "asc",
                    },
                    {
                      weightGrams:
                        "asc",
                    },
                  ],
                },
              },
            });

          return createdProduct;
        },
        {
          isolationLevel:
            Prisma
              .TransactionIsolationLevel
              .Serializable,
        },
      );

    return NextResponse.json(
      normalizeProductWithVariants(
        product,
      ),
      {
        status: 201,
        headers:
          noStoreHeaders(),
      },
    );
  } catch (error) {
    console.error(
      "Create Product Error:",
      error,
    );

    if (
      error instanceof
        SyntaxError
    ) {
      return errorResponse(
        "Invalid request body.",
        400,
      );
    }

    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError
    ) {
      if (
        error.code ===
        "P2002"
      ) {
        return errorResponse(
          "The product slug, variant weight, or SKU is already in use.",
          409,
        );
      }

      if (
        error.code ===
        "P2003"
      ) {
        return errorResponse(
          "The selected category does not exist.",
          400,
        );
      }
    }

    return errorResponse(
      "Failed to create product.",
      500,
    );
  }
}