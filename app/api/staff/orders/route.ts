import {
  NextRequest,
  NextResponse,
} from "next/server";
import {
  OrderStatus,
  PaymentStatus,
  PrintJobType,
  ShipmentStatus,
  ShippingProvider,
} from "@prisma/client";

import { requireAdmin } from "@/lib/auth";
import prisma from "@/lib/prisma";

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

export async function GET(
  request: NextRequest,
) {
  try {
    /*
     * Staff Orders uses the existing Admin
     * identity, but this API exposes only the
     * operational order fields needed by the
     * separate Staff interface.
     */
    const authentication =
      await requireAdmin(request);

    if (!authentication.authenticated) {
      return errorResponse(
        authentication.error,
        authentication.status,
      );
    }

    /*
     * Only orders participating in the new
     * ecommerce-label workflow are returned.
     *
     * This intentionally prevents historical
     * paid orders from flooding the Staff app.
     */
    const orders =
      await prisma.order.findMany({
        where: {
          paymentStatus:
            PaymentStatus.SUCCESS,

          status: {
            not: OrderStatus.CANCELLED,
          },

          printJobs: {
            some: {
              type:
                PrintJobType
                  .ECOMMERCE_LABEL,
            },
          },
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

          totalAmount: true,

          status: true,
          paymentStatus: true,

          staffSeenAt: true,

          shippingProvider: true,
          shipmentStatus: true,

          delhiveryWaybill: true,
          delhiveryStatus: true,

          shippedAt: true,
          deliveredAt: true,

          createdAt: true,
          updatedAt: true,

          items: {
            orderBy: {
              createdAt: "asc",
            },

            select: {
              id: true,
              quantity: true,
              price: true,

              productName: true,
              productImage: true,

              variantLabel: true,
              variantSku: true,

              product: {
                select: {
                  name: true,
                  image: true,
                },
              },

              variant: {
                select: {
                  label: true,
                  sku: true,
                },
              },
            },
          },

          printJobs: {
            where: {
              type:
                PrintJobType
                  .ECOMMERCE_LABEL,
            },

            take: 1,

            select: {
              id: true,
              status: true,
              attemptCount: true,
              claimedAt: true,
              printedAt: true,
              lastError: true,
              createdAt: true,
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },
      });

    return NextResponse.json(
      orders.map((order) => {
        const delivered =
          order.status ===
            OrderStatus.DELIVERED ||
          order.shipmentStatus ===
            ShipmentStatus.DELIVERED;

        /*
         * Once a real shipment exists, keep the
         * order in Shipment Created until it is
         * delivered.
         *
         * Delhivery waybill is authoritative for
         * Delhivery shipment creation. Local
         * Logistics uses its shipment status.
         */
        const shipmentCreated =
          !delivered &&
          (
            order.shippingProvider ===
            ShippingProvider.MANUAL
              ? order.shipmentStatus ===
                  ShipmentStatus.IN_TRANSIT ||
                order.shipmentStatus ===
                  ShipmentStatus.OUT_FOR_DELIVERY
              : Boolean(
                    order.delhiveryWaybill?.trim(),
                  ) ||
                order.shipmentStatus ===
                  ShipmentStatus.CREATED ||
                order.shipmentStatus ===
                  ShipmentStatus.PICKUP_SCHEDULED ||
                order.shipmentStatus ===
                  ShipmentStatus.IN_TRANSIT ||
                order.shipmentStatus ===
                  ShipmentStatus.OUT_FOR_DELIVERY ||
                order.shipmentStatus ===
                  ShipmentStatus.RTO ||
                order.shipmentStatus ===
                  ShipmentStatus.FAILED ||
                order.shipmentStatus ===
                  ShipmentStatus.CANCELLED
          );

        const category =
          delivered
            ? "DELIVERED"
            : shipmentCreated
              ? "SHIPMENT_CREATED"
              : "NEW";

        return {
          id: order.id,

          category,

          customerName:
            order.customerName,

          phone:
            order.phone,

          email:
            order.email,

          address:
            order.address,

          city:
            order.city,

          state:
            order.state,

          pincode:
            order.pincode,

          totalAmount:
            Number(
              order.totalAmount,
            ),

          status:
            order.status,

          paymentStatus:
            order.paymentStatus,

          staffSeenAt:
            order.staffSeenAt
              ?.toISOString() ??
            null,

          shippingProvider:
            order.shippingProvider,

          shipmentStatus:
            order.shipmentStatus,

          delhiveryWaybill:
            order.delhiveryWaybill,

          delhiveryStatus:
            order.delhiveryStatus,

          shippedAt:
            order.shippedAt
              ?.toISOString() ??
            null,

          deliveredAt:
            order.deliveredAt
              ?.toISOString() ??
            null,

          createdAt:
            order.createdAt.toISOString(),

          updatedAt:
            order.updatedAt.toISOString(),

          items:
            order.items.map(
              (item) => ({
                id: item.id,

                quantity:
                  item.quantity,

                price:
                  Number(
                    item.price,
                  ),

                productName:
                  item.productName
                    ?.trim() ||
                  item.product?.name ||
                  "Deleted product",

                productImage:
                  item.productImage ??
                  item.product?.image ??
                  null,

                variantLabel:
                  item.variantLabel
                    ?.trim() ||
                  item.variant
                    ?.label ||
                  null,

                variantSku:
                  item.variantSku
                    ?.trim() ||
                  item.variant
                    ?.sku ||
                  null,
              }),
            ),

          printJob:
            order.printJobs[0]
              ? {
                  id:
                    order.printJobs[0]
                      .id,

                  status:
                    order.printJobs[0]
                      .status,

                  attemptCount:
                    order.printJobs[0]
                      .attemptCount,

                  claimedAt:
                    order.printJobs[0]
                      .claimedAt
                      ?.toISOString() ??
                    null,

                  printedAt:
                    order.printJobs[0]
                      .printedAt
                      ?.toISOString() ??
                    null,

                  lastError:
                    order.printJobs[0]
                      .lastError,

                  createdAt:
                    order.printJobs[0]
                      .createdAt
                      .toISOString(),
                }
              : null,
        };
      }),
      {
        status: 200,
        headers: noStoreHeaders(),
      },
    );
  } catch (error) {
    console.error(
      "Failed to load Staff Orders:",
      error,
    );

    return errorResponse(
      "Failed to load Staff Orders.",
      500,
    );
  }
}