import "server-only";

import {
  OrderStatus,
  PaymentStatus,
  Prisma,
} from "@prisma/client";

import prisma from "@/lib/prisma";

interface ProcessPaidOrderInput {
  websiteOrderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature?: string | null;
}

interface LockedProductRow {
  id: string;
  name: string;
  stock: number;
}

export interface ProcessPaidOrderResult {
  alreadyProcessed: boolean;
  stockUnavailable: boolean;
  unavailableProduct: string | null;

  order: {
    id: string;
    totalAmount: Prisma.Decimal;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    paymentMethod: string | null;
    razorpayOrderId: string | null;
    razorpayPaymentId: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
}

export class PaidOrderProcessingError extends Error {
  constructor(
    public readonly code:
      | "ORDER_NOT_FOUND"
      | "INVALID_PAYMENT_METHOD"
      | "RAZORPAY_ORDER_MISMATCH"
      | "ORDER_REFUNDED"
      | "DIFFERENT_PAYMENT_RECORDED",
  ) {
    super(code);
    this.name =
      "PaidOrderProcessingError";
  }
}

export async function processPaidOrder({
  websiteOrderId,
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature = null,
}: ProcessPaidOrderInput): Promise<ProcessPaidOrderResult> {
  return prisma.$transaction(
    async (transaction) => {
      /*
       * Browser verification and webhook delivery
       * can happen at almost the same time. The
       * advisory lock ensures that only one request
       * processes this website order at a time.
       */
      await transaction.$executeRaw`
        SELECT pg_advisory_xact_lock(
          hashtext(${websiteOrderId})
        )
      `;

      const order =
        await transaction.order.findUnique({
          where: {
            id: websiteOrderId,
          },

          select: {
            id: true,
            totalAmount: true,
            status: true,
            paymentStatus: true,
            paymentMethod: true,

            razorpayOrderId: true,
            razorpayPaymentId: true,

            createdAt: true,
            updatedAt: true,

            items: {
              select: {
                productId: true,
                quantity: true,

                product: {
                  select: {
                    name: true,
                  },
                },
              },

              /*
               * Lock products in a consistent order
               * to reduce deadlock risk.
               */
              orderBy: {
                productId: "asc",
              },
            },
          },
        });

      if (!order) {
        throw new PaidOrderProcessingError(
          "ORDER_NOT_FOUND",
        );
      }

      if (
        order.paymentMethod !==
        "Prepaid"
      ) {
        throw new PaidOrderProcessingError(
          "INVALID_PAYMENT_METHOD",
        );
      }

      if (
        order.razorpayOrderId !==
        razorpayOrderId
      ) {
        throw new PaidOrderProcessingError(
          "RAZORPAY_ORDER_MISMATCH",
        );
      }

      /*
       * Idempotency guard.
       *
       * Razorpay can retry webhook delivery, and
       * the browser verify call can also repeat.
       * This exact payment must never deduct stock
       * more than once.
       */
      if (
        order.paymentStatus ===
          PaymentStatus.SUCCESS &&
        order.razorpayPaymentId ===
          razorpayPaymentId
      ) {
        return {
          alreadyProcessed: true,
          stockUnavailable:
            order.status ===
            OrderStatus.CANCELLED,

          unavailableProduct: null,

          order: {
            id: order.id,
            totalAmount:
              order.totalAmount,
            status: order.status,
            paymentStatus:
              order.paymentStatus,
            paymentMethod:
              order.paymentMethod,
            razorpayOrderId:
              order.razorpayOrderId,
            razorpayPaymentId:
              order.razorpayPaymentId,
            createdAt:
              order.createdAt,
            updatedAt:
              order.updatedAt,
          },
        };
      }

      if (
        order.paymentStatus ===
        PaymentStatus.REFUNDED
      ) {
        throw new PaidOrderProcessingError(
          "ORDER_REFUNDED",
        );
      }

      if (
        order.razorpayPaymentId &&
        order.razorpayPaymentId !==
          razorpayPaymentId
      ) {
        throw new PaidOrderProcessingError(
          "DIFFERENT_PAYMENT_RECORDED",
        );
      }

      /*
       * First lock and check every product.
       * Inventory is not changed during this stage.
       */
      for (const item of order.items) {
        const rows =
          await transaction.$queryRaw<
            LockedProductRow[]
          >`
            SELECT
              "id",
              "name",
              "stock"
            FROM "Product"
            WHERE "id" =
              ${item.productId}
            FOR UPDATE
          `;

        const product = rows[0];

        if (
          !product ||
          product.stock <
            item.quantity
        ) {
          /*
           * Razorpay has already captured the money.
           * Record the payment and cancel the order
           * so it can be refunded manually or by a
           * later automated refund route.
           *
           * Because no stock has been modified yet,
           * all inventory remains unchanged.
           */
          const cancelledOrder =
            await transaction.order.update({
              where: {
                id: order.id,
              },

              data: {
                paymentStatus:
                  PaymentStatus.SUCCESS,

                status:
                  OrderStatus.CANCELLED,

                razorpayPaymentId,

                ...(razorpaySignature
                  ? {
                      razorpaySignature,
                    }
                  : {}),
              },

              select: {
                id: true,
                totalAmount: true,
                status: true,
                paymentStatus: true,
                paymentMethod: true,
                razorpayOrderId: true,
                razorpayPaymentId: true,
                createdAt: true,
                updatedAt: true,
              },
            });

          return {
            alreadyProcessed: false,
            stockUnavailable: true,

            unavailableProduct:
              product?.name ??
              item.product.name,

            order: cancelledOrder,
          };
        }
      }

      /*
       * All rows are locked and all products have
       * sufficient stock. It is now safe to deduct
       * every ordered quantity.
       */
      for (const item of order.items) {
        await transaction.product.update({
          where: {
            id: item.productId,
          },

          data: {
            stock: {
              decrement:
                item.quantity,
            },
          },
        });
      }

      const updatedOrder =
        await transaction.order.update({
          where: {
            id: order.id,
          },

          data: {
            paymentStatus:
              PaymentStatus.SUCCESS,

            status:
              order.status ===
              OrderStatus.PENDING
                ? OrderStatus.PAID
                : order.status,

            razorpayPaymentId,

            ...(razorpaySignature
              ? {
                  razorpaySignature,
                }
              : {}),
          },

          select: {
            id: true,
            totalAmount: true,
            status: true,
            paymentStatus: true,
            paymentMethod: true,
            razorpayOrderId: true,
            razorpayPaymentId: true,
            createdAt: true,
            updatedAt: true,
          },
        });

      return {
        alreadyProcessed: false,
        stockUnavailable: false,
        unavailableProduct: null,
        order: updatedOrder,
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
}