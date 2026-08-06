import {
  NextRequest,
  NextResponse,
} from "next/server";
import { Prisma } from "@prisma/client";

import { requireAdmin } from "@/lib/auth";
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
  request: NextRequest,
  { params }: RouteContext,
) {
  const authentication =
    await requireAdmin(request);

  if (!authentication.authenticated) {
    return errorResponse(
      authentication.error,
      authentication.status,
    );
  }

  try {
    const { id } = await params;

    const orderId = id.trim();

    if (!orderId) {
      return errorResponse(
        "Order ID is required.",
        400,
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

          shippingEstimatedAmount:
            true,

          shippingChargedAmount:
            true,

          shippingDiscountAmount:
            true,

          totalAmount: true,

          status: true,
          paymentStatus: true,
          paymentMethod: true,

          razorpayOrderId: true,
          razorpayPaymentId: true,

          shippingProvider: true,
          shippingMode: true,
          shipmentStatus: true,

          packageWeightGrams: true,
          packageLengthCm: true,
          packageBreadthCm: true,
          packageHeightCm: true,

          delhiveryWaybill: true,
          delhiveryShipmentId: true,
          delhiveryOrderId: true,
          delhiveryStatus: true,

          shippingQuotedAt: true,
          pickupScheduledAt: true,
          shippedAt: true,

          estimatedDeliveryAt:
            true,

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

              productId: true,
              variantId: true,

              quantity: true,
              price: true,

              productName: true,
              productSlug: true,
              productImage: true,

              variantLabel: true,
              variantSku: true,

              variantWeightGrams:
                true,

              variantShippingWeightGrams:
                true,

              createdAt: true,

              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  image: true,
                  price: true,
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
        },
      });

    if (!order) {
      return errorResponse(
        "Order not found.",
        404,
      );
    }

    return NextResponse.json(
      {
        id: order.id,

        customerName:
          order.customerName,

        phone: order.phone,
        email: order.email,

        address: order.address,
        city: order.city,
        state: order.state,
        pincode: order.pincode,

        subtotalAmount:
          serializeDecimal(
            order.subtotalAmount,
          ) ?? 0,

        shippingEstimatedAmount:
          serializeDecimal(
            order
              .shippingEstimatedAmount,
          ) ?? 0,

        shippingChargedAmount:
          serializeDecimal(
            order
              .shippingChargedAmount,
          ) ?? 0,

        shippingDiscountAmount:
          serializeDecimal(
            order
              .shippingDiscountAmount,
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

        razorpayOrderId:
          order.razorpayOrderId,

        razorpayPaymentId:
          order.razorpayPaymentId,

        shippingProvider:
          order.shippingProvider,

        shippingMode:
          order.shippingMode,

        shipmentStatus:
          order.shipmentStatus,

        packageWeightGrams:
          order.packageWeightGrams,

        packageLengthCm:
          serializeDecimal(
            order.packageLengthCm,
          ),

        packageBreadthCm:
          serializeDecimal(
            order.packageBreadthCm,
          ),

        packageHeightCm:
          serializeDecimal(
            order.packageHeightCm,
          ),

        package:
          order.package,

        delhiveryWaybill:
          order.delhiveryWaybill,

        delhiveryShipmentId:
          order.delhiveryShipmentId,

        delhiveryOrderId:
          order.delhiveryOrderId,

        delhiveryStatus:
          order.delhiveryStatus,

        shippingQuotedAt:
          order.shippingQuotedAt
            ? order.shippingQuotedAt.toISOString()
            : null,

        pickupScheduledAt:
          order.pickupScheduledAt
            ? order.pickupScheduledAt.toISOString()
            : null,

        shippedAt:
          order.shippedAt
            ? order.shippedAt.toISOString()
            : null,

        estimatedDeliveryAt:
          order.estimatedDeliveryAt
            ? order.estimatedDeliveryAt.toISOString()
            : null,

        deliveredAt:
          order.deliveredAt
            ? order.deliveredAt.toISOString()
            : null,

        createdAt:
          order.createdAt.toISOString(),

        updatedAt:
          order.updatedAt.toISOString(),

        items: order.items.map(
          (item) => {
            const productName =
              item.productName?.trim() ||
              item.product.name;

            const productSlug =
              item.productSlug?.trim() ||
              item.product.slug;

            const productImage =
              item.productImage ??
              item.product.image;

            const variantLabel =
              item.variantLabel?.trim() ||
              item.variant?.label ||
              null;

            const variantSku =
              item.variantSku?.trim() ||
              item.variant?.sku ||
              null;

            const variantWeightGrams =
              item.variantWeightGrams ??
              item.variant?.weightGrams ??
              null;

            const variantShippingWeightGrams =
              item
                .variantShippingWeightGrams ??
              item.variant
                ?.shippingWeightGrams ??
              null;

            return {
              id: item.id,

              productId:
                item.productId,

              variantId:
                item.variantId,

              quantity:
                item.quantity,

              price:
                serializeDecimal(
                  item.price,
                ) ?? 0,

              productName,
              productSlug,
              productImage,

              variantLabel,
              variantSku,

              variantWeightGrams,

              variantShippingWeightGrams,

              createdAt:
                item.createdAt.toISOString(),

              product: {
                id:
                  item.product.id,

                name:
                  productName,

                slug:
                  productSlug,

                image:
                  productImage,

                /*
                 * Current live product price is
                 * supplied only for compatibility.
                 * Order displays must use item.price.
                 */
                price:
                  serializeDecimal(
                    item.product.price,
                  ) ?? 0,
              },

              variant:
                item.variantId
                  ? {
                      id:
                        item.variantId,

                      label:
                        variantLabel,

                      sku:
                        variantSku,

                      weightGrams:
                        variantWeightGrams,

                      shippingWeightGrams:
                        variantShippingWeightGrams,
                    }
                  : null,
            };
          },
        ),
      },
      {
        status: 200,
        headers: noStoreHeaders(),
      },
    );
  } catch (error) {
    console.error(
      "Failed to load admin order details:",
      error,
    );

    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === "P2023"
    ) {
      return errorResponse(
        "Invalid order ID.",
        400,
      );
    }

    return errorResponse(
      "Failed to load order details.",
      500,
    );
  }
}