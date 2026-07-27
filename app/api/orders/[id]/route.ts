import {
  NextRequest,
  NextResponse,
} from "next/server";
import { Prisma } from "@prisma/client";

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
  };
}

function serializeDecimal(
  value:
    | Prisma.Decimal
    | number
    | null
    | undefined,
) {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}

export async function GET(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id } =
      await context.params;

    const orderId = id.trim();

    if (!orderId) {
      return NextResponse.json(
        {
          error:
            "Order ID is required.",
        },
        {
          status: 400,
          headers: noStoreHeaders(),
        },
      );
    }

    const order =
      await prisma.order.findUnique({
        where: {
          id: orderId,
        },

        select: {
          id: true,

          customerName: true,
          phone: true,
          email: true,

          address: true,
          city: true,
          state: true,
          pincode: true,

          subtotalAmount: true,
          shippingEstimatedAmount: true,
          shippingChargedAmount: true,
          shippingDiscountAmount: true,
          totalAmount: true,

          status: true,
          paymentStatus: true,
          paymentMethod: true,

          shippingMode: true,
          shipmentStatus: true,

          packageWeightGrams: true,
          packageLengthCm: true,
          packageBreadthCm: true,
          packageHeightCm: true,

          delhiveryWaybill: true,
          delhiveryStatus: true,

          shippingQuotedAt: true,
          pickupScheduledAt: true,
          shippedAt: true,
          estimatedDeliveryAt: true,
          deliveredAt: true,

          createdAt: true,
          updatedAt: true,

          package: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },

          items: {
            orderBy: {
              createdAt: "asc",
            },

            select: {
              id: true,
              quantity: true,
              price: true,
              createdAt: true,

              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  image: true,

                  category: {
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

    if (!order) {
      return NextResponse.json(
        {
          error: "Order not found.",
        },
        {
          status: 404,
          headers: noStoreHeaders(),
        },
      );
    }

    return NextResponse.json(
      {
        id: order.id,

        customerName:
          order.customerName,

        phone: order.phone,
        email: order.email,

        deliveryAddress: {
          address: order.address,
          city: order.city,
          state: order.state,
          pincode: order.pincode,
        },

        subtotalAmount:
          serializeDecimal(
            order.subtotalAmount,
          ) ?? 0,

        shippingEstimatedAmount:
          serializeDecimal(
            order.shippingEstimatedAmount,
          ) ?? 0,

        shippingChargedAmount:
          serializeDecimal(
            order.shippingChargedAmount,
          ) ?? 0,

        shippingDiscountAmount:
          serializeDecimal(
            order.shippingDiscountAmount,
          ) ?? 0,

        totalAmount:
          serializeDecimal(
            order.totalAmount,
          ) ?? 0,

        status: order.status,

        paymentStatus:
          order.paymentStatus,

        paymentMethod:
          order.paymentMethod,

        shipping: {
          mode: order.shippingMode,

          status:
            order.shipmentStatus,

          quotedAt:
            order.shippingQuotedAt,

          pickupScheduledAt:
            order.pickupScheduledAt,

          shippedAt:
            order.shippedAt,

          estimatedDeliveryAt:
            order.estimatedDeliveryAt,

          deliveredAt:
            order.deliveredAt,

          tracking: {
            number:
              order.delhiveryWaybill,

            status:
              order.delhiveryStatus,
          },

          package: order.package
            ? {
                ...order.package,

                packedWeightGrams:
                  order.packageWeightGrams,

                dimensions: {
                  lengthCm:
                    serializeDecimal(
                      order.packageLengthCm,
                    ),

                  breadthCm:
                    serializeDecimal(
                      order.packageBreadthCm,
                    ),

                  heightCm:
                    serializeDecimal(
                      order.packageHeightCm,
                    ),
                },
              }
            : null,
        },

        items: order.items.map(
          (item) => {
            const unitPrice =
              serializeDecimal(
                item.price,
              ) ?? 0;

            return {
              id: item.id,

              quantity:
                item.quantity,

              unitPrice,

              lineTotal:
                Math.round(
                  unitPrice *
                    item.quantity *
                    100,
                ) / 100,

              createdAt:
                item.createdAt,

              product:
                item.product,
            };
          },
        ),

        createdAt:
          order.createdAt,

        updatedAt:
          order.updatedAt,
      },
      {
        status: 200,
        headers: noStoreHeaders(),
      },
    );
  } catch (error) {
    console.error(
      "Order loading failed:",
      error,
    );

    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === "P2023"
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid order ID.",
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
          "Unable to load the order.",
      },
      {
        status: 500,
        headers: noStoreHeaders(),
      },
    );
  }
}