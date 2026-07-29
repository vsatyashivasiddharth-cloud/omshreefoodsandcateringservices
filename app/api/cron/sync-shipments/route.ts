import {
  NextRequest,
  NextResponse,
} from "next/server";
import {
  ShipmentStatus,
  ShippingProvider,
} from "@prisma/client";

import {
  ShipmentSyncError,
  syncDelhiveryShipment,
} from "@/lib/sync-delhivery-shipment";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const MAX_ORDERS_PER_RUN = 25;

const ACTIVE_SHIPMENT_STATUSES: ShipmentStatus[] =
  [
    ShipmentStatus.CREATED,
    ShipmentStatus.PICKUP_SCHEDULED,
    ShipmentStatus.IN_TRANSIT,
    ShipmentStatus.OUT_FOR_DELIVERY,
  ];

function noStoreHeaders() {
  return {
    "Cache-Control":
      "private, no-store, max-age=0",
  };
}

function jsonResponse(
  body: unknown,
  status = 200,
) {
  return NextResponse.json(
    body,
    {
      status,
      headers: noStoreHeaders(),
    },
  );
}

function isAuthorized(
  request: NextRequest,
) {
  const cronSecret =
    process.env.CRON_SECRET?.trim();

  if (!cronSecret) {
    console.error(
      "CRON_SECRET is not configured.",
    );

    return false;
  }

  const authorization =
    request.headers.get(
      "authorization",
    );

  return (
    authorization ===
    `Bearer ${cronSecret}`
  );
}

function getSafeErrorMessage(
  error: unknown,
) {
  if (
    error instanceof
    ShipmentSyncError
  ) {
    return error.message;
  }

  if (error instanceof Error) {
    if (
      error.name === "AbortError"
    ) {
      return "Tracking request timed out.";
    }

    return error.message;
  }

  return "Unknown synchronization error.";
}

export async function GET(
  request: NextRequest,
) {
  if (!isAuthorized(request)) {
    return jsonResponse(
      {
        success: false,
        error: "Unauthorized.",
      },
      401,
    );
  }

  const startedAt = new Date();

  try {
    const orders =
      await prisma.order.findMany({
        where: {
          shippingProvider:
            ShippingProvider.DELHIVERY,

          delhiveryWaybill: {
            not: null,
          },

          shipmentStatus: {
            in: ACTIVE_SHIPMENT_STATUSES,
          },
        },

        select: {
          id: true,
          delhiveryWaybill: true,
          shipmentStatus: true,
          updatedAt: true,
        },

        orderBy: [
          {
            updatedAt: "asc",
          },
          {
            id: "asc",
          },
        ],

        take: MAX_ORDERS_PER_RUN,
      });

    const synchronized: Array<{
      orderId: string;
      waybill: string;
      previousStatus:
        ShipmentStatus;
      shipmentStatus:
        ShipmentStatus;
      delhiveryStatus:
        string;
    }> = [];

    const failed: Array<{
      orderId: string;
      waybill: string | null;
      error: string;
    }> = [];

    /*
     * Process sequentially to avoid sending a sudden burst
     * of requests to Delhivery and to keep database updates
     * predictable.
     */
    for (const order of orders) {
      try {
        const result =
          await syncDelhiveryShipment(
            order.id,
          );

        synchronized.push({
          orderId:
            result.order.id,

          waybill:
            result.order
              .delhiveryWaybill,

          previousStatus:
            order.shipmentStatus,

          shipmentStatus:
            result.order
              .shipmentStatus,

          delhiveryStatus:
            result.tracking.status,
        });
      } catch (error) {
        const message =
          getSafeErrorMessage(error);

        console.error(
          `Automatic shipment sync failed for order ${order.id}:`,
          error,
        );

        failed.push({
          orderId: order.id,

          waybill:
            order.delhiveryWaybill,

          error: message,
        });
      }
    }

    const finishedAt = new Date();

    return jsonResponse({
      success: true,

      message:
        "Automatic shipment synchronization completed.",

      startedAt:
        startedAt.toISOString(),

      finishedAt:
        finishedAt.toISOString(),

      durationMs:
        finishedAt.getTime() -
        startedAt.getTime(),

      limit:
        MAX_ORDERS_PER_RUN,

      selected:
        orders.length,

      synchronized:
        synchronized.length,

      failed:
        failed.length,

      results:
        synchronized,

      failures:
        failed,
    });
  } catch (error) {
    console.error(
      "Automatic shipment synchronization failed:",
      error,
    );

    return jsonResponse(
      {
        success: false,

        error:
          "Automatic shipment synchronization failed.",

        startedAt:
          startedAt.toISOString(),

        finishedAt:
          new Date().toISOString(),
      },
      500,
    );
  }
}