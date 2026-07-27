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
  quantity?: unknown;
}

interface QuoteRequestBody {
  destinationPincode?: unknown;
  paymentMode?: unknown;
  items?: unknown;
}

interface ValidatedQuoteItem {
  productId: string;
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
      "Your cart contains too many different products.",
    );
  }

  const quantityByProductId =
    new Map<string, number>();

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

    const existingQuantity =
      quantityByProductId.get(
        productId,
      ) ?? 0;

    const combinedQuantity =
      existingQuantity + quantity;

    if (
      combinedQuantity >
      MAX_QUANTITY_PER_ITEM
    ) {
      throw new Error(
        `The total quantity for a product cannot exceed ${MAX_QUANTITY_PER_ITEM}.`,
      );
    }

    quantityByProductId.set(
      productId,
      combinedQuantity,
    );
  }

  return Array.from(
    quantityByProductId.entries(),
  ).map(
    ([productId, quantity]) => ({
      productId,
      quantity,
    }),
  );
}

function roundMoney(
  value: number,
) {
  return (
    Math.round(value * 100) / 100
  );
}

function noStoreHeaders() {
  return {
    "Cache-Control":
      "private, no-store, max-age=0",
  };
}

export async function POST(
  request: NextRequest,
) {
  try {
    const body: unknown =
      await request.json();

    if (!isRecord(body)) {
      return NextResponse.json(
        {
          error:
            "Invalid request body.",
        },
        {
          status: 400,
          headers: noStoreHeaders(),
        },
      );
    }

    const input =
      body as QuoteRequestBody;

    const destinationPincode =
      parsePincode(
        input.destinationPincode,
      );

    const paymentMode =
      parsePaymentMode(
        input.paymentMode,
      );

    const items =
      parseItems(input.items);

    const productIds = items.map(
      (item) => item.productId,
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
          shippingWeightGrams: true,
        },
      });

    if (
      products.length !==
      productIds.length
    ) {
      return NextResponse.json(
        {
          error:
            "One or more products are no longer available.",
        },
        {
          status: 400,
          headers: noStoreHeaders(),
        },
      );
    }

    const productById = new Map(
      products.map((product) => [
        product.id,
        product,
      ]),
    );

    let subtotal = 0;
    let productWeightGrams = 0;

    for (const item of items) {
      const product =
        productById.get(
          item.productId,
        );

      if (!product) {
        return NextResponse.json(
          {
            error:
              "One or more products are no longer available.",
          },
          {
            status: 400,
            headers:
              noStoreHeaders(),
          },
        );
      }

      if (
        !Number.isInteger(
          product.stock,
        ) ||
        product.stock < 1 ||
        item.quantity >
          product.stock
      ) {
        return NextResponse.json(
          {
            error: `${product.name} does not have enough stock.`,

            productId:
              product.id,

            availableStock:
              Math.max(
                0,
                product.stock,
              ),
          },
          {
            status: 409,
            headers:
              noStoreHeaders(),
          },
        );
      }

      const unitPrice = Number(
        product.price,
      );

      if (
        !Number.isFinite(
          unitPrice,
        ) ||
        unitPrice < 0
      ) {
        throw new Error(
          `The price for ${product.name} is invalid.`,
        );
      }

      const unitWeightGrams =
        Math.max(
          0,
          Math.floor(
            Number(
              product.shippingWeightGrams,
            ) || 0,
          ),
        );

      if (
        unitWeightGrams < 1
      ) {
        return NextResponse.json(
          {
            error: `${product.name} does not have a shipping weight configured.`,

            productId:
              product.id,
          },
          {
            status: 422,
            headers:
              noStoreHeaders(),
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

            emptyWeightGrams: true,
            maxWeightGrams: true,
          },
        },
      );

    const shippingPackage =
      packages.find(
        (packageOption) => {
          const packedWeight =
            productWeightGrams +
            Math.max(
              0,
              packageOption
                .emptyWeightGrams,
            );

          return (
            packedWeight <=
            packageOption
              .maxWeightGrams
          );
        },
      );

    if (!shippingPackage) {
      return NextResponse.json(
        {
          error:
            packages.length === 0
              ? "No active shipping package is configured."
              : "This order is too heavy for the available shipping packages.",
        },
        {
          status: 422,
          headers: noStoreHeaders(),
        },
      );
    }

    const packedWeightGrams =
      productWeightGrams +
      Math.max(
        0,
        shippingPackage
          .emptyWeightGrams,
      );

    const lengthCm = Number(
      shippingPackage.lengthCm,
    );

    const breadthCm = Number(
      shippingPackage.breadthCm,
    );

    const heightCm = Number(
      shippingPackage.heightCm,
    );

    if (
      !Number.isFinite(lengthCm) ||
      lengthCm <= 0 ||
      !Number.isFinite(
        breadthCm,
      ) ||
      breadthCm <= 0 ||
      !Number.isFinite(heightCm) ||
      heightCm <= 0
    ) {
      throw new Error(
        `Shipping package "${shippingPackage.name}" has invalid dimensions.`,
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
          cod: false,

          message:
            "Delivery is not available for this pincode.",
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
    message:
      "Prepaid delivery is not available for this pincode.",
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

        shippingMode: "S",
      });

    const estimatedShippingAmount =
      roundMoney(
        rate.estimatedAmount,
      );

    const freeShippingThreshold =
      Number(
        shopConfig.freeShippingAbove,
      );

    const qualifiesForFreeShipping =
      Number.isFinite(
        freeShippingThreshold,
      ) &&
      freeShippingThreshold > 0 &&
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

        paymentMode:
          "Prepaid",

        location: {
          city:
            serviceability.city ??
            null,

          district:
            serviceability
              .district ?? null,

          state:
            serviceability.state ??
            null,
        },

        package: {
          id: shippingPackage.id,
          name:
            shippingPackage.name,
          code:
            shippingPackage.code,

          productWeightGrams,

          emptyWeightGrams:
            shippingPackage
              .emptyWeightGrams,

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
            rate.chargeableWeightGrams,

          shippingMode:
            rate.shippingMode,

          freeShipping:
            qualifiesForFreeShipping,

          freeShippingThreshold:
            Number.isFinite(
              freeShippingThreshold,
            )
              ? freeShippingThreshold
              : null,

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
      return NextResponse.json(
        {
          error:
            "Invalid JSON request body.",
        },
        {
          status: 400,
          headers: noStoreHeaders(),
        },
      );
    }

    if (
      error instanceof
      DelhiveryApiError
    ) {
      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status:
            error.status >= 400 &&
            error.status < 500
              ? error.status
              : 502,

          headers: noStoreHeaders(),
        },
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 400,
          headers: noStoreHeaders(),
        },
      );
    }

    return NextResponse.json(
      {
        error:
          "Unable to calculate shipping.",
      },
      {
        status: 500,
        headers: noStoreHeaders(),
      },
    );
  }
}