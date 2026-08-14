import {
  OrderStatus,
  PaymentStatus,
  Prisma,
  ShipmentStatus,
} from "@prisma/client";
import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  requireAdmin,
} from "@/lib/auth";
import prisma from "@/lib/prisma";

const REVENUE_MONTHS = 6;
const LOW_STOCK_THRESHOLD = 5;
const NEEDS_ATTENTION_LIMIT = 8;
const ATTENTION_SCAN_LIMIT = 75;

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

function getMonthKey(
  date: Date,
) {
  return `${date.getFullYear()}-${String(
    date.getMonth() + 1,
  ).padStart(2, "0")}`;
}

function getMonthLabel(
  date: Date,
) {
  return date.toLocaleDateString(
    "en-IN",
    {
      month: "short",
      year: "2-digit",
    },
  );
}

function normalizeNonNegativeInteger(
  value: unknown,
) {
  const number =
    Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.max(
    0,
    Math.floor(number),
  );
}

function normalizeNonNegativeNumber(
  value: unknown,
) {
  const number =
    Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.max(
    0,
    number,
  );
}

function getAgeMinutes(
  createdAt: Date,
  now: Date,
) {
  return Math.max(
    0,
    Math.floor(
      (now.getTime() -
        createdAt.getTime()) /
        60_000,
    ),
  );
}

function containsOperationalProblem(
  value: string | null,
) {
  const normalized =
    value
      ?.trim()
      .toLowerCase() ?? "";

  if (!normalized) {
    return false;
  }

  const problemTerms = [
    "bad address",
    "incomplete address",
    "failed",
    "failure",
    "not delivered",
    "undelivered",
    "cancelled",
    "canceled",
    "rto",
    "return to origin",
    "damaged",
    "lost",
    "hold",
    "exception",
  ];

  return problemTerms.some(
    (term) =>
      normalized.includes(term),
  );
}

interface AttentionCandidate {
  id: string;
  customerName: string;
  totalAmount: Prisma.Decimal;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  shipmentStatus: ShipmentStatus;
  shippingProvider: string;
  delhiveryWaybill: string | null;
  delhiveryStatus: string | null;
  shippingQuotedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

function getAttentionReason(
  order: AttentionCandidate,
  now: Date,
) {
  const ageMinutes =
    getAgeMinutes(
      order.createdAt,
      now,
    );

  if (
    order.shipmentStatus ===
      ShipmentStatus.FAILED
  ) {
    return {
      severity:
        "critical" as const,
      reason:
        "Shipment creation or delivery has failed.",
      action:
        "Open the order and review the shipment error before retrying.",
      ageMinutes,
    };
  }

  if (
    order.shipmentStatus ===
      ShipmentStatus.RTO
  ) {
    return {
      severity:
        "critical" as const,
      reason:
        "The shipment is being returned to origin.",
      action:
        "Review the courier status and contact the customer if needed.",
      ageMinutes,
    };
  }

  if (
    containsOperationalProblem(
      order.delhiveryStatus,
    )
  ) {
    return {
      severity:
        "critical" as const,
      reason:
        order.delhiveryStatus?.trim() ||
        "Delhivery reported a shipment problem.",
      action:
        "Open the order and review the latest Delhivery status.",
      ageMinutes,
    };
  }

  if (
    !order.delhiveryWaybill?.trim() &&
    (order.shipmentStatus ===
      ShipmentStatus.QUOTED ||
      order.shipmentStatus ===
        ShipmentStatus.NOT_CREATED)
  ) {
    /*
     * Give freshly paid orders a one-hour
     * fulfilment grace period. They should
     * not be treated as an operational
     * problem immediately after checkout.
     */
    if (ageMinutes < 60) {
      return null;
    }

    return {
      severity:
        "warning" as const,
      reason:
        "Paid order has been waiting for shipment creation for over one hour.",
      action:
        "Create the Delhivery shipment or review why fulfilment has not started.",
      ageMinutes,
    };
  }

  return null;
}

export async function GET(
  request: NextRequest,
) {
  try {
    const authentication =
      await requireAdmin(request);

    if (
      !authentication.authenticated
    ) {
      return errorResponse(
        authentication.error,
        authentication.status,
      );
    }

    const now =
      new Date();

    const revenueStartDate =
      new Date(
        now.getFullYear(),
        now.getMonth() -
          (REVENUE_MONTHS - 1),
        1,
      );

    /*
     * Revenue includes successfully paid
     * orders or delivered orders.
     *
     * Cancelled and refunded orders are
     * excluded.
     */
    const revenueOrderFilter:
      Prisma.OrderWhereInput =
      {
        status: {
          not:
            OrderStatus.CANCELLED,
        },

        paymentStatus: {
          not:
            PaymentStatus.REFUNDED,
        },

        OR: [
          {
            paymentStatus:
              PaymentStatus.SUCCESS,
          },
          {
            status:
              OrderStatus.DELIVERED,
          },
        ],
      };

    /*
     * Keep dashboard reads sequential. Production
     * currently uses a single Prisma connection, so
     * launching every dashboard query concurrently can
     * exhaust the connection pool and cause P2024-style
     * acquisition timeouts.
     */
    const totalOrders =
      await prisma.order.count();

    const totalProducts =
      await prisma.product.count();

    const totalCategories =
      await prisma.category.count();

    const successfulPaymentOrders =
      await prisma.order.count({
        where: {
          paymentStatus:
            PaymentStatus.SUCCESS,
        },
      });

    const pendingOrders =
      await prisma.order.count({
        where: {
          paymentStatus:
            PaymentStatus.PENDING,
        },
      });

    const deliveredOrders =
      await prisma.order.count({
        where: {
          status:
            OrderStatus.DELIVERED,
        },
      });

    const revenueResult =
      await prisma.order.aggregate({
        where:
          revenueOrderFilter,

        _sum: {
          totalAmount: true,
        },
      });

    const revenueOrders =
      await prisma.order.findMany({
        where: {
          ...revenueOrderFilter,

          createdAt: {
            gte:
              revenueStartDate,
          },
        },

        select: {
          totalAmount: true,
          createdAt: true,
        },

        orderBy: {
          createdAt: "asc",
        },
      });

    const recentOrders =
      await prisma.order.findMany({
        orderBy: {
          createdAt: "desc",
        },

        take: 5,

        select: {
          id: true,
          customerName: true,
          totalAmount: true,
          status: true,
          createdAt: true,
        },
      });

    /*
     * A product is considered low stock
     * when any active variant has 5 or
     * fewer units remaining.
     *
     * Legacy products without active
     * variants fall back to product.stock.
     */
    const lowStockProductRecords =
      await prisma.product.findMany({
        where: {
          OR: [
            {
              variants: {
                some: {
                  isActive: true,

                  stock: {
                    lte:
                      LOW_STOCK_THRESHOLD,
                  },
                },
              },
            },

            {
              AND: [
                {
                  variants: {
                    none: {
                      isActive:
                        true,
                    },
                  },
                },
                {
                  stock: {
                    lte:
                      LOW_STOCK_THRESHOLD,
                  },
                },
              ],
            },
          ],
        },

        select: {
          id: true,
          name: true,
          slug: true,
          stock: true,
          image: true,
          price: true,

          variants: {
            where: {
              isActive: true,
            },

            orderBy: [
              {
                stock: "asc",
              },
              {
                sortOrder:
                  "asc",
              },
              {
                weightGrams:
                  "asc",
              },
            ],

            select: {
              id: true,
              label: true,
              price: true,
              stock: true,
              weightGrams:
                true,
              shippingWeightGrams:
                true,
              isDefault: true,
              sortOrder: true,
            },
          },
        },
      });

    /*
     * Scan recent successful paid orders
     * that have not been cancelled or
     * refunded. Filtering into actual
     * attention items happens below so
     * Delhivery text statuses can also be
     * inspected safely.
     */
    const attentionCandidates =
      await prisma.order.findMany({
        where: {
          paymentStatus:
            PaymentStatus.SUCCESS,

          status: {
          notIn: [
            OrderStatus.CANCELLED,
            OrderStatus.DELIVERED,
          ],
        },
        },

        orderBy: {
          createdAt: "desc",
        },

        take:
          ATTENTION_SCAN_LIMIT,

        select: {
          id: true,
          customerName: true,
          totalAmount: true,
          status: true,
          paymentStatus: true,
          shipmentStatus: true,
          shippingProvider: true,
          delhiveryWaybill: true,
          delhiveryStatus: true,
          shippingQuotedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });

    /*
     * Revenue chart
     */
    const revenueByMonth =
      new Map<
        string,
        number
      >();

    for (
      const order of
      revenueOrders
    ) {
      const monthKey =
        getMonthKey(
          order.createdAt,
        );

      const currentRevenue =
        revenueByMonth.get(
          monthKey,
        ) ?? 0;

      revenueByMonth.set(
        monthKey,
        currentRevenue +
          Number(
            order.totalAmount,
          ),
      );
    }

    const revenueChart =
      Array.from(
        {
          length:
            REVENUE_MONTHS,
        },

        (_, index) => {
          const monthDate =
            new Date(
              now.getFullYear(),
              now.getMonth() -
                (REVENUE_MONTHS -
                  1) +
                index,
              1,
            );

          const monthKey =
            getMonthKey(
              monthDate,
            );

          return {
            label:
              getMonthLabel(
                monthDate,
              ),

            revenue:
              revenueByMonth.get(
                monthKey,
              ) ?? 0,
          };
        },
      );

    /*
     * Normalize recent orders.
     */
    const normalizedRecentOrders =
      recentOrders.map(
        (order) => ({
          ...order,

          totalAmount:
            Number(
              order.totalAmount,
            ),
        }),
      );

    /*
     * Normalize low-stock products.
     */
    const normalizedLowStockProducts =
      lowStockProductRecords
        .map((product) => {
          const activeVariants =
            product.variants;

          if (
            activeVariants.length ===
            0
          ) {
            return {
              id:
                product.id,

              name:
                product.name,

              slug:
                product.slug,

              image:
                product.image,

              stock:
                normalizeNonNegativeInteger(
                  product.stock,
                ),

              price:
                normalizeNonNegativeNumber(
                  product.price,
                ),

              variantId:
                null,

              variantLabel:
                null,

              variantWeightGrams:
                null,

              shippingWeightGrams:
                null,

              activeVariantCount:
                0,

              lowStockVariantCount:
                normalizeNonNegativeInteger(
                  product.stock,
                ) <=
                LOW_STOCK_THRESHOLD
                  ? 1
                  : 0,
            };
          }

          const lowStockVariants =
            activeVariants.filter(
              (variant) =>
                normalizeNonNegativeInteger(
                  variant.stock,
                ) <=
                LOW_STOCK_THRESHOLD,
            );

          const mostUrgentVariant =
            lowStockVariants[0] ??
            activeVariants[0];

          return {
            id:
              product.id,

            name:
              product.name,

            slug:
              product.slug,

            image:
              product.image,

            stock:
              normalizeNonNegativeInteger(
                mostUrgentVariant
                  .stock,
              ),

            price:
              normalizeNonNegativeNumber(
                mostUrgentVariant
                  .price,
              ),

            variantId:
              mostUrgentVariant
                .id,

            variantLabel:
              mostUrgentVariant
                .label,

            variantWeightGrams:
              normalizeNonNegativeInteger(
                mostUrgentVariant
                  .weightGrams,
              ),

            shippingWeightGrams:
              normalizeNonNegativeInteger(
                mostUrgentVariant
                  .shippingWeightGrams,
              ),

            activeVariantCount:
              activeVariants.length,

            lowStockVariantCount:
              lowStockVariants.length,
          };
        })
        .sort(
          (first, second) =>
            first.stock -
            second.stock,
        );

    const allNeedsAttention =
      attentionCandidates
        .flatMap((order) => {
          const attention =
            getAttentionReason(
              order,
              now,
            );

          if (!attention) {
            return [];
          }

          return [
            {
              id: order.id,

              customerName:
                order.customerName,

              totalAmount:
                normalizeNonNegativeNumber(
                  order.totalAmount,
                ),

              orderStatus:
                order.status,

              shipmentStatus:
                order.shipmentStatus,

              delhiveryStatus:
                order.delhiveryStatus,

              delhiveryWaybill:
                order.delhiveryWaybill,

              shippingQuotedAt:
                order.shippingQuotedAt
                  ?.toISOString() ??
                null,

              createdAt:
                order.createdAt.toISOString(),

              updatedAt:
                order.updatedAt.toISOString(),

              severity:
                attention.severity,

              reason:
                attention.reason,

              action:
                attention.action,

              ageMinutes:
                attention.ageMinutes,
            },
          ];
        })
        .sort(
          (first, second) => {
            const severityRank = {
              critical: 0,
              warning: 1,
              info: 2,
            } as const;

            const severityDifference =
              severityRank[
                first.severity
              ] -
              severityRank[
                second.severity
              ];

            if (
              severityDifference !== 0
            ) {
              return severityDifference;
            }

            return (
              second.ageMinutes -
              first.ageMinutes
            );
          },
        );

    const needsAttention =
      allNeedsAttention.slice(
        0,
        NEEDS_ATTENTION_LIMIT,
      );

    const needsAttentionOrderIds =
      allNeedsAttention.map(
        (order) => order.id,
      );

    return NextResponse.json(
      {
        totalOrders,
        totalProducts,
        totalCategories,
        successfulPaymentOrders,
        pendingOrders,
        deliveredOrders,

        revenue:
          Number(
            revenueResult
              ._sum
              .totalAmount ??
            0,
          ),

        revenueChart,

        recentOrders:
          normalizedRecentOrders,

        lowStockProducts:
          normalizedLowStockProducts,

        needsAttention,

        needsAttentionCount:
          allNeedsAttention.length,

        needsAttentionOrderIds,
      },
      {
        status: 200,
        headers:
          noStoreHeaders(),
      },
    );
  } catch (error) {
    console.error(
      "Dashboard API error:",
      error,
    );

    return errorResponse(
      "Failed to load dashboard",
      500,
    );
  }
}