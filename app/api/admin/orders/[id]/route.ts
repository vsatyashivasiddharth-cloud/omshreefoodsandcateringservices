import {
  NextRequest,
  NextResponse,
} from "next/server";
import {
  OrderStatus,
  Prisma,
} from "@prisma/client";

import {
  requireAdmin,
} from "@/lib/auth";
import prisma from "@/lib/prisma";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

interface UpdateOrderStatusBody {
  status?: unknown;
}

/*
 * All statuses that may exist in the database.
 *
 * CANCELLED remains a valid internal status for
 * exceptional payment/shipping/system situations.
 */
const validOrderStatuses =
  new Set<OrderStatus>(
    Object.values(
      OrderStatus,
    ),
  );

/*
 * Statuses that an administrator may set manually.
 *
 * CANCELLED is deliberately excluded.
 *
 * Customers do not have a cancellation feature,
 * and administrators should not routinely cancel
 * food orders after they have been placed.
 */
const manuallyEditableStatuses =
  new Set<OrderStatus>([
    OrderStatus.PENDING,
    OrderStatus.PAID,
    OrderStatus.PREPARING,
    OrderStatus.PACKED,
    OrderStatus.OUT_FOR_DELIVERY,
    OrderStatus.DELIVERED,
  ]);

function isRecord(
  value: unknown,
): value is Record<
  string,
  unknown
> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function isOrderStatus(
  value: unknown,
): value is OrderStatus {
  return (
    typeof value === "string" &&
    validOrderStatuses.has(
      value as OrderStatus,
    )
  );
}

function isManuallyEditableStatus(
  value: unknown,
): value is OrderStatus {
  return (
    isOrderStatus(value) &&
    manuallyEditableStatuses.has(
      value,
    )
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
      headers:
        noStoreHeaders(),
    },
  );
}

export async function PATCH(
  request: NextRequest,
  {
    params,
  }: RouteContext,
) {
  try {
    /*
     * This is an admin-only mutation endpoint.
     *
     * Do not rely only on middleware/proxy
     * protection. The API authenticates itself.
     */
    const authentication =
      await requireAdmin(
        request,
      );

    if (
      !authentication.authenticated
    ) {
      return errorResponse(
        authentication.error,
        authentication.status,
      );
    }

    const {
      id,
    } = await params;

    const orderId =
      id.trim();

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
      rawBody as UpdateOrderStatusBody;

    /*
     * Give a specific response when someone
     * tries to bypass the UI and manually send:
     *
     * {
     *   "status": "CANCELLED"
     * }
     */
    if (
      body.status ===
      OrderStatus.CANCELLED
    ) {
      return errorResponse(
        "Orders cannot be cancelled manually.",
        403,
      );
    }

    if (
      !isManuallyEditableStatus(
        body.status,
      )
    ) {
      return errorResponse(
        "Invalid order status.",
        400,
      );
    }

    const existingOrder =
      await prisma.order.findUnique({
        where: {
          id:
            orderId,
        },

        select: {
          id: true,
          status: true,
          paymentStatus: true,
        },
      });

    if (!existingOrder) {
      return errorResponse(
        "Order not found.",
        404,
      );
    }

    /*
     * CANCELLED orders are system-exception
     * records.
     *
     * Do not allow the normal admin fulfilment
     * endpoint to revive or modify one.
     */
    if (
      existingOrder.status ===
      OrderStatus.CANCELLED
    ) {
      return errorResponse(
        "System-cancelled orders cannot be changed manually.",
        409,
      );
    }

    /*
     * Nothing needs to be written when the
     * requested status is already current.
     */
    if (
      existingOrder.status ===
      body.status
    ) {
      return NextResponse.json(
        {
          id:
            existingOrder.id,

          status:
            existingOrder.status,

          paymentStatus:
            existingOrder.paymentStatus,

          unchanged: true,
        },
        {
          status: 200,
          headers:
            noStoreHeaders(),
        },
      );
    }

    const order =
      await prisma.order.update({
        where: {
          id:
            orderId,
        },

        data: {
          /*
           * Only fulfilment status changes here.
           *
           * Payment status remains completely
           * independent and is controlled by the
           * Razorpay payment flow.
           */
          status:
            body.status,
        },

        select: {
          id: true,
          status: true,
          paymentStatus: true,
          updatedAt: true,
        },
      });

    return NextResponse.json(
      {
        ...order,

        updatedAt:
          order.updatedAt
            .toISOString(),

        unchanged:
          false,
      },
      {
        status: 200,
        headers:
          noStoreHeaders(),
      },
    );
  } catch (error) {
    console.error(
      "Failed to update order status:",
      error,
    );

    if (
      error instanceof
      SyntaxError
    ) {
      return errorResponse(
        "Invalid request body.",
        400,
      );
    }

    if (
      error instanceof
        Prisma
          .PrismaClientKnownRequestError
    ) {
      if (
        error.code ===
        "P2025"
      ) {
        return errorResponse(
          "Order not found.",
          404,
        );
      }

      if (
        error.code ===
        "P2023"
      ) {
        return errorResponse(
          "Invalid order ID.",
          400,
        );
      }
    }

    return errorResponse(
      "Failed to update order.",
      500,
    );
  }
}