import {
  NextRequest,
  NextResponse,
} from "next/server";
import {
  OrderStatus,
  PaymentStatus,
  Prisma,
  PrintJobType,
  ShipmentStatus,
} from "@prisma/client";

import { requireStaff } from "@/lib/auth";
import prisma from "@/lib/prisma";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

interface StaffOrderActionBody {
  action?: unknown;
}

type StaffOrderAction =
  | "SEEN"
  | "PREPARING"
  | "PACKED";

const validActions =
  new Set<StaffOrderAction>([
    "SEEN",
    "PREPARING",
    "PACKED",
  ]);

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

function isStaffOrderAction(
  value: unknown,
): value is StaffOrderAction {
  return (
    typeof value === "string" &&
    validActions.has(
      value as StaffOrderAction,
    )
  );
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext,
) {
  const authentication =
    await requireStaff(request);

  if (!authentication.authenticated) {
    return errorResponse(
      authentication.error,
      authentication.status,
    );
  }

  try {
    const { id } =
      await params;

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
      rawBody as StaffOrderActionBody;

    if (
      !isStaffOrderAction(
        body.action,
      )
    ) {
      return errorResponse(
        "Invalid Staff Order action.",
        400,
      );
    }

    const result =
      await prisma.$transaction(
        async (transaction) => {
          /*
           * Use the same per-order advisory lock
           * used by payment and shipment flows.
           *
           * Staff fulfilment progress therefore
           * cannot race another critical mutation
           * for this order.
           */
          await transaction.$executeRaw`
            SELECT pg_advisory_xact_lock(
              hashtext(${orderId})
            )
          `;

          const order =
            await transaction.order.findUnique({
              where: {
                id: orderId,
              },

              select: {
                id: true,

                status: true,
                paymentStatus: true,

                staffSeenAt: true,

                shipmentStatus: true,

                delhiveryWaybill: true,
                delhiveryShipmentId: true,
                delhiveryOrderId: true,

                printJobs: {
                  where: {
                    type:
                      PrintJobType
                        .ECOMMERCE_LABEL,
                  },

                  take: 1,

                  select: {
                    id: true,
                  },
                },
              },
            });

          if (!order) {
            return {
              ok: false as const,
              error:
                "Order not found.",
              status: 404,
            };
          }

          if (
            order.paymentStatus !==
            PaymentStatus.SUCCESS
          ) {
            return {
              ok: false as const,
              error:
                "Only successfully paid orders can be processed by Staff Orders.",
              status: 409,
            };
          }

          if (
            order.status ===
            OrderStatus.CANCELLED
          ) {
            return {
              ok: false as const,
              error:
                "Cancelled orders cannot be processed.",
              status: 409,
            };
          }

          if (
            order.printJobs.length ===
            0
          ) {
            return {
              ok: false as const,
              error:
                "This order is not part of the Staff Orders workflow.",
              status: 409,
            };
          }

          /*
           * A real shipment must not already
           * exist while Staff is changing the
           * preparation/packing state.
           */
          const hasDelhiveryShipment =
            Boolean(
              order.delhiveryWaybill
                ?.trim(),
            ) ||
            Boolean(
              order.delhiveryShipmentId
                ?.trim(),
            ) ||
            Boolean(
              order.delhiveryOrderId
                ?.trim(),
            );

          const shipmentHasStarted =
            hasDelhiveryShipment ||
            (
              order.shipmentStatus !==
                ShipmentStatus
                  .NOT_CREATED &&
              order.shipmentStatus !==
                ShipmentStatus.QUOTED
            );

          if (
            body.action === "SEEN"
          ) {
            if (order.staffSeenAt) {
              return {
                ok: true as const,

                unchanged: true,

                order: {
                  id: order.id,

                  status:
                    order.status,

                  staffSeenAt:
                    order.staffSeenAt,
                },
              };
            }

            const updatedOrder =
              await transaction.order.update({
                where: {
                  id: order.id,
                },

                data: {
                  staffSeenAt:
                    new Date(),
                },

                select: {
                  id: true,
                  status: true,
                  staffSeenAt: true,
                },
              });

            return {
              ok: true as const,
              unchanged: false,
              order:
                updatedOrder,
            };
          }

          if (shipmentHasStarted) {
            return {
              ok: false as const,
              error:
                "This order has already entered shipment fulfilment.",
              status: 409,
            };
          }

          if (
            body.action ===
            "PREPARING"
          ) {
            if (
              order.status ===
              OrderStatus.PREPARING
            ) {
              return {
                ok: true as const,

                unchanged: true,

                order: {
                  id: order.id,

                  status:
                    order.status,

                  staffSeenAt:
                    order.staffSeenAt,
                },
              };
            }

            if (
              order.status !==
              OrderStatus.PAID
            ) {
              return {
                ok: false as const,
                error:
                  "Only a paid order can be moved to Preparing.",
                status: 409,
              };
            }

            const now =
              new Date();

            const updatedOrder =
              await transaction.order.update({
                where: {
                  id: order.id,
                },

                data: {
                  status:
                    OrderStatus
                      .PREPARING,

                  staffSeenAt:
                    order.staffSeenAt ??
                    now,
                },

                select: {
                  id: true,
                  status: true,
                  staffSeenAt: true,
                },
              });

            return {
              ok: true as const,
              unchanged: false,
              order:
                updatedOrder,
            };
          }

          /*
           * PACKED is deliberately strict:
           *
           * PAID cannot skip PREPARING.
           */
          if (
            order.status ===
            OrderStatus.PACKED
          ) {
            return {
              ok: true as const,

              unchanged: true,

              order: {
                id: order.id,

                status:
                  order.status,

                staffSeenAt:
                  order.staffSeenAt,
              },
            };
          }

          if (
            order.status !==
            OrderStatus.PREPARING
          ) {
            return {
              ok: false as const,
              error:
                "Only a Preparing order can be marked Packed.",
              status: 409,
            };
          }

          const now =
            new Date();

          const updatedOrder =
            await transaction.order.update({
              where: {
                id: order.id,
              },

              data: {
                status:
                  OrderStatus.PACKED,

                staffSeenAt:
                  order.staffSeenAt ??
                  now,
              },

              select: {
                id: true,
                status: true,
                staffSeenAt: true,
              },
            });

          return {
            ok: true as const,
            unchanged: false,
            order:
              updatedOrder,
          };
        },
        {
          isolationLevel:
            Prisma
              .TransactionIsolationLevel
              .Serializable,

          maxWait: 10_000,
          timeout: 30_000,
        },
      );

    if (!result.ok) {
      return errorResponse(
        result.error,
        result.status,
      );
    }

    return NextResponse.json(
      {
        success: true,

        unchanged:
          result.unchanged,

        order: {
          ...result.order,

          staffSeenAt:
            result.order
              .staffSeenAt
              ?.toISOString() ??
            null,
        },
      },
      {
        status: 200,
        headers: noStoreHeaders(),
      },
    );
  } catch (error) {
    console.error(
      "Failed to update Staff Order:",
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
        Prisma
          .PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      return errorResponse(
        "The order changed at the same time. Please try again.",
        409,
      );
    }

    return errorResponse(
      "Failed to update Staff Order.",
      500,
    );
  }
}