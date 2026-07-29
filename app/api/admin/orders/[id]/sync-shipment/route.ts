import {
  NextRequest,
  NextResponse,
} from "next/server";
import { Prisma } from "@prisma/client";

import { requireAdmin } from "@/lib/auth";
import { DelhiveryApiError } from "@/lib/delhivery";
import {
  ShipmentSyncError,
  syncDelhiveryShipment,
} from "@/lib/sync-delhivery-shipment";

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

    const result =
      await syncDelhiveryShipment(id);

    return NextResponse.json(
      {
        success: true,

        message:
          "Shipment status synchronized successfully.",

        order: {
          id: result.order.id,

          status:
            result.order.status,

          shippingProvider:
            result.order.shippingProvider,

          shippingMode:
            result.order.shippingMode,

          shipmentStatus:
            result.order.shipmentStatus,

          delhiveryWaybill:
            result.order.delhiveryWaybill,

          delhiveryShipmentId:
            result.order.delhiveryShipmentId,

          delhiveryOrderId:
            result.order.delhiveryOrderId,

          delhiveryStatus:
            result.order.delhiveryStatus,

          shippingQuotedAt:
            result.order.shippingQuotedAt
              ? result.order.shippingQuotedAt.toISOString()
              : null,

          pickupScheduledAt:
            result.order.pickupScheduledAt
              ? result.order.pickupScheduledAt.toISOString()
              : null,

          shippedAt:
            result.order.shippedAt
              ? result.order.shippedAt.toISOString()
              : null,

          estimatedDeliveryAt:
            result.order.estimatedDeliveryAt
              ? result.order.estimatedDeliveryAt.toISOString()
              : null,

          deliveredAt:
            result.order.deliveredAt
              ? result.order.deliveredAt.toISOString()
              : null,

          updatedAt:
            result.order.updatedAt.toISOString(),
        },

        tracking: result.tracking,
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
      error instanceof ShipmentSyncError
    ) {
      return errorResponse(
        error.message,
        error.status,
      );
    }

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