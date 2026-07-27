import {
  NextRequest,
  NextResponse,
} from "next/server";
import {
  OrderStatus,
  Prisma,
} from "@prisma/client";

import prisma from "@/lib/prisma";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

interface UpdateOrderStatusBody {
  status?: unknown;
}

const validStatuses = new Set<OrderStatus>(
  Object.values(OrderStatus),
);

function isOrderStatus(
  value: unknown,
): value is OrderStatus {
  return (
    typeof value === "string" &&
    validStatuses.has(value as OrderStatus)
  );
}

export async function PATCH(
  request: NextRequest,
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

    const body =
      (await request.json()) as UpdateOrderStatusBody;

    if (!isOrderStatus(body.status)) {
      return NextResponse.json(
        {
          error: "Invalid order status.",
        },
        {
          status: 400,
        },
      );
    }

    const existingOrder =
      await prisma.order.findUnique({
        where: {
          id: orderId,
        },
        select: {
          id: true,
          status: true,
        },
      });

    if (!existingOrder) {
      return NextResponse.json(
        {
          error: "Order not found.",
        },
        {
          status: 404,
        },
      );
    }

    const order = await prisma.order.update({
      where: {
        id: orderId,
      },
      data: {
        status: body.status,
      },
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      {
        ...order,
        updatedAt:
          order.updatedAt.toISOString(),
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
      "Failed to update order status:",
      error,
    );

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          error: "Invalid request body.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
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
        error: "Failed to update order.",
      },
      {
        status: 500,
      },
    );
  }
}