import "server-only";

import {
  OrderStatus,
  Prisma,
  ShipmentStatus,
  ShippingProvider,
} from "@prisma/client";

import {
  getDelhiveryTracking,
  type DelhiveryTrackingResult,
} from "@/lib/delhivery";
import prisma from "@/lib/prisma";

export interface SyncDelhiveryShipmentResult {
  order: {
    id: string;
    status: OrderStatus;
    shippingProvider: ShippingProvider;
    shippingMode: string | null;
    shipmentStatus: ShipmentStatus;

    delhiveryWaybill: string;
    delhiveryShipmentId: string | null;
    delhiveryOrderId: string | null;
    delhiveryStatus: string | null;

    shippingQuotedAt: Date | null;
    pickupScheduledAt: Date | null;
    shippedAt: Date | null;
    estimatedDeliveryAt: Date | null;
    deliveredAt: Date | null;

    updatedAt: Date;
  };

  tracking: {
    waybill: string;
    status: string;
    statusCode: string | null;
    scanCount: number;
    normalizedShipmentStatus: ShipmentStatus;
  };
}

export class ShipmentSyncError extends Error {
  readonly status: number;

  constructor(
    message: string,
    status = 500,
  ) {
    super(message);

    this.name = "ShipmentSyncError";
    this.status = status;
  }
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

function createTrackingScanText(
  scans: DelhiveryTrackingResult["scans"],
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

function mapDelhiveryStatus(
  tracking: DelhiveryTrackingResult,
): ShipmentStatus {
  const scanText =
    createTrackingScanText(
      tracking.scans,
    );

  const normalized =
    normalizeStatusText(
      [
        tracking.status,
        tracking.statusCode ?? "",
        scanText,
      ].join(" "),
    );

  /*
   * Delhivery may report "Not picked" after a shipment
   * was cancelled before physical pickup.
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

  return ShipmentStatus.CREATED;
}

function getWebsiteOrderStatus(
  shipmentStatus: ShipmentStatus,
): OrderStatus | undefined {
  switch (shipmentStatus) {
    case ShipmentStatus.IN_TRANSIT:
    case ShipmentStatus.OUT_FOR_DELIVERY:
      return OrderStatus.OUT_FOR_DELIVERY;

    case ShipmentStatus.DELIVERED:
      return OrderStatus.DELIVERED;

    /*
     * A courier cancellation, RTO, or failure must not
     * automatically cancel or refund a paid website order.
     */
    default:
      return undefined;
  }
}

export async function syncDelhiveryShipment(
  orderId: string,
): Promise<SyncDelhiveryShipmentResult> {
  const normalizedOrderId =
    orderId.trim();

  if (!normalizedOrderId) {
    throw new ShipmentSyncError(
      "Order ID is required.",
      400,
    );
  }

  const existingOrder =
    await prisma.order.findUnique({
      where: {
        id: normalizedOrderId,
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
    throw new ShipmentSyncError(
      "Order not found.",
      404,
    );
  }

  if (
    existingOrder.shippingProvider !==
    ShippingProvider.DELHIVERY
  ) {
    throw new ShipmentSyncError(
      "This order is not configured for Delhivery shipping.",
      409,
    );
  }

  const waybill =
    existingOrder.delhiveryWaybill?.trim();

  if (!waybill) {
    throw new ShipmentSyncError(
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

  let tracking: DelhiveryTrackingResult;

  try {
    tracking =
      await getDelhiveryTracking(
        waybill,
        controller.signal,
      );
  } finally {
    clearTimeout(timeout);
  }

  const shipmentStatus =
    mapDelhiveryStatus(tracking);

  const websiteOrderStatus =
    getWebsiteOrderStatus(
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
            hashtext(${normalizedOrderId})
          )
        `;

        return transaction.order.update({
          where: {
            id: normalizedOrderId,
          },

          data: {
            shipmentStatus,

            /*
             * Store the carrier's raw status separately
             * from the normalized internal status.
             */
            delhiveryStatus:
              tracking.status,

            /*
             * Clear operational timestamps when the
             * shipment was cancelled before collection.
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

            ...(websiteOrderStatus
              ? {
                  status:
                    websiteOrderStatus,
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

  if (!updatedOrder.delhiveryWaybill) {
    throw new ShipmentSyncError(
      "The synchronized order does not have a waybill.",
      500,
    );
  }

  return {
    order: {
      ...updatedOrder,
      delhiveryWaybill:
        updatedOrder.delhiveryWaybill,
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
  };
}