import {
  NextRequest,
  NextResponse,
} from "next/server";
import {
  OrderStatus,
  PaymentStatus,
  ShipmentStatus,
  ShippingProvider,
} from "@prisma/client";

import { requireAdmin } from "@/lib/auth";
import prisma from "@/lib/prisma";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

interface UpdateFulfilmentBody {
  provider?: unknown;
  shipmentStatus?: unknown;
}

const manualShipmentStatuses =
  new Set<ShipmentStatus>([
    ShipmentStatus.CREATED,
    ShipmentStatus.IN_TRANSIT,
    ShipmentStatus.OUT_FOR_DELIVERY,
    ShipmentStatus.DELIVERED,
  ]);

const manualShipmentRank:
  Partial<Record<ShipmentStatus, number>> = {
    [ShipmentStatus.CREATED]: 0,
    [ShipmentStatus.IN_TRANSIT]: 1,
    [ShipmentStatus.OUT_FOR_DELIVERY]: 2,
    [ShipmentStatus.DELIVERED]: 3,
  };

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

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function isShippingProvider(
  value: unknown,
): value is ShippingProvider {
  return (
    typeof value === "string" &&
    Object.values(ShippingProvider).includes(
      value as ShippingProvider,
    )
  );
}

function isManualShipmentStatus(
  value: unknown,
): value is ShipmentStatus {
  return (
    typeof value === "string" &&
    manualShipmentStatuses.has(
      value as ShipmentStatus,
    )
  );
}

export async function PATCH(
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

    const rawBody: unknown =
      await request.json();

    if (!isRecord(rawBody)) {
      return errorResponse(
        "Invalid request body.",
        400,
      );
    }

    const body =
      rawBody as UpdateFulfilmentBody;

    const provider =
      body.provider === undefined
        ? undefined
        : isShippingProvider(
              body.provider,
            )
          ? body.provider
          : null;

    if (provider === null) {
      return errorResponse(
        "Invalid shipping provider.",
        400,
      );
    }

    const requestedShipmentStatus =
      body.shipmentStatus === undefined
        ? undefined
        : isManualShipmentStatus(
              body.shipmentStatus,
            )
          ? body.shipmentStatus
          : null;

    if (requestedShipmentStatus === null) {
      return errorResponse(
        "Invalid manual shipment status.",
        400,
      );
    }

    if (
      provider === undefined &&
      requestedShipmentStatus === undefined
    ) {
      return errorResponse(
        "No fulfilment changes were provided.",
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
          paymentStatus: true,

          shippingProvider: true,
          shipmentStatus: true,

          delhiveryWaybill: true,
          delhiveryShipmentId: true,
          delhiveryOrderId: true,

          shippedAt: true,
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
      existingOrder.status ===
      OrderStatus.CANCELLED
    ) {
      return errorResponse(
        "Cancelled orders cannot be fulfilled.",
        409,
      );
    }

    if (
      existingOrder.paymentStatus !==
      PaymentStatus.SUCCESS
    ) {
      return errorResponse(
        "Only successfully paid orders can enter fulfilment.",
        409,
      );
    }

    const hasDelhiveryShipment =
      Boolean(
        existingOrder.delhiveryWaybill?.trim(),
      ) ||
      Boolean(
        existingOrder.delhiveryShipmentId?.trim(),
      ) ||
      Boolean(
        existingOrder.delhiveryOrderId?.trim(),
      );

    if (
      provider ===
        ShippingProvider.MANUAL &&
      existingOrder.shippingProvider ===
        ShippingProvider.DELHIVERY &&
      hasDelhiveryShipment
    ) {
      return errorResponse(
        "This order already has a Delhivery shipment and cannot be switched to Local Logistics.",
        409,
      );
    }

    if (
      requestedShipmentStatus !==
        undefined &&
      provider !==
        ShippingProvider.MANUAL &&
      existingOrder.shippingProvider !==
        ShippingProvider.MANUAL
    ) {
      return errorResponse(
        "Manual shipment status can only be updated for Local Logistics orders.",
        409,
      );
    }

    if (
      provider ===
        ShippingProvider.DELHIVERY &&
      existingOrder.shippingProvider ===
        ShippingProvider.MANUAL
    ) {
      const existingRank =
        manualShipmentRank[
          existingOrder.shipmentStatus
        ];

      if (
        existingRank !== undefined &&
        existingRank > 0
      ) {
        return errorResponse(
          "A Local Logistics order that has already been dispatched cannot be switched back to Delhivery.",
          409,
        );
      }
    }

    const targetProvider =
      provider ??
      existingOrder.shippingProvider;

    let targetShipmentStatus =
      existingOrder.shipmentStatus;

    if (
      provider === ShippingProvider.MANUAL &&
      existingOrder.shippingProvider !==
        ShippingProvider.MANUAL
    ) {
      targetShipmentStatus =
        requestedShipmentStatus ??
        ShipmentStatus.CREATED;
    } else if (
      provider ===
        ShippingProvider.DELHIVERY &&
      existingOrder.shippingProvider ===
        ShippingProvider.MANUAL
    ) {
      targetShipmentStatus =
        ShipmentStatus.QUOTED;
    } else if (
      requestedShipmentStatus !== undefined
    ) {
      targetShipmentStatus =
        requestedShipmentStatus;
    }

    if (
      targetProvider ===
        ShippingProvider.MANUAL &&
      !manualShipmentStatuses.has(
        targetShipmentStatus,
      )
    ) {
      targetShipmentStatus =
        ShipmentStatus.CREATED;
    }

    if (
      targetProvider ===
        ShippingProvider.MANUAL &&
      requestedShipmentStatus !==
        undefined
    ) {
      const currentRank =
        manualShipmentRank[
          existingOrder.shipmentStatus
        ];

      const requestedRank =
        manualShipmentRank[
          requestedShipmentStatus
        ];

      if (
        currentRank !== undefined &&
        requestedRank !== undefined &&
        requestedRank < currentRank
      ) {
        return errorResponse(
          "Local Logistics shipment status cannot be moved backwards.",
          409,
        );
      }
    }

    const now = new Date();

    let websiteOrderStatus =
      existingOrder.status;

    let shippedAt =
      existingOrder.shippedAt;

    let deliveredAt =
      existingOrder.deliveredAt;

    if (
      targetProvider ===
      ShippingProvider.MANUAL
    ) {
      if (
        targetShipmentStatus ===
          ShipmentStatus.IN_TRANSIT ||
        targetShipmentStatus ===
          ShipmentStatus.OUT_FOR_DELIVERY
      ) {
        websiteOrderStatus =
          OrderStatus.OUT_FOR_DELIVERY;

        shippedAt =
          shippedAt ?? now;
      }

      if (
        targetShipmentStatus ===
        ShipmentStatus.DELIVERED
      ) {
        websiteOrderStatus =
          OrderStatus.DELIVERED;

        shippedAt =
          shippedAt ?? now;

        deliveredAt =
          deliveredAt ?? now;
      }
    }

    const updatedOrder =
      await prisma.order.update({
        where: {
          id: orderId,
        },

        data: {
          shippingProvider:
            targetProvider,

          shipmentStatus:
            targetShipmentStatus,

          status:
            websiteOrderStatus,

          shippedAt,
          deliveredAt,
        },

        select: {
          id: true,
          status: true,
          paymentStatus: true,

          shippingProvider: true,
          shippingMode: true,
          shipmentStatus: true,

          delhiveryWaybill: true,
          delhiveryStatus: true,

          shippingQuotedAt: true,
          shippedAt: true,
          deliveredAt: true,

          updatedAt: true,
        },
      });

    return NextResponse.json(
      {
        success: true,

        message:
          updatedOrder.shippingProvider ===
          ShippingProvider.MANUAL
            ? "Local Logistics fulfilment updated."
            : "Delhivery fulfilment selected.",

        order: {
          ...updatedOrder,

          shippingQuotedAt:
            updatedOrder.shippingQuotedAt
              ?.toISOString() ??
            null,

          shippedAt:
            updatedOrder.shippedAt
              ?.toISOString() ??
            null,

          deliveredAt:
            updatedOrder.deliveredAt
              ?.toISOString() ??
            null,

          updatedAt:
            updatedOrder.updatedAt
              .toISOString(),
        },
      },
      {
        status: 200,
        headers: noStoreHeaders(),
      },
    );
  } catch (error) {
    console.error(
      "Failed to update order fulfilment:",
      error,
    );

    if (error instanceof SyntaxError) {
      return errorResponse(
        "Invalid request body.",
        400,
      );
    }

    return errorResponse(
      "Failed to update order fulfilment.",
      500,
    );
  }
}
