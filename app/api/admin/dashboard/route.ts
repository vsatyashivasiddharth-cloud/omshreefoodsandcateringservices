import {
  OrderStatus,
  PaymentStatus,
  Prisma,
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

export async function GET(
  request: NextRequest,
) {
  try {
    /*
     * Protect the dashboard API independently
     * from the /admin page-level proxy.
     *
     * This prevents someone from requesting
     * /api/admin/dashboard directly without
     * a valid administrator session.
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
     * Revenue includes:
     * - successfully paid orders, or
     * - delivered orders
     *
     * Cancelled and refunded orders
     * are excluded.
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

    const [
      totalOrders,
      totalProducts,
      totalCategories,
      pendingOrders,
      deliveredOrders,
      revenueResult,
      revenueOrders,
      recentOrders,
      lowStockProductRecords,
    ] =
      await Promise.all([
        prisma.order.count(),

        prisma.product.count(),

        prisma.category.count(),

        prisma.order.count({
          where: {
            status:
              OrderStatus.PENDING,
          },
        }),

        prisma.order.count({
          where: {
            status:
              OrderStatus.DELIVERED,
          },
        }),

        prisma.order.aggregate({
          where:
            revenueOrderFilter,

          _sum: {
            totalAmount: true,
          },
        }),

        prisma.order.findMany({
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
        }),

        prisma.order.findMany({
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
        }),

        /*
         * A product is considered
         * low stock when ANY ACTIVE
         * variant has 5 or fewer
         * units remaining.
         *
         * Legacy products without
         * active variants fall back
         * to product.stock.
         */
        prisma.product.findMany({
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
        }),
      ]);

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
     * Normalize recent orders
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
     *
     * Keep the existing dashboard
     * response fields:
     * id, name, slug, stock,
     * image and price.
     *
     * For products with variants,
     * stock/price represent the
     * active variant with the
     * LOWEST stock.
     *
     * Extra variant fields are also
     * returned so DashboardContent
     * can display them without
     * another API change.
     */
    const normalizedLowStockProducts =
      lowStockProductRecords
        .map((product) => {
          const activeVariants =
            product.variants;

          /*
           * Legacy product with no active
           * ProductVariant records.
           */
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

          /*
           * Query ordering puts the
           * lowest-stock active
           * variant first.
           */
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
              mostUrgentVariant.id,

            variantLabel:
              mostUrgentVariant.label,

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

    return NextResponse.json(
      {
        totalOrders,
        totalProducts,
        totalCategories,
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
      "Failed to load dashboard.",
      500,
    );
  }
}