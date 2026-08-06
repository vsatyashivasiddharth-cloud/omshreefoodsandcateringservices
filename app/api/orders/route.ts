import {
  NextRequest,
  NextResponse,
} from "next/server";
import {
  Prisma,
  ShippingMode,
  ShippingProvider,
  ShipmentStatus,
} from "@prisma/client";

import {
  checkDelhiveryServiceability,
  DelhiveryApiError,
  getDelhiveryShippingRate,
} from "@/lib/delhivery";
import { normalizeIndianPhone } from "@/lib/phone";
import prisma from "@/lib/prisma";
import { shopConfig } from "@/lib/shop";

interface OrderItemInput {
  productId: string;
  variantId: string | null;
  quantity: number;
}

interface CreateOrderBody {
  customerName?: unknown;
  phone?: unknown;
  email?: unknown;

  address?: unknown;
  city?: unknown;
  state?: unknown;
  pincode?: unknown;

  paymentMode?: unknown;
  items?: unknown;
}

interface ResolvedOrderLine {
  productId: string;
  variantId: string | null;

  quantity: number;

  productName: string;
  productSlug: string;
  productImage: string | null;

  variantLabel: string | null;
  variantSku: string | null;
  variantWeightGrams: number | null;

  variantShippingWeightGrams:
    | number
    | null;

  unitPrice: Prisma.Decimal;
  availableStock: number;
  shippingWeightGrams: number;
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

  const variantId = value.trim();

  return variantId || null;
}

function isValidEmail(
  value: string,
) {
  return (
    value.length === 0 ||
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      value,
    )
  );
}

function parsePaymentMode(
  value: unknown,
): "Prepaid" | null {
  if (
    value === undefined ||
    value === "Prepaid"
  ) {
    return "Prepaid";
  }

  return null;
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
): OrderItemInput[] | null {
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
      OrderItemInput
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

    const quantity = Number(
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

    const key = createLineKey(
      productId,
      variantId,
    );

    const currentQuantity =
      itemByKey.get(key)
        ?.quantity ?? 0;

    const combinedQuantity =
      currentQuantity + quantity;

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
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.max(
    0,
    Math.floor(number),
  );
}

function normalizePositiveNumber(
  value: unknown,
) {
  const number = Number(value);

  if (
    !Number.isFinite(number) ||
    number <= 0
  ) {
    return null;
  }

  return number;
}

function normalizeMoney(
  value: unknown,
) {
  const number = Number(value);

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
      rawBody as CreateOrderBody;

    const customerName =
      getTrimmedString(
        body.customerName,
      );

    const phone =
      getTrimmedString(
        body.phone,
      );

    const email =
      getTrimmedString(
        body.email,
      );

    const address =
      getTrimmedString(
        body.address,
      );

    const city =
      getTrimmedString(
        body.city,
      );

    const state =
      getTrimmedString(
        body.state,
      );

    const pincode =
      getTrimmedString(
        body.pincode,
      );

    const paymentMode =
      parsePaymentMode(
        body.paymentMode,
      );

    const items =
      parseItems(body.items);

    if (
      customerName.length < 2 ||
      customerName.length > 100
    ) {
      return errorResponse(
        "Please enter a valid customer name.",
        400,
      );
    }

    const phoneNormalized =
      normalizeIndianPhone(phone);

    if (!phoneNormalized) {
      return errorResponse(
        "Please enter a valid Indian mobile number.",
        400,
      );
    }

    if (
      email.length > 150 ||
      !isValidEmail(email)
    ) {
      return errorResponse(
        "Please enter a valid email address.",
        400,
      );
    }

    if (
      address.length < 5 ||
      address.length > 450
    ) {
      return errorResponse(
        "Please enter a valid delivery address.",
        400,
      );
    }

    if (
      city.length < 2 ||
      city.length > 100
    ) {
      return errorResponse(
        "Please enter a valid city.",
        400,
      );
    }

    if (
      state.length < 2 ||
      state.length > 100
    ) {
      return errorResponse(
        "Please select a valid state.",
        400,
      );
    }

    if (!/^\d{6}$/.test(pincode)) {
      return errorResponse(
        "Please enter a valid 6-digit pincode.",
        400,
      );
    }

    if (!paymentMode) {
      return errorResponse(
        "Only prepaid orders are currently supported.",
        400,
      );
    }

    if (!items) {
      return errorResponse(
        "Please provide valid order items.",
        400,
      );
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

    const products =
      await prisma.product.findMany({
        where: {
          id: {
            in: productIds,
          },
        },

        select: {
          id: true,
          name: true,
          slug: true,
          image: true,

          price: true,
          stock: true,

          shippingWeightGrams:
            true,

          variants: {
            select: {
              id: true,
              productId: true,

              label: true,
              sku: true,

              weightGrams: true,

              shippingWeightGrams:
                true,

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

    const resolvedLines:
      ResolvedOrderLine[] = [];

    let subtotalDecimal =
      new Prisma.Decimal(0);

    let productWeightGrams = 0;

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
                candidateVariant.productId ===
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

      /*
       * Variant lines always use variant-level
       * price, stock and packed weight.
       *
       * A null variantId remains compatible with
       * products and carts created before variants.
       */
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

      const unitShippingWeightGrams =
        normalizeNonNegativeInteger(
          variant
            ? variant
                .shippingWeightGrams
            : product
                .shippingWeightGrams,
        );

      if (
        unitShippingWeightGrams < 1
      ) {
        return errorResponse(
          `${selectedName} does not have a packed shipping weight configured.`,
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

      subtotalDecimal =
        subtotalDecimal.plus(
          unitPrice.mul(
            item.quantity,
          ),
        );

      productWeightGrams +=
        unitShippingWeightGrams *
        item.quantity;

      resolvedLines.push({
        productId:
          product.id,

        variantId:
          variant?.id ??
          null,

        quantity:
          item.quantity,

        productName:
          product.name,

        productSlug:
          product.slug,

        productImage:
          product.image ||
          null,

        variantLabel:
          variant?.label ??
          null,

        variantSku:
          variant?.sku ??
          null,

        variantWeightGrams:
          variant
            ? normalizeNonNegativeInteger(
                variant.weightGrams,
              )
            : null,

        variantShippingWeightGrams:
          variant
            ? unitShippingWeightGrams
            : null,

        unitPrice,

        availableStock,

        shippingWeightGrams:
          unitShippingWeightGrams,
      });
    }

    const subtotalAmount =
      decimalMoney(
        subtotalDecimal,
      );

    const packages =
      await prisma.shippingPackage.findMany(
        {
          where: {
            active: true,
          },

          orderBy: [
            {
              maxWeightGrams:
                "asc",
            },
            {
              emptyWeightGrams:
                "asc",
            },
          ],

          select: {
            id: true,
            name: true,
            code: true,

            lengthCm: true,
            breadthCm: true,
            heightCm: true,

            emptyWeightGrams:
              true,

            maxWeightGrams:
              true,
          },
        },
      );

    if (
      packages.length === 0
    ) {
      return errorResponse(
        "No active shipping package is configured.",
        422,
      );
    }

    const shippingPackage =
      packages.find(
        (packageOption) => {
          const emptyWeightGrams =
            normalizeNonNegativeInteger(
              packageOption
                .emptyWeightGrams,
            );

          const maxWeightGrams =
            normalizeNonNegativeInteger(
              packageOption
                .maxWeightGrams,
            );

          return (
            maxWeightGrams > 0 &&
            productWeightGrams +
              emptyWeightGrams <=
              maxWeightGrams
          );
        },
      );

    if (!shippingPackage) {
      return errorResponse(
        "This order is too heavy for the available shipping packages.",
        422,
        {
          productWeightGrams,
        },
      );
    }

    const emptyWeightGrams =
      normalizeNonNegativeInteger(
        shippingPackage
          .emptyWeightGrams,
      );

    const packedWeightGrams =
      productWeightGrams +
      emptyWeightGrams;

    const packageLengthCm =
      normalizePositiveNumber(
        shippingPackage.lengthCm,
      );

    const packageBreadthCm =
      normalizePositiveNumber(
        shippingPackage.breadthCm,
      );

    const packageHeightCm =
      normalizePositiveNumber(
        shippingPackage.heightCm,
      );

    if (
      packageLengthCm === null ||
      packageBreadthCm === null ||
      packageHeightCm === null
    ) {
      return errorResponse(
        "The selected shipping package has invalid dimensions.",
        500,
      );
    }

    const serviceability =
      await checkDelhiveryServiceability(
        pincode,
      );

    if (
      !serviceability.serviceable
    ) {
      return errorResponse(
        "Delivery is not available for this pincode.",
        422,
      );
    }

    if (!serviceability.prepaid) {
      return errorResponse(
        "Prepaid delivery is not available for this pincode.",
        422,
      );
    }

    const shippingRate =
      await getDelhiveryShippingRate({
        destinationPincode:
          pincode,

        weightGrams:
          packedWeightGrams,

        lengthCm:
          packageLengthCm,

        breadthCm:
          packageBreadthCm,

        heightCm:
          packageHeightCm,

        paymentMode:
          "Prepaid",

        codAmount: 0,

        shippingMode: "S",
      });

    const estimatedShippingNumber =
      roundMoney(
        Number(
          shippingRate.estimatedAmount,
        ),
      );

    if (
      !Number.isFinite(
        estimatedShippingNumber,
      ) ||
      estimatedShippingNumber < 0
    ) {
      throw new Error(
        "Delhivery returned an invalid shipping amount.",
      );
    }

    const subtotalNumber =
      Number(subtotalAmount);

    const configuredThreshold =
      Number(
        shopConfig.freeShippingAbove,
      );

    const freeShippingThreshold =
      Number.isFinite(
        configuredThreshold,
      ) &&
      configuredThreshold > 0
        ? configuredThreshold
        : null;

    const qualifiesForFreeShipping =
      freeShippingThreshold !==
        null &&
      subtotalNumber >=
        freeShippingThreshold;

    const chargedShippingNumber =
      qualifiesForFreeShipping
        ? 0
        : estimatedShippingNumber;

    const shippingDiscountNumber =
      roundMoney(
        estimatedShippingNumber -
          chargedShippingNumber,
      );

    const totalAmountNumber =
      roundMoney(
        subtotalNumber +
          chargedShippingNumber,
      );

    const shippingEstimatedAmount =
      decimalMoney(
        estimatedShippingNumber,
      );

    const shippingChargedAmount =
      decimalMoney(
        chargedShippingNumber,
      );

    const shippingDiscountAmount =
      decimalMoney(
        shippingDiscountNumber,
      );

    const totalAmount =
      decimalMoney(
        totalAmountNumber,
      );

    const shippingMode =
      shippingRate.shippingMode ===
      "EXPRESS"
        ? ShippingMode.EXPRESS
        : ShippingMode.SURFACE;

    const shippingQuotedAt =
      new Date();

    /*
     * The unpaid order stores immutable product and
     * variant snapshots. Inventory is intentionally
     * not deducted until Razorpay payment succeeds.
     */
    const order =
      await prisma.order.create({
        data: {
          customerName,
          phone,
          phoneNormalized,

          email:
            email || null,

          address,
          city,
          state,
          pincode,

          subtotalAmount,

          shippingEstimatedAmount,
          shippingChargedAmount,
          shippingDiscountAmount,

          totalAmount,

          paymentMethod:
            "Prepaid",

          shippingProvider:
            ShippingProvider.DELHIVERY,

          shippingMode,

          shipmentStatus:
            ShipmentStatus.QUOTED,

          packageId:
            shippingPackage.id,

          packageWeightGrams:
            packedWeightGrams,

          packageLengthCm:
            new Prisma.Decimal(
              packageLengthCm,
            ),

          packageBreadthCm:
            new Prisma.Decimal(
              packageBreadthCm,
            ),

          packageHeightCm:
            new Prisma.Decimal(
              packageHeightCm,
            ),

          shippingQuotedAt,

          items: {
            create:
              resolvedLines.map(
                (line) => ({
                  productId:
                    line.productId,

                  variantId:
                    line.variantId,

                  quantity:
                    line.quantity,

                  price:
                    line.unitPrice,

                  productName:
                    line.productName,

                  productSlug:
                    line.productSlug,

                  productImage:
                    line.productImage,

                  variantLabel:
                    line.variantLabel,

                  variantSku:
                    line.variantSku,

                  variantWeightGrams:
                    line
                      .variantWeightGrams,

                  variantShippingWeightGrams:
                    line
                      .variantShippingWeightGrams,
                }),
              ),
          },
        },

        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  image: true,
                },
              },

              variant: {
                select: {
                  id: true,
                  label: true,
                  sku: true,
                  weightGrams: true,

                  shippingWeightGrams:
                    true,
                },
              },
            },
          },

          package: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      });

    return NextResponse.json(
      {
        id: order.id,

        /*
         * This token is shown only during creation
         * and is required by the customer-facing
         * order-success route.
         */
        orderAccessToken:
          order.publicAccessToken,

        customerName:
          order.customerName,

        phone:
          order.phone,

        email:
          order.email,

        deliveryAddress: {
          address:
            order.address,

          city:
            order.city,

          state:
            order.state,

          pincode:
            order.pincode,
        },

        subtotalAmount:
          Number(
            order.subtotalAmount,
          ),

        shippingEstimatedAmount:
          Number(
            order
              .shippingEstimatedAmount,
          ),

        shippingChargedAmount:
          Number(
            order
              .shippingChargedAmount,
          ),

        shippingDiscountAmount:
          Number(
            order
              .shippingDiscountAmount,
          ),

        totalAmount:
          Number(
            order.totalAmount,
          ),

        status:
          order.status,

        paymentStatus:
          order.paymentStatus,

        paymentMethod:
          order.paymentMethod,

        shipping: {
          mode:
            order.shippingMode,

          status:
            order.shipmentStatus,

          quotedAt:
            order.shippingQuotedAt,

          package:
            order.package
              ? {
                  id:
                    order.package.id,

                  name:
                    order.package
                      .name,

                  code:
                    order.package
                      .code,

                  packedWeightGrams:
                    order
                      .packageWeightGrams,

                  dimensions: {
                    lengthCm:
                      order.packageLengthCm
                        ? Number(
                            order
                              .packageLengthCm,
                          )
                        : null,

                    breadthCm:
                      order.packageBreadthCm
                        ? Number(
                            order
                              .packageBreadthCm,
                          )
                        : null,

                    heightCm:
                      order.packageHeightCm
                        ? Number(
                            order
                              .packageHeightCm,
                          )
                        : null,
                  },
                }
              : null,
        },

        items:
          order.items.map(
            (item) => {
              const unitPrice =
                Number(
                  item.price,
                );

              return {
                id:
                  item.id,

                productId:
                  item.productId,

                variantId:
                  item.variantId,

                quantity:
                  item.quantity,

                unitPrice,

                lineTotal:
                  roundMoney(
                    unitPrice *
                      item.quantity,
                  ),

                product: {
                  id:
                    item.productId,

                  name:
                    item.productName ??
                    item.product.name,

                  slug:
                    item.productSlug ??
                    item.product.slug,

                  image:
                    item.productImage ??
                    item.product.image,
                },

                variant:
                  item.variantId
                    ? {
                        id:
                          item.variantId,

                        label:
                          item.variantLabel ??
                          item.variant
                            ?.label ??
                          null,

                        sku:
                          item.variantSku ??
                          item.variant
                            ?.sku ??
                          null,

                        weightGrams:
                          item
                            .variantWeightGrams ??
                          item.variant
                            ?.weightGrams ??
                          null,

                        shippingWeightGrams:
                          item
                            .variantShippingWeightGrams ??
                          item.variant
                            ?.shippingWeightGrams ??
                          null,
                      }
                    : null,
              };
            },
          ),

        createdAt:
          order.createdAt,

        updatedAt:
          order.updatedAt,
      },
      {
        status: 201,
        headers: noStoreHeaders(),
      },
    );
  } catch (error) {
    console.error(
      "Order creation failed:",
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
      DelhiveryApiError
    ) {
      return errorResponse(
        error.message ||
          "Unable to calculate delivery charges.",

        error.status >= 400 &&
        error.status < 500
          ? error.status
          : 502,
      );
    }

    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      return errorResponse(
        "Your order could not be completed because product availability changed. Please try again.",
        409,
      );
    }

    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return errorResponse(
        "A duplicate order item was detected. Please refresh your cart and try again.",
        409,
      );
    }

    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return errorResponse(
        "The selected product, package option, or shipping package is no longer available.",
        409,
      );
    }

    return errorResponse(
      "Something went wrong while creating your order.",
      500,
    );
  }
}