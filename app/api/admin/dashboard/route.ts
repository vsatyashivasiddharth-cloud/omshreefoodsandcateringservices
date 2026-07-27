import {
  OrderStatus,
  PaymentStatus,
  Prisma,
} from "@prisma/client";
import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";

const REVENUE_MONTHS = 6;

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}`;
}

function getMonthLabel(date: Date) {
  return date.toLocaleDateString("en-IN", {
    month: "short",
    year: "2-digit",
  });
}

export async function GET() {
  try {
    const now = new Date();

    const revenueStartDate = new Date(
      now.getFullYear(),
      now.getMonth() - (REVENUE_MONTHS - 1),
      1,
    );

    /*
     * Revenue includes:
     * - successfully paid orders, or
     * - delivered orders
     *
     * Cancelled and refunded orders are excluded.
     */
    const revenueOrderFilter: Prisma.OrderWhereInput = {
      status: {
        not: OrderStatus.CANCELLED,
      },
      paymentStatus: {
        not: PaymentStatus.REFUNDED,
      },
      OR: [
        {
          paymentStatus: PaymentStatus.SUCCESS,
        },
        {
          status: OrderStatus.DELIVERED,
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
      lowStockProducts,
    ] = await Promise.all([
      prisma.order.count(),

      prisma.product.count(),

      prisma.category.count(),

      prisma.order.count({
        where: {
          status: OrderStatus.PENDING,
        },
      }),

      prisma.order.count({
        where: {
          status: OrderStatus.DELIVERED,
        },
      }),

      prisma.order.aggregate({
        where: revenueOrderFilter,
        _sum: {
          totalAmount: true,
        },
      }),

      prisma.order.findMany({
        where: {
          ...revenueOrderFilter,
          createdAt: {
            gte: revenueStartDate,
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

      prisma.product.findMany({
        where: {
          stock: {
            lte: 5,
          },
        },
        orderBy: {
          stock: "asc",
        },
        select: {
          id: true,
          name: true,
          slug: true,
          stock: true,
          image: true,
          price: true,
        },
      }),
    ]);

    const revenueByMonth = new Map<string, number>();

    for (const order of revenueOrders) {
      const monthKey = getMonthKey(order.createdAt);
      const currentRevenue = revenueByMonth.get(monthKey) ?? 0;

      revenueByMonth.set(
        monthKey,
        currentRevenue + Number(order.totalAmount),
      );
    }

    const revenueChart = Array.from(
      {
        length: REVENUE_MONTHS,
      },
      (_, index) => {
        const monthDate = new Date(
          now.getFullYear(),
          now.getMonth() - (REVENUE_MONTHS - 1) + index,
          1,
        );

        const monthKey = getMonthKey(monthDate);

        return {
          label: getMonthLabel(monthDate),
          revenue: revenueByMonth.get(monthKey) ?? 0,
        };
      },
    );

    const normalizedRecentOrders = recentOrders.map((order) => ({
      ...order,
      totalAmount: Number(order.totalAmount),
    }));

    const normalizedLowStockProducts = lowStockProducts.map(
      (product) => ({
        ...product,
        price: Number(product.price),
      }),
    );

    return NextResponse.json({
      totalOrders,
      totalProducts,
      totalCategories,
      pendingOrders,
      deliveredOrders,
      revenue: Number(revenueResult._sum.totalAmount ?? 0),
      revenueChart,
      recentOrders: normalizedRecentOrders,
      lowStockProducts: normalizedLowStockProducts,
    });
  } catch (error) {
    console.error("Dashboard API error:", error);

    return NextResponse.json(
      {
        error: "Failed to load dashboard",
      },
      {
        status: 500,
      },
    );
  }
}