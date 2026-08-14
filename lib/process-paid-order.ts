import "server-only";

import {
  OrderStatus,
  PaymentStatus,
  Prisma,
  PrintJobType,
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

interface LockedVariantRow {
  id: string;
  productId: string;
  label: string;
  stock: number;
  isActive: boolean;
  productName: string;
}

interface InventoryRequirement {
  key: string;

  productId: string;
  variantId: string | null;

  quantity: number;

  productName: string;
  variantLabel: string | null;
}

interface InventoryUnavailableResult {
  unavailable: true;
  name: string;
}

interface InventoryAvailableResult {
  unavailable: false;
}

type InventoryCheckResult =
  | InventoryUnavailableResult
  | InventoryAvailableResult;

export type PaidOrderRefundReason =
  | "ORDER_CANCELLED"
  | "STOCK_UNAVAILABLE"
  | null;

export interface ProcessPaidOrderResult {
  alreadyProcessed: boolean;

  requiresRefund: boolean;
  refundReason:
    PaidOrderRefundReason;

  /*
   * Kept for compatibility with any existing
   * callers while refund handling moves to
   * requiresRefund/refundReason.
   */
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

function createInventoryKey(
  productId: string,
  variantId: string | null,
) {
  return variantId
    ? `variant:${variantId}`
    : `product:${productId}`;
}

function createInventoryDisplayName(
  productName: string,
  variantLabel: string | null,
) {
  return variantLabel
    ? `${productName} (${variantLabel})`
    : productName;
}

function aggregateInventoryRequirements(
  items: Array<{
    productId: string | null;
    variantId: string | null;
    quantity: number;

    productName: string | null;
    variantLabel: string | null;

    product: {
      name: string;
    } | null;

    variant: {
      label: string;
    } | null;
  }>,
) {
  const requirements =
    new Map<
      string,
      InventoryRequirement
    >();

  for (const item of items) {
    /*
     * Historical OrderItems may outlive their live
     * Product after an intentional permanent deletion.
     *
     * Use an empty product ID only as a sentinel for
     * inventory lookup. It cannot match a real Product,
     * so the existing stock-unavailable/refund path will
     * handle a captured payment safely.
     */
    const productId =
      item.productId ?? "";

    const key =
      createInventoryKey(
        productId,
        item.variantId,
      );

    const existing =
      requirements.get(key);

    const productName =
      item.productName?.trim() ||
      item.product?.name ||
      "Deleted product";

    const variantLabel =
      item.variantId
        ? item.variantLabel?.trim() ||
          item.variant?.label ||
          null
        : null;

    requirements.set(key, {
      key,

      productId,

      variantId:
        item.variantId,

      quantity:
        (existing?.quantity ?? 0) +
        item.quantity,

      productName:
        existing?.productName ??
        productName,

      variantLabel:
        existing?.variantLabel ??
        variantLabel,
    });
  }

  /*
   * Consistent inventory-lock order reduces
   * deadlock risk when multiple payments are
   * processing overlapping products or variants.
   */
  return Array.from(
    requirements.values(),
  ).sort((first, second) =>
    first.key.localeCompare(
      second.key,
    ),
  );
}

async function lockAndCheckInventory(
  transaction: Prisma.TransactionClient,
  requirements: InventoryRequirement[],
): Promise<InventoryCheckResult> {
  for (const requirement of requirements) {
    if (requirement.variantId) {
      const rows =
        await transaction.$queryRaw<
          LockedVariantRow[]
        >`
          SELECT
            variant."id",
            variant."productId",
            variant."label",
            variant."stock",
            variant."isActive",
            product."name" AS "productName"
          FROM "ProductVariant" AS variant
          INNER JOIN "Product" AS product
            ON product."id" =
              variant."productId"
          WHERE
            variant."id" =
              ${requirement.variantId}
            AND variant."productId" =
              ${requirement.productId}
          FOR UPDATE OF variant
        `;

      const variant =
        rows[0];

      if (
        !variant ||
        !variant.isActive ||
        variant.stock <
          requirement.quantity
      ) {
        return {
          unavailable: true,

          name:
            variant
              ? createInventoryDisplayName(
                  variant.productName,
                  variant.label,
                )
              : createInventoryDisplayName(
                  requirement.productName,
                  requirement.variantLabel,
                ),
        };
      }

      continue;
    }

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
          ${requirement.productId}
        FOR UPDATE
      `;

    const product =
      rows[0];

    if (
      !product ||
      product.stock <
        requirement.quantity
    ) {
      return {
        unavailable: true,

        name:
          product?.name ??
          requirement.productName,
      };
    }
  }

  return {
    unavailable: false,
  };
}

async function decrementInventory(
  transaction: Prisma.TransactionClient,
  requirements: InventoryRequirement[],
) {
  for (const requirement of requirements) {
    if (requirement.variantId) {
      const result =
        await transaction.productVariant.updateMany(
          {
            where: {
              id:
                requirement.variantId,

              productId:
                requirement.productId,

              isActive: true,

              stock: {
                gte:
                  requirement.quantity,
              },
            },

            data: {
              stock: {
                decrement:
                  requirement.quantity,
              },
            },
          },
        );

      if (result.count !== 1) {
        throw new Error(
          "VARIANT_STOCK_DECREMENT_FAILED",
        );
      }

      /*
       * Product.stock mirrors the default
       * variant during the transition.
       * Do not decrement it for variant sales.
       */
      continue;
    }

    const result =
      await transaction.product.updateMany(
        {
          where: {
            id:
              requirement.productId,

            stock: {
              gte:
                requirement.quantity,
            },
          },

          data: {
            stock: {
              decrement:
                requirement.quantity,
            },
          },
        },
      );

    if (result.count !== 1) {
      throw new Error(
        "PRODUCT_STOCK_DECREMENT_FAILED",
      );
    }
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
       * may arrive simultaneously.
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
                variantId: true,
                quantity: true,

                productName: true,
                variantLabel: true,

                product: {
                  select: {
                    name: true,
                  },
                },

                variant: {
                  select: {
                    label: true,
                  },
                },
              },

              orderBy: [
                {
                  productId:
                    "asc",
                },
                {
                  variantId:
                    "asc",
                },
              ],
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
       * Exact-payment idempotency.
       *
       * If the payment was already recorded and
       * the order is cancelled, it still requires
       * refund handling rather than being reported
       * as an ordinary completed payment.
       */
      if (
        order.paymentStatus ===
          PaymentStatus.SUCCESS &&
        order.razorpayPaymentId ===
          razorpayPaymentId
      ) {
        const cancelled =
          order.status ===
          OrderStatus.CANCELLED;

        return {
          alreadyProcessed: true,

          requiresRefund:
            cancelled,

          refundReason:
            cancelled
              ? "ORDER_CANCELLED"
              : null,

          stockUnavailable:
            false,

          unavailableProduct:
            null,

          order: {
            id: order.id,

            totalAmount:
              order.totalAmount,

            status:
              order.status,

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
       * CRITICAL RACE CONDITION:
       *
       * The administrator may have cancelled the
       * order after Razorpay Checkout started but
       * before Razorpay captured the payment.
       *
       * The money has already been captured by the
       * time this helper is called, so record the
       * payment reference but NEVER deduct inventory.
       */
      if (
        order.status ===
        OrderStatus.CANCELLED
      ) {
        const cancelledOrder =
          await transaction.order.update({
            where: {
              id: order.id,
            },

            data: {
              paymentStatus:
                PaymentStatus.SUCCESS,

              /*
               * Explicitly preserve CANCELLED.
               */
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
          alreadyProcessed:
            false,

          requiresRefund:
            true,

          refundReason:
            "ORDER_CANCELLED",

          stockUnavailable:
            false,

          unavailableProduct:
            null,

          order:
            cancelledOrder,
        };
      }

      const inventoryRequirements =
        aggregateInventoryRequirements(
          order.items,
        );

      /*
       * Lock and validate all required inventory
       * before modifying any stock.
       */
      const inventoryCheck =
        await lockAndCheckInventory(
          transaction,
          inventoryRequirements,
        );

      if (
        inventoryCheck.unavailable
      ) {
        /*
         * Payment is already captured, but stock
         * disappeared before finalization.
         *
         * Record payment, cancel the order and leave
         * inventory untouched. Refund processing is
         * required.
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
          alreadyProcessed:
            false,

          requiresRefund:
            true,

          refundReason:
            "STOCK_UNAVAILABLE",

          stockUnavailable:
            true,

          unavailableProduct:
            inventoryCheck.name,

          order:
            cancelledOrder,
        };
      }

      /*
       * Every inventory row is locked and has
       * sufficient stock.
       */
      await decrementInventory(
        transaction,
        inventoryRequirements,
      );

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

      /*
       * Queue the ecommerce packing label only after
       * payment and inventory finalization succeeded.
       *
       * The advisory lock serializes browser verification
       * and webhook processing for this order, while the
       * database unique constraint on (orderId, type)
       * provides final duplicate protection.
       */
      await transaction.printJob.upsert({
        where: {
          orderId_type: {
            orderId:
              updatedOrder.id,

            type:
              PrintJobType
                .ECOMMERCE_LABEL,
          },
        },

        update: {},

        create: {
          orderId:
            updatedOrder.id,

          type:
            PrintJobType
              .ECOMMERCE_LABEL,
        },
      });

      return {
        alreadyProcessed:
          false,

        requiresRefund:
          false,

        refundReason:
          null,

        stockUnavailable:
          false,

        unavailableProduct:
          null,

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
}
