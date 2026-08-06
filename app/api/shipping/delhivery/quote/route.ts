import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  checkDelhiveryServiceability,
  DelhiveryApiError,
  getDelhiveryShippingRate,
} from "@/lib/delhivery";
import prisma from "@/lib/prisma";
import { shopConfig } from "@/lib/shop";

interface QuoteItemInput {
  productId?: unknown;
  variantId?: unknown;
  quantity?: unknown;
}

interface QuoteRequestBody {
  destinationPincode?: unknown;
  paymentMode?: unknown;
  items?: unknown;
}

interface ValidatedQuoteItem {
  productId: string;
  variantId: string | null;
  quantity: number;
}

const MAX_DISTINCT_ITEMS = 50;
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

function parsePincode(
  value: unknown,
) {
  if (typeof value !== "string") {
    throw new Error(
      "Destination pincode is required.",
    );
  }

  const pincode = value.trim();

  if (!/^\d{6}$/.test(pincode)) {
    throw new Error(
      "Destination pincode must contain exactly 6 digits.",
    );
  }

  return pincode;
}

function parsePaymentMode(
  value: unknown,
): "Prepaid" {
  if (
    value === undefined ||
    value === "Prepaid"
  ) {
    return "Prepaid";
  }

  throw new Error(
    "Only prepaid orders are currently supported.",
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
    throw new Error(
      "One or more cart items contain an invalid variant ID.",
    );
  }

  const variantId = value.trim();

  return variantId || null;
}

function createItemKey(
  productId: string,
  variantId: string | null,
) {
  return `${productId}:${
    variantId ?? "legacy"
  }`;
}

function parseItems(
  value: unknown,
): ValidatedQuoteItem[] {
  if (!Array.isArray(value)) {
    throw new Error(
      "Cart items are required.",
    );
  }

  if (value.length === 0) {
    throw new Error(
      "Your cart is empty.",
    );
  }

  if (
    value.length >
    MAX_DISTINCT_ITEMS
  ) {
    throw new Error(
      "Your cart contains too many different product options.",
    );
  }

  const itemByKey =
    new Map<
      string,
      ValidatedQuoteItem
    >();

  for (const rawItem of value) {
    if (!isRecord(rawItem)) {
      throw new Error(
        "One or more cart items are invalid.",
      );
    }

    const item =
      rawItem as QuoteItemInput;

    const productId =
      typeof item.productId ===
      "string"
        ? item.productId.trim()
        : "";

    const variantId =
      parseNullableVariantId(
        item.variantId,
      );

    const quantity = Number(
      item.quantity,
    );

    if (!productId) {
      throw new Error(
        "One or more cart items are missing a product ID.",
      );
    }

    if (
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity >
        MAX_QUANTITY_PER_ITEM
    ) {
      throw new Error(
        `Quantity must be between 1 and ${MAX_QUANTITY_PER_ITEM}.`,
      );
    }

    const key = createItemKey(
      productId,
      variantId,
    );

    const existing =
      itemByKey.get(key);

    const combinedQuantity =
      (existing?.quantity ?? 0) +
      quantity;

    if (
      combinedQuantity >
      MAX_QUANTITY_PER_ITEM
    ) {
      throw new Error(
        `The total quantity for one product option cannot exceed ${MAX_QUANTITY_PER_ITEM}.`,
      );
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

function roundMoney(
  value: number,
) {
  return (
    Math.round(value * 100) /
    100
  );
}

function isClientInputError(
  message: string,
) {
  return [
    "Destination pincode is required.",
    "Destination pincode must contain exactly 6 digits.",
    "Only prepaid orders are currently supported.",
    "Cart items are required.",
    "Your cart is empty.",
    "Your cart contains too many different product options.",
    "One or more cart items are invalid.",
    "One or more cart items are missing a product ID.",
    "One or more cart items contain an invalid variant ID.",
  ].includes(message);
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
      rawBody as QuoteRequestBody;

    const destinationPincode =
      parsePincode(
        body.destinationPincode,
      );

    const paymentMode =
      parsePaymentMode(
        body.paymentMode,
      );

    const items =
      parseItems(body.items);

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
          price: true,
          stock: true,
          shippingWeightGrams:
            true,

          variants: {
            select: {
              id: true,
              productId: true,
              label: true,
              price: true,
              stock: true,

              shippingWeightGrams:
                true,

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
        "One or more products are no longer available.",
        400,
      );
    }

    const productById =
      new Map(
        products.map(
          (product) => [
            product.id,
            product,
          ],
        ),
      );

    let subtotal = 0;
    let productWeightGrams = 0;

    for (const item of items) {
      const product =
        productById.get(
          item.productId,
        );

      if (!product) {
        return errorResponse(
          "One or more products are no longer available.",
          400,
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
       * A cart line containing variantId uses the
       * ProductVariant values.
       *
       * A null variantId remains backward-compatible
       * with products and carts created before variants.
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
          `${selectedName} does not have enough stock.`,
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

      const unitPrice =
        normalizeMoney(
          variant
            ? variant.price
            : product.price,
        );

      if (unitPrice === null) {
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

      const unitWeightGrams =
        normalizeNonNegativeInteger(
          variant
            ? variant
                .shippingWeightGrams
            : product
                .shippingWeightGrams,
        );

      if (
        unitWeightGrams < 1
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

      subtotal +=
        unitPrice *
        item.quantity;

      productWeightGrams +=
        unitWeightGrams *
        item.quantity;
    }

    subtotal =
      roundMoney(subtotal);

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

    const lengthCm =
      normalizePositiveNumber(
        shippingPackage.lengthCm,
      );

    const breadthCm =
      normalizePositiveNumber(
        shippingPackage.breadthCm,
      );

    const heightCm =
      normalizePositiveNumber(
        shippingPackage.heightCm,
      );

    if (
      lengthCm === null ||
      breadthCm === null ||
      heightCm === null
    ) {
      return errorResponse(
        `Shipping package "${shippingPackage.name}" has invalid dimensions.`,
        500,
      );
    }

    const serviceability =
      await checkDelhiveryServiceability(
        destinationPincode,
      );

    if (
      !serviceability.serviceable
    ) {
      return NextResponse.json(
        {
          serviceable: false,
          prepaid: false,

          reversePickup:
            serviceability.reversePickup,

          message:
            "Delivery is not available for this pincode.",

          location: {
            city:
              serviceability.city ??
              null,

            district:
              serviceability.district ??
              null,

            state:
              serviceability.state ??
              null,
          },
        },
        {
          status: 200,
          headers: noStoreHeaders(),
        },
      );
    }

    if (!serviceability.prepaid) {
      return NextResponse.json(
        {
          serviceable: false,

          prepaid:
            serviceability.prepaid,

          reversePickup:
            serviceability.reversePickup,

          message:
            "Prepaid delivery is not available for this pincode.",

          location: {
            city:
              serviceability.city ??
              null,

            district:
              serviceability.district ??
              null,

            state:
              serviceability.state ??
              null,
          },
        },
        {
          status: 200,
          headers: noStoreHeaders(),
        },
      );
    }

    const rate =
      await getDelhiveryShippingRate({
        destinationPincode,

        weightGrams:
          packedWeightGrams,

        lengthCm,
        breadthCm,
        heightCm,

        paymentMode,

        codAmount: 0,

        /*
         * Delhivery helper accepts:
         * "S" = surface shipping.
         */
        shippingMode: "S",
      });

    const estimatedShippingAmount =
      roundMoney(
        Number(
          rate.estimatedAmount,
        ),
      );

    if (
      !Number.isFinite(
        estimatedShippingAmount,
      ) ||
      estimatedShippingAmount < 0
    ) {
      throw new Error(
        "Delhivery returned an invalid shipping amount.",
      );
    }

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
      subtotal >=
        freeShippingThreshold;

    const chargedShippingAmount =
      qualifiesForFreeShipping
        ? 0
        : estimatedShippingAmount;

    const shippingDiscountAmount =
      roundMoney(
        estimatedShippingAmount -
          chargedShippingAmount,
      );

    const totalAmount =
      roundMoney(
        subtotal +
          chargedShippingAmount,
      );

    return NextResponse.json(
      {
        serviceable: true,

        prepaid:
          serviceability.prepaid,

        reversePickup:
          serviceability.reversePickup,

        paymentMode,

        location: {
          city:
            serviceability.city ??
            null,

          district:
            serviceability.district ??
            null,

          state:
            serviceability.state ??
            null,
        },

        package: {
          id:
            shippingPackage.id,

          name:
            shippingPackage.name,

          code:
            shippingPackage.code,

          productWeightGrams,

          emptyWeightGrams,

          packedWeightGrams,

          dimensions: {
            lengthCm,
            breadthCm,
            heightCm,
          },
        },

        quote: {
          subtotalAmount:
            subtotal,

          estimatedShippingAmount,

          chargedShippingAmount,

          shippingDiscountAmount,

          totalAmount,

          chargeableWeightGrams:
            normalizeNonNegativeInteger(
              rate.chargeableWeightGrams,
            ) ||
            packedWeightGrams,

          shippingMode:
            rate.shippingMode,

          freeShipping:
            qualifiesForFreeShipping,

          freeShippingThreshold,

          quotedAt:
            new Date().toISOString(),
        },
      },
      {
        status: 200,
        headers: noStoreHeaders(),
      },
    );
  } catch (error) {
    console.error(
      "Delhivery quote API error:",
      error,
    );

    if (
      error instanceof SyntaxError
    ) {
      return errorResponse(
        "Invalid JSON request body.",
        400,
      );
    }

    if (
      error instanceof
      DelhiveryApiError
    ) {
      const status =
        error.status >= 400 &&
        error.status < 500
          ? error.status
          : 502;

      return errorResponse(
        error.message,
        status,
      );
    }

    if (error instanceof Error) {
      if (
        isClientInputError(
          error.message,
        ) ||
        error.message.startsWith(
          "Quantity must be between",
        ) ||
        error.message.startsWith(
          "The total quantity for one product option",
        )
      ) {
        return errorResponse(
          error.message,
          400,
        );
      }
    }

    return errorResponse(
      "Unable to calculate shipping for this order.",
      500,
    );
  }
}