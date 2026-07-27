import {
  NextResponse,
} from "next/server";

import prisma from "@/lib/prisma";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const { id } = await params;
    const orderId = id.trim();

    if (!orderId) {
      return NextResponse.json(
        {
          error: "Order ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    const order =
      await prisma.order.findUnique({
        where: {
          id: orderId,
        },
        select: {
          id: true,
          customerName: true,
          phone: true,
          email: true,
          address: true,
          city: true,
          state: true,
          pincode: true,
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
                  price: true,
                },
              },
            },
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      });

    if (!order) {
      return NextResponse.json(
        {
          error: "Order not found.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(
      {
        ...order,
        totalAmount: Number(
          order.totalAmount,
        ),
        createdAt:
          order.createdAt.toISOString(),
        updatedAt:
          order.updatedAt.toISOString(),
        items: order.items.map(
          (item) => ({
            ...item,
            price: Number(item.price),
            createdAt:
              item.createdAt.toISOString(),
            product: {
              ...item.product,
              price: Number(
                item.product.price,
              ),
            },
          }),
        ),
      },
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
      "Failed to load admin order details:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Failed to load order details.",
      },
      {
        status: 500,
      },
    );
  }
}