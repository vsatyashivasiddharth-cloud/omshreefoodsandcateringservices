import {
  NextRequest,
  NextResponse,
} from "next/server";
import {
  Prisma,
  ShippingMode,
  ShippingProvider,
  ShipmentStatus,
  type Product,
} from "@prisma/client";

import {
  checkDelhiveryServiceability,
  DelhiveryApiError,
  getDelhiveryShippingRate,
} from "@/lib/delhivery";
import prisma from "@/lib/prisma";
import { shopConfig } from "@/lib/shop";

interface OrderItemInput {
  productId: string;
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

interface OrderProduct {
  id: Product["id"];
  name: Product["name"];
  price: Product["price"];
  stock: Product["stock"];

  shippingWeightGrams:
    Product["shippingWeightGrams"];
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
): string {
  return typeof value === "string"
    ? value.trim()
    : "";
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

  const quantityByProductId =
    new Map<string, number>();

  for (const rawItem of value) {
    if (!isRecord(rawItem)) {
      return null;
    }

    const productId =
      getTrimmedString(
        rawItem.productId,
      );

    const quantity = Number(
      rawItem.quantity,
    );

    if (
      !productId ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity >
        MAX_QUANTITY_PER_ITEM
    ) {
      return null;
    }

    const currentQuantity =
      quantityByProductId.get(
        productId,
      ) ?? 0;

    const combinedQuantity =
      currentQuantity + quantity;

    if (
      combinedQuantity >
      MAX_QUANTITY_PER_ITEM
    ) {
      return null;
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

function createProductMap(
  products: OrderProduct[],
) {
  return new Map(
    products.map((product) => [
      product.id,
      product,
    ]),
  );
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
    Math.round(value * 100) / 100
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
      getTrimmedString(body.phone);

    const email =
      getTrimmedString(body.email);

    const address =
      getTrimmedString(
        body.address,
      );

    const city =
      getTrimmedString(body.city);

    const state =
      getTrimmedString(body.state);

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

    if (!/^\d{10}$/.test(phone)) {
      return errorResponse(
        "Please enter a valid 10-digit phone number.",
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
      return errorResponse(
        "One or more products were not found.",
        404,
      );
    }

    const productMap =
      createProductMap(products);

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

      /*
       * This is only an early availability check.
       * Inventory is not deducted until payment
       * has been captured and verified.
       */
      if (
        product.stock <
        item.quantity
      ) {
        return errorResponse(
          `${product.name} has only ${Math.max(
            0,
            product.stock,
          )} item(s) left.`,
          409,
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

      if (unitWeightGrams < 1) {
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

      subtotalDecimal =
        subtotalDecimal.plus(
          product.price.mul(
            item.quantity,
          ),
        );

      productWeightGrams +=
        unitWeightGrams *
        item.quantity;
    }

    const subtotalAmount =
      decimalMoney(
        subtotalDecimal,
      );

    const packages =
      await prisma.shippingPackage
        .findMany({
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
        });

    if (packages.length === 0) {
      return errorResponse(
        "No active shipping package is configured.",
        422,
      );
    }

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
      return errorResponse(
        "This order is too heavy for the available shipping packages.",
        422,
      );
    }

    const packedWeightGrams =
      productWeightGrams +
      Math.max(
        0,
        shippingPackage
          .emptyWeightGrams,
      );

    const packageLengthCm =
      Number(
        shippingPackage.lengthCm,
      );

    const packageBreadthCm =
      Number(
        shippingPackage.breadthCm,
      );

    const packageHeightCm =
      Number(
        shippingPackage.heightCm,
      );

    if (
      !Number.isFinite(
        packageLengthCm,
      ) ||
      packageLengthCm <= 0 ||
      !Number.isFinite(
        packageBreadthCm,
      ) ||
      packageBreadthCm <= 0 ||
      !Number.isFinite(
        packageHeightCm,
      ) ||
      packageHeightCm <= 0
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

    const subtotalNumber =
      Number(subtotalAmount);

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
        shippingRate.estimatedAmount,
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
     * Create the unpaid order and its item
     * snapshots without modifying product stock.
     */
    const order =
      await prisma.order.create({
        data: {
          customerName,
          phone,

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
            create: items.map(
              (item) => {
                const product =
                  productMap.get(
                    item.productId,
                  );

                if (!product) {
                  throw new Error(
                    "PRODUCT_NOT_FOUND_DURING_ORDER",
                  );
                }

                return {
                  productId:
                    item.productId,

                  quantity:
                    item.quantity,

                  price:
                    product.price,
                };
              },
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
        ...order,

        subtotalAmount: Number(
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

        totalAmount: Number(
          order.totalAmount,
        ),

        packageLengthCm:
          order.packageLengthCm
            ? Number(
                order.packageLengthCm,
              )
            : null,

        packageBreadthCm:
          order.packageBreadthCm
            ? Number(
                order.packageBreadthCm,
              )
            : null,

        packageHeightCm:
          order.packageHeightCm
            ? Number(
                order.packageHeightCm,
              )
            : null,

        items: order.items.map(
          (item) => ({
            ...item,

            price: Number(
              item.price,
            ),
          }),
        ),
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
      error.code === "P2003"
    ) {
      return errorResponse(
        "The selected product or shipping package is no longer available.",
        409,
      );
    }

    return errorResponse(
      "Something went wrong while creating your order.",
      500,
    );
  }
}