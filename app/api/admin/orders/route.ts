import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      select: {
        id: true,
        customerName: true,
        phone: true,
        email: true,
        totalAmount: true,
        status: true,
        paymentStatus: true,
        createdAt: true,
        updatedAt: true,
        items: {
          select: {
            id: true,
            productId: true,
            quantity: true,
            price: true,
            createdAt: true,
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                image: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(
      orders.map((order) => ({
        ...order,
        totalAmount: Number(order.totalAmount),
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        items: order.items.map((item) => ({
          ...item,
          price: Number(item.price),
          createdAt: item.createdAt.toISOString(),
        })),
      })),
      {
        status: 200,
        headers: {
          "Cache-Control":
            "private, no-store, max-age=0",
        },
      },
    );
  } catch (error) {
    console.error(
      "Failed to load admin orders:",
      error,
    );

    return NextResponse.json(
      {
        error: "Failed to load orders.",
      },
      {
        status: 500,
      },
    );
  }
}