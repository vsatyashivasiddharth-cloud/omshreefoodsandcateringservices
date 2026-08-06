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
    productId: string;
    variantId: string | null;
    quantity: number;

    productName: string | null;
    variantLabel: string | null;

    product: {
      name: string;
    };

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
    const key =
      createInventoryKey(
        item.productId,
        item.variantId,
      );

    const existing =
      requirements.get(key);

    const productName =
      item.productName?.trim() ||
      item.product.name;

    const variantLabel =
      item.variantId
        ? item.variantLabel?.trim() ||
          item.variant?.label ||
          null
        : null;

    requirements.set(key, {
      key,

      productId:
        item.productId,

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

      const variant = rows[0];

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

    const product = rows[0];

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

      /*
       * The rows were already locked and checked.
       * A zero count therefore indicates an
       * unexpected state change or deleted row.
       */
      if (result.count !== 1) {
        throw new Error(
          "VARIANT_STOCK_DECREMENT_FAILED",
        );
      }

      /*
       * Product.price, Product.stock and
       * Product.shippingWeightGrams mirror the
       * default variant during the transition.
       *
       * Do not decrement Product.stock here.
       * Doing so would double-count a variant sale.
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
       * can happen at almost the same time.
       *
       * The transaction-level advisory lock ensures
       * that only one request processes this website
       * order at a time.
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

              /*
               * This order is deterministic before
               * inventory requirements are aggregated
               * and sorted by inventory-row key.
               */
              orderBy: [
                {
                  productId: "asc",
                },
                {
                  variantId: "asc",
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
       * Exact-payment idempotency guard.
       *
       * Razorpay can retry webhook delivery and
       * the browser verification endpoint can also
       * be called more than once.
       *
       * This payment must never deduct inventory
       * more than one time.
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
            id:
              order.id,

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

      const inventoryRequirements =
        aggregateInventoryRequirements(
          order.items,
        );

      /*
       * Lock and validate every required inventory
       * row before modifying any stock.
       *
       * Variant order lines lock ProductVariant.
       * Legacy order lines lock Product.
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
         * Razorpay has already captured the money.
         *
         * Record the successful payment and cancel
         * the order so it can be refunded manually
         * or by a future automated refund process.
         *
         * No inventory has been changed at this
         * point, so every stock row remains intact.
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
            inventoryCheck.name,

          order:
            cancelledOrder,
        };
      }

      /*
       * Every inventory row is now locked and has
       * enough stock. Deduct all requirements.
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

      return {
        alreadyProcessed: false,
        stockUnavailable: false,
        unavailableProduct: null,

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