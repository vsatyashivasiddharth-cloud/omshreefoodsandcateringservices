import {
  NextRequest,
  NextResponse,
} from "next/server";
import {
  CouponRedemptionStatus,
  Prisma,
} from "@prisma/client";

import {
  normalizeIndianPhone,
} from "@/lib/phone";
import prisma from "@/lib/prisma";

interface CouponValidationBody {
  couponCode?: unknown;
  phone?: unknown;
  items?: unknown;
}

interface CouponValidationItem {
  productId: string;
  variantId: string | null;
  quantity: number;
}

const MAX_ORDER_ITEMS = 100;
const MAX_QUANTITY_PER_ITEM = 100;

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function getTrimmedString(
  value: unknown,
) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function noStoreHeaders() {
  return {
    "Cache-Control":
      "private, no-store, max-age=0",
  };
}

function errorResponse(
  error: string,
  status: number,
  additionalData?: Record<
    string,
    unknown
  >,
) {
  return NextResponse.json(
    {
      error,
      ...additionalData,
    },
    {
      status,
      headers: noStoreHeaders(),
    },
  );
}

function parseNullableVariantId(
  value: unknown,
) {
  if (
    value === undefined ||
    value === null
  ) {
    return null;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const variantId =
    value.trim();

  return variantId || null;
}

function createLineKey(
  productId: string,
  variantId: string | null,
) {
  return `${productId}:${
    variantId ?? "legacy"
  }`;
}

function parseItems(
  value: unknown,
): CouponValidationItem[] | null {
  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    value.length > MAX_ORDER_ITEMS
  ) {
    return null;
  }

  const itemByKey =
    new Map<
      string,
      CouponValidationItem
    >();

  for (const rawItem of value) {
    if (!isRecord(rawItem)) {
      return null;
    }

    const productId =
      getTrimmedString(
        rawItem.productId,
      );

    const variantId =
      parseNullableVariantId(
        rawItem.variantId,
      );

    const quantity =
      Number(
        rawItem.quantity,
      );

    if (
      !productId ||
      variantId === undefined ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity >
        MAX_QUANTITY_PER_ITEM
    ) {
      return null;
    }

    const key =
      createLineKey(
        productId,
        variantId,
      );

    const existingQuantity =
      itemByKey.get(key)
        ?.quantity ?? 0;

    const combinedQuantity =
      existingQuantity +
      quantity;

    if (
      combinedQuantity >
      MAX_QUANTITY_PER_ITEM
    ) {
      return null;
    }

    itemByKey.set(key, {
      productId,
      variantId,
      quantity:
        combinedQuantity,
    });
  }

  return Array.from(
    itemByKey.values(),
  );
}

function normalizeNonNegativeInteger(
  value: unknown,
) {
  const number =
    Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.max(
    0,
    Math.floor(number),
  );
}

function normalizeMoney(
  value: unknown,
) {
  const number =
    Number(value);

  if (
    !Number.isFinite(number) ||
    number < 0
  ) {
    return null;
  }

  return number;
}

function decimalMoney(
  value:
    | number
    | Prisma.Decimal,
) {
  return new Prisma.Decimal(
    Number(value).toFixed(2),
  );
}

function roundMoney(
  value: number,
) {
  return (
    Math.round(value * 100) /
    100
  );
}

export async function POST(
  request: NextRequest,
) {
  try {
    const rawBody: unknown =
      await request.json();

    if (!isRecord(rawBody)) {
      return errorResponse(
        "Invalid request body.",
        400,
      );
    }

    const body =
      rawBody as CouponValidationBody;

    /*
     * Trim accidental outer whitespace
     * only.
     *
     * Coupon codes remain exact and
     * case-sensitive.
     */
    const couponCode =
      getTrimmedString(
        body.couponCode,
      );

    const phone =
      getTrimmedString(
        body.phone,
      );

    const items =
      parseItems(
        body.items,
      );

    if (!couponCode) {
      return errorResponse(
        "Enter a valid coupon code.",
        400,
      );
    }

    const phoneNormalized =
      normalizeIndianPhone(
        phone,
      );

    if (!phoneNormalized) {
      return errorResponse(
        "Please enter a valid Indian mobile number.",
        400,
      );
    }

    if (!items) {
      return errorResponse(
        "Please provide valid order items.",
        400,
      );
    }

    /*
     * Coupon.code is unique and matching
     * is intentionally case-sensitive.
     */
    const coupon =
      await prisma.coupon.findUnique({
        where: {
          code: couponCode,
        },

        select: {
          id: true,
          code: true,

          discountPercent: true,
          maxUses: true,

          isActive: true,
          oneUsePerPhone: true,

          startsAt: true,
          endsAt: true,
        },
      });

    /*
     * Validation precedence:
     *
     * 1. exact code exists
     * 2. enabled
     * 3. start time reached
     * 4. end time passed
     * 5. capacity reached
     * 6. same phone already used
     */

    if (!coupon) {
      return errorResponse(
        "Enter a valid coupon code.",
        400,
      );
    }

    const now =
      new Date();

    if (!coupon.isActive) {
      return errorResponse(
        "This coupon is currently unavailable.",
        409,
      );
    }

    if (
      now.getTime() <
      coupon.startsAt.getTime()
    ) {
      return errorResponse(
        "Coupon is not active yet.",
        409,
      );
    }

    if (
      now.getTime() >
      coupon.endsAt.getTime()
    ) {
      return errorResponse(
        "Coupon expired.",
        409,
      );
    }

    /*
     * Capacity consumed:
     *
     * REDEEMED
     * +
     * RESERVED where expiresAt > now
     *
     * RELEASED and EXPIRED do not count.
     *
     * This endpoint never creates or
     * updates a redemption row.
     */
    const consumedCapacity =
      await prisma
        .couponRedemption
        .count({
          where: {
            couponId:
              coupon.id,

            OR: [
              {
                status:
                  CouponRedemptionStatus
                    .REDEEMED,
              },
              {
                status:
                  CouponRedemptionStatus
                    .RESERVED,

                expiresAt: {
                  gt: now,
                },
              },
            ],
          },
        });

    if (
      consumedCapacity >=
      coupon.maxUses
    ) {
      return errorResponse(
        "This coupon has reached its usage limit.",
        409,
      );
    }

    /*
     * oneUsePerPhone applies per coupon,
     * not across every coupon campaign.
     */
    if (
      coupon.oneUsePerPhone
    ) {
      const previousUse =
        await prisma
          .couponRedemption
          .findFirst({
            where: {
              couponId:
                coupon.id,

              phoneNormalized,

              OR: [
                {
                  status:
                    CouponRedemptionStatus
                      .REDEEMED,
                },
                {
                  status:
                    CouponRedemptionStatus
                      .RESERVED,

                  expiresAt: {
                    gt: now,
                  },
                },
              ],
            },

            select: {
              id: true,
            },
          });

      if (previousUse) {
        return errorResponse(
          "This coupon has already been applied for this mobile number.",
          409,
        );
      }
    }

    const productIds =
      Array.from(
        new Set(
          items.map(
            (item) =>
              item.productId,
          ),
        ),
      );

    /*
     * Preserve the exact customer
     * product/category visibility rule
     * used for new checkout.
     */
    const products =
      await prisma.product.findMany({
        where: {
          id: {
            in: productIds,
          },

          isActive: true,

          category: {
            isActive: true,
          },
        },

        select: {
          id: true,
          name: true,

          price: true,
          stock: true,

          variants: {
            select: {
              id: true,
              productId: true,

              label: true,

              price: true,
              stock: true,

              isActive: true,
            },
          },
        },
      });

    if (
      products.length !==
      productIds.length
    ) {
      return errorResponse(
        "One or more products were not found.",
        404,
      );
    }

    const productMap =
      new Map(
        products.map(
          (product) => [
            product.id,
            product,
          ],
        ),
      );

    let subtotalDecimal =
      new Prisma.Decimal(0);

    for (const item of items) {
      const product =
        productMap.get(
          item.productId,
        );

      if (!product) {
        return errorResponse(
          "One or more products were not found.",
          404,
        );
      }

      const variant =
        item.variantId
          ? product.variants.find(
              (
                candidateVariant,
              ) =>
                candidateVariant.id ===
                  item.variantId &&
                candidateVariant
                  .productId ===
                  product.id,
            )
          : null;

      if (
        item.variantId &&
        !variant
      ) {
        return errorResponse(
          `${product.name}: the selected package option no longer exists.`,
          409,
          {
            productId:
              product.id,

            variantId:
              item.variantId,
          },
        );
      }

      if (
        variant &&
        !variant.isActive
      ) {
        return errorResponse(
          `${product.name} (${variant.label}) is no longer available.`,
          409,
          {
            productId:
              product.id,

            variantId:
              variant.id,
          },
        );
      }

      const selectedName =
        variant
          ? `${product.name} (${variant.label})`
          : product.name;

      const availableStock =
        normalizeNonNegativeInteger(
          variant
            ? variant.stock
            : product.stock,
        );

      if (
        availableStock < 1 ||
        item.quantity >
          availableStock
      ) {
        return errorResponse(
          `${selectedName} has only ${availableStock} item(s) left.`,
          409,
          {
            productId:
              product.id,

            variantId:
              variant?.id ??
              null,

            availableStock,
          },
        );
      }

      const unitPriceNumber =
        normalizeMoney(
          variant
            ? variant.price
            : product.price,
        );

      if (
        unitPriceNumber === null
      ) {
        return errorResponse(
          `${selectedName} does not have a valid price.`,
          422,
          {
            productId:
              product.id,

            variantId:
              variant?.id ??
              null,
          },
        );
      }

      const unitPrice =
        decimalMoney(
          unitPriceNumber,
        );

      subtotalDecimal =
        subtotalDecimal.plus(
          unitPrice.mul(
            item.quantity,
          ),
        );
    }

    const subtotalAmount =
      decimalMoney(
        subtotalDecimal,
      );

    const discountPercent =
      Number(
        coupon.discountPercent,
      );

    if (
      !Number.isFinite(
        discountPercent,
      ) ||
      discountPercent <= 0 ||
      discountPercent > 100
    ) {
      console.error(
        "Coupon has invalid discount percentage:",
        coupon.id,
      );

      return errorResponse(
        "This coupon is currently unavailable.",
        500,
      );
    }

    /*
     * Product coupons apply only to the
     * original product subtotal.
     *
     * Shipping and shipping discounts are
     * deliberately not calculated here.
     */
    const productDiscountAmount =
      decimalMoney(
        subtotalAmount
          .mul(
            coupon.discountPercent,
          )
          .div(100),
      );

    const discountedSubtotalAmount =
      decimalMoney(
        subtotalAmount.minus(
          productDiscountAmount,
        ),
      );

    return NextResponse.json(
      {
        valid: true,

        coupon: {
          code:
            coupon.code,

          discountPercent:
            roundMoney(
              discountPercent,
            ),
        },

        preview: {
          subtotalAmount:
            Number(
              subtotalAmount,
            ),

          productDiscountAmount:
            Number(
              productDiscountAmount,
            ),

          discountedSubtotalAmount:
            Number(
              discountedSubtotalAmount,
            ),
        },
      },
      {
        status: 200,
        headers: noStoreHeaders(),
      },
    );
  } catch (error) {
    console.error(
      "Coupon validation failed:",
      error,
    );

    if (
      error instanceof
      SyntaxError
    ) {
      return errorResponse(
        "Invalid JSON request body.",
        400,
      );
    }

    return errorResponse(
      "Unable to validate this coupon right now.",
      500,
    );
  }
}
