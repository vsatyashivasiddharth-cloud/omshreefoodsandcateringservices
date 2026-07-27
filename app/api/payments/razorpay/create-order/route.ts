import {
  NextRequest,
  NextResponse,
} from "next/server";
import {
  PaymentStatus,
  Prisma,
} from "@prisma/client";

import prisma from "@/lib/prisma";
import {
  getRazorpayClient,
  getRazorpayPublicKey,
  rupeesToPaise,
} from "@/lib/razorpay";

interface CreatePaymentOrderBody {
  orderId?: unknown;
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
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
      headers: noStoreHeaders(),
    },
  );
}

export async function POST(
  request: NextRequest,
) {
  try {
    const rawBody: unknown =
      await request.json();

    if (!isRecord(rawBody)) {
      return errorResponse(
        "Invalid request body.",
        400,
      );
    }

    const body =
      rawBody as CreatePaymentOrderBody;

    const orderId =
      typeof body.orderId === "string"
        ? body.orderId.trim()
        : "";

    if (!orderId) {
      return errorResponse(
        "Order ID is required.",
        400,
      );
    }

    const result =
      await prisma.$transaction(
        async (transaction) => {
          await transaction.$executeRaw`
            SELECT pg_advisory_xact_lock(
              hashtext(${orderId})
            )
          `;

          const order =
            await transaction.order.findUnique({
              where: {
                id: orderId,
              },
              select: {
                id: true,
                customerName: true,
                phone: true,
                email: true,
                totalAmount: true,
                paymentMethod: true,
                paymentStatus: true,
                razorpayOrderId: true,
                razorpayPaymentId: true,
                createdAt: true,
              },
            });

          if (!order) {
            throw new Error(
              "ORDER_NOT_FOUND",
            );
          }

          if (
            order.paymentMethod !==
            "Prepaid"
          ) {
            throw new Error(
              "INVALID_PAYMENT_METHOD",
            );
          }

          if (
            order.paymentStatus ===
            PaymentStatus.SUCCESS
          ) {
            throw new Error(
              "ORDER_ALREADY_PAID",
            );
          }

          if (
            order.paymentStatus ===
            PaymentStatus.REFUNDED
          ) {
            throw new Error(
              "ORDER_REFUNDED",
            );
          }

          const totalAmount =
            Number(order.totalAmount);

          if (
            !Number.isFinite(
              totalAmount,
            ) ||
            totalAmount <= 0
          ) {
            throw new Error(
              "INVALID_ORDER_TOTAL",
            );
          }

          const amountInPaise =
            rupeesToPaise(
              totalAmount,
            );

          if (order.razorpayOrderId) {
            return {
              reused: true,
              order,
              amountInPaise,
              razorpayOrderId:
                order.razorpayOrderId,
            };
          }

          const razorpay =
            getRazorpayClient();

          const razorpayOrder =
            await razorpay.orders.create({
              amount: amountInPaise,
              currency: "INR",

              receipt:
                order.id.slice(0, 40),

              partial_payment: false,

              notes: {
                websiteOrderId:
                  order.id,

                customerName:
                  order.customerName.slice(
                    0,
                    256,
                  ),
              },
            });

          if (
            !razorpayOrder.id ||
            typeof razorpayOrder.id !==
              "string"
          ) {
            throw new Error(
              "INVALID_RAZORPAY_ORDER",
            );
          }

          const updatedOrder =
            await transaction.order.update({
              where: {
                id: order.id,
              },
              data: {
                razorpayOrderId:
                  razorpayOrder.id,

                paymentStatus:
                  PaymentStatus.PENDING,
              },
              select: {
                id: true,
                customerName: true,
                phone: true,
                email: true,
                totalAmount: true,
                paymentMethod: true,
                paymentStatus: true,
                razorpayOrderId: true,
                razorpayPaymentId: true,
                createdAt: true,
              },
            });

          return {
            reused: false,
            order: updatedOrder,
            amountInPaise,
            razorpayOrderId:
              razorpayOrder.id,
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

    return NextResponse.json(
      {
        success: true,

        reused:
          result.reused,

        keyId:
          getRazorpayPublicKey(),

        razorpayOrderId:
          result.razorpayOrderId,

        websiteOrderId:
          result.order.id,

        amount:
          result.amountInPaise,

        amountRupees: Number(
          result.order.totalAmount,
        ),

        currency: "INR",

        customer: {
          name:
            result.order.customerName,

          phone:
            result.order.phone,

          email:
            result.order.email,
        },

        description:
          "Order payment",
      },
      {
        status:
          result.reused ? 200 : 201,

        headers: noStoreHeaders(),
      },
    );
  } catch (error) {
    console.error(
      "Razorpay order creation failed:",
      error,
    );

    if (
      error instanceof SyntaxError
    ) {
      return errorResponse(
        "Invalid JSON request body.",
        400,
      );
    }

    if (error instanceof Error) {
      switch (error.message) {
        case "ORDER_NOT_FOUND":
          return errorResponse(
            "Order not found.",
            404,
          );

        case "INVALID_PAYMENT_METHOD":
          return errorResponse(
            "Only prepaid orders can be paid online.",
            409,
          );

        case "ORDER_ALREADY_PAID":
          return errorResponse(
            "This order has already been paid.",
            409,
          );

        case "ORDER_REFUNDED":
          return errorResponse(
            "A payment cannot be started for a refunded order.",
            409,
          );

        case "INVALID_ORDER_TOTAL":
          return errorResponse(
            "The order total is invalid.",
            422,
          );

        case "INVALID_RAZORPAY_ORDER":
          return errorResponse(
            "The payment provider returned an invalid order response.",
            502,
          );
      }
    }

    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      return errorResponse(
        "Payment creation conflicted with another request. Please try again.",
        409,
      );
    }

    return errorResponse(
      "Unable to start the payment.",
      500,
    );
  }
}