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

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

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
      headers: {
        "Cache-Control":
          "private, no-store, max-age=0",
      },
    },
  );
}

export async function GET(
  _request: NextRequest,
  {
    params,
  }: RouteContext,
) {
  try {
    const {
      id,
    } = await params;

    const productId =
      id.trim();

    if (!productId) {
      return errorResponse(
        "Product ID is required.",
        400,
      );
    }

    const product =
      await prisma.product.findUnique({
        where: {
          id: productId,
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
      });

    if (!product) {
      return errorResponse(
        "Product not found.",
        404,
      );
    }

    return NextResponse.json(
      normalizeProductWithVariants(
        product,
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
      "GET Product Error:",
      error,
    );

    return errorResponse(
      "Failed to fetch product.",
      500,
    );
  }
}

export async function PUT(
  request: NextRequest,
  {
    params,
  }: RouteContext,
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

    const {
      id,
    } = await params;

    const productId =
      id.trim();

    if (!productId) {
      return errorResponse(
        "Product ID is required.",
        400,
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
      existingProduct,
      conflictingSlug,
      category,
    ] = await Promise.all([
      prisma.product.findUnique({
        where: {
          id: productId,
        },

        /*
         * Hidden products must still
         * remain editable by Admin.
         *
         * Keep variants because the
         * update logic below validates
         * variant ownership.
         */
        select: {
          id: true,

          variants: {
            select: {
              id: true,
            },
          },
        },
      }),

      prisma.product.findFirst({
        where: {
          slug,

          NOT: {
            id: productId,
          },
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

    if (!existingProduct) {
      return errorResponse(
        "Product not found.",
        404,
      );
    }

    if (conflictingSlug) {
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

    const existingVariantIds =
      new Set(
        existingProduct.variants.map(
          (variant) =>
            variant.id,
        ),
      );

    for (
      const variant of
        variantResult.variants
    ) {
      if (
        variant.id &&
        !existingVariantIds.has(
          variant.id,
        )
      ) {
        return errorResponse(
          "One or more variants do not belong to this product.",
          400,
        );
      }
    }

    const submittedVariantIds =
      new Set(
        variantResult.variants
          .map(
            (variant) =>
              variant.id,
          )
          .filter(
            (
              id,
            ): id is string =>
              Boolean(id),
          ),
      );

    const variantIdsToDelete =
      existingProduct.variants
        .map(
          (variant) =>
            variant.id,
        )
        .filter(
          (id) =>
            !submittedVariantIds.has(
              id,
            ),
        );

    const {
      defaultVariant,
      variants,
    } = variantResult;

    const updatedProduct =
      await prisma.$transaction(
        async (transaction) => {
          /*
           * Clear the existing default first.
           * This avoids conflict with the partial
           * PostgreSQL unique index while the
           * selected default is being changed.
           */
          await transaction.productVariant.updateMany({
            where: {
              productId,
              isDefault: true,
            },

            data: {
              isDefault: false,
            },
          });

          for (
            const variant of variants
          ) {
            if (variant.id) {
              await transaction.productVariant.update({
                where: {
                  id: variant.id,
                },

                data: {
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

                  /*
                   * Set default after all other
                   * fields are updated.
                   */
                  isDefault:
                    false,

                  sortOrder:
                    variant.sortOrder,
                },
              });
            } else {
              await transaction.productVariant.create({
                data: {
                  productId,

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
                    false,

                  sortOrder:
                    variant.sortOrder,
                },
              });
            }
          }

          if (
            variantIdsToDelete.length >
            0
          ) {
            await transaction.productVariant.deleteMany({
              where: {
                productId,

                id: {
                  in:
                    variantIdsToDelete,
                },
              },
            });
          }

          let resolvedDefaultId =
            defaultVariant.id;

          if (
            !resolvedDefaultId
          ) {
            const newlyCreatedDefault =
              await transaction.productVariant.findFirst({
                where: {
                  productId,

                  label:
                    defaultVariant.label,

                  weightGrams:
                    defaultVariant
                      .weightGrams,

                  isActive: true,
                },

                select: {
                  id: true,
                },
              });

            resolvedDefaultId =
              newlyCreatedDefault?.id ??
              null;
          }

          if (
            !resolvedDefaultId
          ) {
            throw new Error(
              "DEFAULT_VARIANT_NOT_FOUND",
            );
          }

          await transaction.productVariant.update({
            where: {
              id:
                resolvedDefaultId,
            },

            data: {
              isDefault: true,
              isActive: true,
            },
          });

          return transaction.product.update({
            where: {
              id: productId,
            },

            data: {
              name,
              slug,
              description,
              image,
              featured,
              categoryId,

              /*
               * Compatibility mirrors for
               * existing storefront, order and
               * shipping code.
               */
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
        updatedProduct,
      ),
      {
        status: 200,
        headers: {
          "Cache-Control":
            "private, no-store, max-age=0",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    );
  } catch (error) {
    console.error(
      "Update Product Error:",
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
          "The selected category or variant relationship is invalid.",
          400,
        );
      }

      if (
        error.code ===
        "P2025"
      ) {
        return errorResponse(
          "Product or variant not found.",
          404,
        );
      }
    }

    if (
      error instanceof Error &&
      error.message ===
        "DEFAULT_VARIANT_NOT_FOUND"
    ) {
      return errorResponse(
        "The selected default variant could not be saved.",
        400,
      );
    }

    return errorResponse(
      "Failed to update product.",
      500,
    );
  }
}

export async function PATCH(
  request: NextRequest,
  {
    params,
  }: RouteContext,
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

    const {
      id,
    } = await params;

    const productId =
      id.trim();

    if (!productId) {
      return errorResponse(
        "Product ID is required.",
        400,
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

    if (
      typeof body.isActive !==
      "boolean"
    ) {
      return errorResponse(
        "isActive must be a boolean.",
        400,
      );
    }

    /*
     * Do NOT filter by isActive.
     *
     * PATCH must be able to locate a
     * hidden product so Admin can Show
     * it again.
     */
    const existingProduct =
      await prisma.product.findUnique({
        where: {
          id: productId,
        },

        select: {
          id: true,
          name: true,
        },
      });

    if (!existingProduct) {
      return errorResponse(
        "Product not found.",
        404,
      );
    }

    const product =
      await prisma.product.update({
        where: {
          id: productId,
        },

        data: {
          isActive:
            body.isActive,
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
      });

    return NextResponse.json(
      {
        ...normalizeProductWithVariants(
          product,
        ),

        message:
          product.isActive
            ? `"${product.name}" is now visible to customers.`
            : `"${product.name}" is now hidden from customers.`,
      },
      {
        status: 200,
        headers: {
          "Cache-Control":
            "private, no-store, max-age=0",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    );
  } catch (error) {
    console.error(
      "Update Product Visibility Error:",
      error,
    );

    if (
      error instanceof SyntaxError
    ) {
      return errorResponse(
        "Invalid request body.",
        400,
      );
    }

    if (
      error instanceof
        Prisma
          .PrismaClientKnownRequestError
    ) {
      if (
        error.code === "P2025"
      ) {
        return errorResponse(
          "Product not found.",
          404,
        );
      }
    }

    return errorResponse(
      "Failed to update product visibility.",
      500,
    );
  }
}

export async function DELETE(
  request: NextRequest,
  {
    params,
  }: RouteContext,
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

    const {
      id,
    } = await params;

    const productId =
      id.trim();

    if (!productId) {
      return errorResponse(
        "Product ID is required.",
        400,
      );
    }

    const product =
      await prisma.product.findUnique({
        where: {
          id: productId,
        },

        select: {
          id: true,

          _count: {
            select: {
              orderItems: true,
            },
          },
        },
      });

    if (!product) {
      return errorResponse(
        "Product not found.",
        404,
      );
    }

    /*
     * Products referenced by historical
     * orders must never be hard-deleted.
     *
     * isActive=false removes the product
     * from the customer storefront while
     * preserving historical order data.
     */
    if (
      product._count.orderItems >
      0
    ) {
      return errorResponse(
        "This product is referenced by existing orders and cannot be permanently deleted. Hide the product instead.",
        409,
      );
    }

    await prisma.product.delete({
      where: {
        id: productId,
      },
    });

    return NextResponse.json(
      {
        message:
          "Product deleted successfully.",
      },
      {
        status: 200,
        headers: {
          "Cache-Control":
            "private, no-store, max-age=0",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    );
  } catch (error) {
    console.error(
      "Delete Product Error:",
      error,
    );

    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError
    ) {
      if (
        error.code ===
        "P2025"
      ) {
        return errorResponse(
          "Product not found.",
          404,
        );
      }

      if (
        error.code ===
        "P2003"
      ) {
        return errorResponse(
          "This product is referenced by existing records and cannot be deleted.",
          409,
        );
      }
    }

    return errorResponse(
      "Failed to delete product.",
      500,
    );
  }
}
