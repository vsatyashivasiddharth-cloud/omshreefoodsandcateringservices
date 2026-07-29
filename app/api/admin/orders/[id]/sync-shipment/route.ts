import {
  NextRequest,
  NextResponse,
} from "next/server";
import {
  OrderStatus,
  Prisma,
  ShipmentStatus,
  ShippingProvider,
} from "@prisma/client";

import { requireAdmin } from "@/lib/auth";
import {
  DelhiveryApiError,
  getDelhiveryTracking,
} from "@/lib/delhivery";
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

function normalizeStatusText(
  value: string,
) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function mapDelhiveryStatus(
  status: string,
  statusCode: string | null,
  scanText: string,
): ShipmentStatus {
  const normalized =
    normalizeStatusText(
      [
        status,
        statusCode ?? "",
        scanText,
      ].join(" "),
    );

  /*
   * Delhivery can return "Not picked" as the current
   * tracking status after an order has been cancelled
   * before physical pickup.
   *
   * The scan instructions may also contain:
   * "Shipment not received from client".
   */
  if (
    normalized.includes("cancelled") ||
    normalized.includes("canceled") ||
    normalized.includes("cancel") ||
    normalized.includes(
      "shipment not received from client",
    ) ||
    normalized.includes("not picked")
  ) {
    return ShipmentStatus.CANCELLED;
  }

  if (
    normalized.includes("rto") ||
    normalized.includes(
      "return to origin",
    ) ||
    normalized.includes(
      "returned to origin",
    )
  ) {
    return ShipmentStatus.RTO;
  }

  if (
    normalized.includes("delivered")
  ) {
    return ShipmentStatus.DELIVERED;
  }

  if (
    normalized.includes(
      "out for delivery",
    ) ||
    normalized.includes(
      "dispatched for delivery",
    )
  ) {
    return ShipmentStatus.OUT_FOR_DELIVERY;
  }

  if (
    normalized.includes("in transit") ||
    normalized.includes(
      "in-transit",
    ) ||
    normalized.includes("picked up") ||
    normalized.includes(
      "shipment received",
    ) ||
    normalized.includes("dispatched")
  ) {
    return ShipmentStatus.IN_TRANSIT;
  }

  if (
    normalized.includes(
      "pickup scheduled",
    ) ||
    normalized.includes(
      "ready for pickup",
    ) ||
    normalized.includes(
      "pickup request",
    )
  ) {
    return ShipmentStatus.PICKUP_SCHEDULED;
  }

  if (
    normalized.includes("fail") ||
    normalized.includes("lost") ||
    normalized.includes("damaged")
  ) {
    return ShipmentStatus.FAILED;
  }

  /*
   * A valid AWB that has not yet progressed remains
   * in the CREATED state.
   */
  return ShipmentStatus.CREATED;
}

function getOrderStatusUpdate(
  shipmentStatus: ShipmentStatus,
): OrderStatus | undefined {
  switch (shipmentStatus) {
    case ShipmentStatus.IN_TRANSIT:
    case ShipmentStatus.OUT_FOR_DELIVERY:
      return OrderStatus.OUT_FOR_DELIVERY;

    case ShipmentStatus.DELIVERED:
      return OrderStatus.DELIVERED;

    /*
     * Cancelling a courier shipment must not automatically
     * cancel or refund the paid customer order.
     */
    case ShipmentStatus.CANCELLED:
    case ShipmentStatus.RTO:
    case ShipmentStatus.FAILED:
    case ShipmentStatus.CREATED:
    case ShipmentStatus.QUOTED:
    case ShipmentStatus.NOT_CREATED:
    case ShipmentStatus.PICKUP_SCHEDULED:
    default:
      return undefined;
  }
}

function createTrackingScanText(
  scans: Awaited<
    ReturnType<
      typeof getDelhiveryTracking
    >
  >["scans"],
) {
  return scans
    .flatMap((scan) => [
      scan.status,
      scan.statusCode,
      scan.instructions,
      scan.location,
    ])
    .filter(
      (
        value,
      ): value is string =>
        typeof value === "string" &&
        value.trim().length > 0,
    )
    .join(" ");
}

export async function POST(
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

    const existingOrder =
      await prisma.order.findUnique({
        where: {
          id: orderId,
        },

        select: {
          id: true,
          status: true,

          shippingProvider: true,
          shipmentStatus: true,

          delhiveryWaybill: true,
          delhiveryStatus: true,

          pickupScheduledAt: true,
          shippedAt: true,
          estimatedDeliveryAt: true,
          deliveredAt: true,
        },
      });

    if (!existingOrder) {
      return errorResponse(
        "Order not found.",
        404,
      );
    }

    if (
      existingOrder.shippingProvider !==
      ShippingProvider.DELHIVERY
    ) {
      return errorResponse(
        "This order is not configured for Delhivery shipping.",
        409,
      );
    }

    const waybill =
      existingOrder.delhiveryWaybill?.trim();

    if (!waybill) {
      return errorResponse(
        "This order does not have a Delhivery waybill.",
        409,
      );
    }

    const controller =
      new AbortController();

    const timeout = setTimeout(
      () => controller.abort(),
      15_000,
    );

    let tracking: Awaited<
      ReturnType<
        typeof getDelhiveryTracking
      >
    >;

    try {
      tracking =
        await getDelhiveryTracking(
          waybill,
          controller.signal,
        );
    } finally {
      clearTimeout(timeout);
    }

    const scanText =
      createTrackingScanText(
        tracking.scans,
      );

    const shipmentStatus =
      mapDelhiveryStatus(
        tracking.status,
        tracking.statusCode,
        scanText,
      );

    const orderStatus =
      getOrderStatusUpdate(
        shipmentStatus,
      );

    const isCancelled =
      shipmentStatus ===
      ShipmentStatus.CANCELLED;

    const updatedOrder =
      await prisma.$transaction(
        async (transaction) => {
          await transaction.$executeRaw`
            SELECT pg_advisory_xact_lock(
              hashtext(${orderId})
            )
          `;

          return transaction.order.update({
            where: {
              id: orderId,
            },

            data: {
              shipmentStatus,

              /*
               * Keep Delhivery's raw current status for
               * troubleshooting and display.
               *
               * This may remain "Not picked" even when our
               * normalized shipment status is CANCELLED.
               */
              delhiveryStatus:
                tracking.status,

              /*
               * Clear operational timestamps for a shipment
               * cancelled before physical pickup.
               */
              pickupScheduledAt:
                isCancelled
                  ? null
                  : tracking.pickupScheduledAt ??
                    existingOrder.pickupScheduledAt,

              shippedAt:
                isCancelled
                  ? null
                  : tracking.shippedAt ??
                    existingOrder.shippedAt,

              estimatedDeliveryAt:
                isCancelled
                  ? null
                  : tracking.estimatedDeliveryAt ??
                    existingOrder.estimatedDeliveryAt,

              deliveredAt:
                isCancelled
                  ? null
                  : tracking.deliveredAt ??
                    existingOrder.deliveredAt,

              ...(orderStatus
                ? {
                    status:
                      orderStatus,
                  }
                : {}),
            },

            select: {
              id: true,

              status: true,

              shippingProvider: true,
              shippingMode: true,
              shipmentStatus: true,

              delhiveryWaybill: true,
              delhiveryShipmentId: true,
              delhiveryOrderId: true,
              delhiveryStatus: true,

              shippingQuotedAt: true,
              pickupScheduledAt: true,
              shippedAt: true,
              estimatedDeliveryAt: true,
              deliveredAt: true,

              updatedAt: true,
            },
          });
        },
        {
          isolationLevel:
            Prisma
              .TransactionIsolationLevel
              .Serializable,

          maxWait: 10_000,
          timeout: 20_000,
        },
      );

    return NextResponse.json(
      {
        success: true,

        message:
          "Shipment status synchronized successfully.",

        order: {
          id: updatedOrder.id,

          status:
            updatedOrder.status,

          shippingProvider:
            updatedOrder.shippingProvider,

          shippingMode:
            updatedOrder.shippingMode,

          shipmentStatus:
            updatedOrder.shipmentStatus,

          delhiveryWaybill:
            updatedOrder.delhiveryWaybill,

          delhiveryShipmentId:
            updatedOrder.delhiveryShipmentId,

          delhiveryOrderId:
            updatedOrder.delhiveryOrderId,

          delhiveryStatus:
            updatedOrder.delhiveryStatus,

          shippingQuotedAt:
            updatedOrder.shippingQuotedAt
              ? updatedOrder.shippingQuotedAt.toISOString()
              : null,

          pickupScheduledAt:
            updatedOrder.pickupScheduledAt
              ? updatedOrder.pickupScheduledAt.toISOString()
              : null,

          shippedAt:
            updatedOrder.shippedAt
              ? updatedOrder.shippedAt.toISOString()
              : null,

          estimatedDeliveryAt:
            updatedOrder.estimatedDeliveryAt
              ? updatedOrder.estimatedDeliveryAt.toISOString()
              : null,

          deliveredAt:
            updatedOrder.deliveredAt
              ? updatedOrder.deliveredAt.toISOString()
              : null,

          updatedAt:
            updatedOrder.updatedAt.toISOString(),
        },

        tracking: {
          waybill:
            tracking.waybill,

          status:
            tracking.status,

          statusCode:
            tracking.statusCode,

          scanCount:
            tracking.scans.length,

          normalizedShipmentStatus:
            shipmentStatus,
        },
      },
      {
        status: 200,
        headers: noStoreHeaders(),
      },
    );
  } catch (error) {
    console.error(
      "Delhivery shipment synchronization failed:",
      error,
    );

    if (
      error instanceof DelhiveryApiError
    ) {
      return errorResponse(
        error.status === 404
          ? "Delhivery tracking information was not found for this waybill."
          : "Unable to retrieve the latest shipment status.",

        error.status >= 400 &&
          error.status < 500
          ? error.status
          : 502,
      );
    }

    if (
      error instanceof DOMException &&
      error.name === "AbortError"
    ) {
      return errorResponse(
        "The shipment tracking request timed out. Please try again.",
        504,
      );
    }

    if (
      error instanceof Error &&
      error.name === "AbortError"
    ) {
      return errorResponse(
        "The shipment tracking request timed out. Please try again.",
        504,
      );
    }

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

    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      return errorResponse(
        "Shipment synchronization conflicted with another update. Please try again.",
        409,
      );
    }

    return errorResponse(
      "Unable to synchronize the shipment status.",
      500,
    );
  }
}