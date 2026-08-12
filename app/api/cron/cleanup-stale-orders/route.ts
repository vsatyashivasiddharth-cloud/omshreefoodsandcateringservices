import {
  NextRequest,
  NextResponse,
} from "next/server";
import {
  OrderStatus,
  PaymentStatus,
  Prisma,
  ShipmentStatus,
} from "@prisma/client";

import prisma from "@/lib/prisma";

const RETENTION_HOURS = 24;
const MAX_ORDERS_PER_RUN = 100;

function noStoreHeaders() {
  return {
    "Cache-Control":
      "private, no-store, max-age=0",
    Pragma: "no-cache",
    Expires: "0",
  };
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

export async function GET(
  request: NextRequest,
) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        error: "Unauthorized.",
      },
      {
        status: 401,
        headers:
          noStoreHeaders(),
      },
    );
  }

  try {
    const deleteBefore =
      new Date(
        Date.now() -
          RETENTION_HOURS *
            60 *
            60 *
            1000,
      );

    /*
     * This initial query only finds likely
     * cleanup candidates.
     *
     * Every candidate is locked and checked
     * again immediately before deletion.
     */
    const candidates =
      await prisma.order.findMany({
        where: {
          createdAt: {
            lt: deleteBefore,
          },

          status: {
            in: [
              OrderStatus.PENDING,
              OrderStatus.CANCELLED,
            ],
          },

          paymentStatus: {
            in: [
              PaymentStatus.PENDING,
              PaymentStatus.FAILED,
            ],
          },

          razorpayOrderId: null,
          razorpayPaymentId: null,
          razorpaySignature: null,

          shipmentStatus: {
            in: [
              ShipmentStatus.NOT_CREATED,
              ShipmentStatus.QUOTED,
            ],
          },

          delhiveryWaybill: null,
          delhiveryShipmentId: null,
          delhiveryOrderId: null,
        },

        select: {
          id: true,
        },

        orderBy: {
          createdAt: "asc",
        },

        take:
          MAX_ORDERS_PER_RUN,
      });

    let deletedCount = 0;
    let skippedCount = 0;

    for (
      const candidate of
      candidates
    ) {
      const deleted =
        await prisma.$transaction(
          async (transaction) => {
            /*
             * Razorpay payment creation,
             * paid-order processing and
             * shipment creation use this
             * same per-order advisory lock.
             *
             * Rechecking after acquiring the
             * lock prevents cleanup from racing
             * with any of those workflows.
             */
            await transaction.$executeRaw`
              SELECT pg_advisory_xact_lock(
                hashtext(${candidate.id})
              )
            `;

            const order =
              await transaction.order.findUnique({
                where: {
                  id:
                    candidate.id,
                },

                select: {
                  id: true,
                  createdAt: true,

                  status: true,
                  paymentStatus: true,

                  razorpayOrderId: true,
                  razorpayPaymentId: true,
                  razorpaySignature: true,

                  shipmentStatus: true,

                  delhiveryWaybill: true,
                  delhiveryShipmentId: true,
                  delhiveryOrderId: true,
                },
              });

            if (!order) {
              return false;
            }

            const oldEnough =
              order.createdAt <
              deleteBefore;

            const removableOrderStatus =
              order.status ===
                OrderStatus.PENDING ||
              order.status ===
                OrderStatus.CANCELLED;

            const removablePaymentStatus =
              order.paymentStatus ===
                PaymentStatus.PENDING ||
              order.paymentStatus ===
                PaymentStatus.FAILED;

            const hasStartedPayment =
              Boolean(
                order.razorpayOrderId,
              ) ||
              Boolean(
                order.razorpayPaymentId,
              ) ||
              Boolean(
                order.razorpaySignature,
              );

            const removableShipmentStatus =
              order.shipmentStatus ===
                ShipmentStatus.NOT_CREATED ||
              order.shipmentStatus ===
                ShipmentStatus.QUOTED;

            const hasCreatedShipment =
              Boolean(
                order.delhiveryWaybill,
              ) ||
              Boolean(
                order.delhiveryShipmentId,
              ) ||
              Boolean(
                order.delhiveryOrderId,
              );

            if (
              !oldEnough ||
              !removableOrderStatus ||
              !removablePaymentStatus ||
              hasStartedPayment ||
              !removableShipmentStatus ||
              hasCreatedShipment
            ) {
              return false;
            }

            await transaction.order.delete({
              where: {
                id:
                  order.id,
              },
            });

            return true;
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

      if (deleted) {
        deletedCount += 1;
      } else {
        skippedCount += 1;
      }
    }

    return NextResponse.json(
      {
        success: true,

        candidates:
          candidates.length,

        deleted:
          deletedCount,

        skipped:
          skippedCount,

        deleteBefore:
          deleteBefore.toISOString(),

        retentionHours:
          RETENTION_HOURS,

        maxOrdersPerRun:
          MAX_ORDERS_PER_RUN,

        completedAt:
          new Date().toISOString(),
      },
      {
        status: 200,
        headers:
          noStoreHeaders(),
      },
    );
  } catch (error) {
    console.error(
      "Stale order cleanup failed:",
      error,
    );

    return NextResponse.json(
      {
        success: false,

        error:
          "Unable to clean stale orders.",
      },
      {
        status: 500,
        headers:
          noStoreHeaders(),
      },
    );
  }
}
