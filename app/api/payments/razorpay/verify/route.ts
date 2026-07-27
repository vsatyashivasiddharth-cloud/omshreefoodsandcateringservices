import {
  NextRequest,
  NextResponse,
} from "next/server";
import {
  createHmac,
  timingSafeEqual,
} from "node:crypto";
import {
  OrderStatus,
  PaymentStatus,
  Prisma,
} from "@prisma/client";

import prisma from "@/lib/prisma";
import {
  getRazorpayClient,
  rupeesToPaise,
} from "@/lib/razorpay";

interface VerifyPaymentBody {
  websiteOrderId?: unknown;
  razorpayOrderId?: unknown;
  razorpayPaymentId?: unknown;
  razorpaySignature?: unknown;
}

interface RazorpayPaymentDetails {
  id?: unknown;
  order_id?: unknown;
  amount?: unknown;
  currency?: unknown;
  status?: unknown;
  captured?: unknown;
}

interface LockedProductRow {
  id: string;
  name: string;
  stock: number;
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

function getRequiredString(
  value: unknown,
) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function getRazorpaySecret() {
  const secret =
    process.env
      .RAZORPAY_KEY_SECRET
      ?.trim();

  if (!secret) {
    throw new Error(
      "Missing required environment variable: RAZORPAY_KEY_SECRET",
    );
  }

  return secret;
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
  additionalData?: Record<
    string,
    unknown
  >,
) {
  return NextResponse.json(
    {
      error,
      ...additionalData,
    },
    {
      status,
      headers: noStoreHeaders(),
    },
  );
}

function verifySignature({
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
}: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}) {
  const expectedSignature =
    createHmac(
      "sha256",
      getRazorpaySecret(),
    )
      .update(
        `${razorpayOrderId}|${razorpayPaymentId}`,
      )
      .digest("hex");

  const expectedBuffer =
    Buffer.from(
      expectedSignature,
      "utf8",
    );

  const receivedBuffer =
    Buffer.from(
      razorpaySignature,
      "utf8",
    );

  if (
    expectedBuffer.length !==
    receivedBuffer.length
  ) {
    return false;
  }

  return timingSafeEqual(
    expectedBuffer,
    receivedBuffer,
  );
}

function getPaymentString(
  value: unknown,
) {
  return typeof value === "string"
    ? value
    : "";
}

function getPaymentNumber(
  value: unknown,
) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}

function isCapturedPayment(
  payment: RazorpayPaymentDetails,
) {
  return (
    payment.status === "captured" &&
    payment.captured === true
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
      rawBody as VerifyPaymentBody;

    const websiteOrderId =
      getRequiredString(
        body.websiteOrderId,
      );

    const razorpayOrderId =
      getRequiredString(
        body.razorpayOrderId,
      );

    const razorpayPaymentId =
      getRequiredString(
        body.razorpayPaymentId,
      );

    const razorpaySignature =
      getRequiredString(
        body.razorpaySignature,
      );

    if (
      !websiteOrderId ||
      !razorpayOrderId ||
      !razorpayPaymentId ||
      !razorpaySignature
    ) {
      return errorResponse(
        "Incomplete payment verification details.",
        400,
      );
    }

    if (
      websiteOrderId.length > 100 ||
      razorpayOrderId.length > 100 ||
      razorpayPaymentId.length >
        100 ||
      razorpaySignature.length >
        500
    ) {
      return errorResponse(
        "Invalid payment verification details.",
        400,
      );
    }

    /*
     * Load the expected order details before making
     * a request to the external payment provider.
     */
    const existingOrder =
      await prisma.order.findUnique({
        where: {
          id: websiteOrderId,
        },

        select: {
          id: true,
          totalAmount: true,
          paymentMethod: true,
          paymentStatus: true,
          status: true,

          razorpayOrderId: true,
          razorpayPaymentId: true,

          createdAt: true,
          updatedAt: true,
        },
      });

    if (!existingOrder) {
      return errorResponse(
        "Order not found.",
        404,
      );
    }

    if (
      existingOrder.paymentMethod !==
      "Prepaid"
    ) {
      return errorResponse(
        "This order is not configured for online payment.",
        409,
      );
    }

    if (
      !existingOrder.razorpayOrderId
    ) {
      return errorResponse(
        "A payment order has not been created for this order.",
        409,
      );
    }

    if (
      razorpayOrderId !==
      existingOrder.razorpayOrderId
    ) {
      return errorResponse(
        "The payment does not belong to this order.",
        400,
      );
    }

    /*
     * Return safely when this exact payment was
     * already processed. Stock must not be deducted
     * a second time.
     */
    if (
      existingOrder.paymentStatus ===
        PaymentStatus.SUCCESS &&
      existingOrder
        .razorpayPaymentId ===
        razorpayPaymentId
    ) {
      return NextResponse.json(
        {
          success: true,
          alreadyVerified: true,

          message:
            existingOrder.status ===
            OrderStatus.CANCELLED
              ? "The payment was recorded, but the order was cancelled."
              : "Payment was already verified.",

          order: {
            id:
              existingOrder.id,

            totalAmount: Number(
              existingOrder.totalAmount,
            ),

            status:
              existingOrder.status,

            paymentStatus:
              existingOrder
                .paymentStatus,

            paymentMethod:
              existingOrder
                .paymentMethod,

            paymentReference:
              existingOrder
                .razorpayPaymentId,

            createdAt:
              existingOrder
                .createdAt
                .toISOString(),

            updatedAt:
              existingOrder
                .updatedAt
                .toISOString(),
          },
        },
        {
          status: 200,
          headers: noStoreHeaders(),
        },
      );
    }

    if (
      existingOrder.paymentStatus ===
      PaymentStatus.REFUNDED
    ) {
      return errorResponse(
        "This order has already been refunded.",
        409,
      );
    }

    if (
      existingOrder
        .razorpayPaymentId &&
      existingOrder
        .razorpayPaymentId !==
        razorpayPaymentId
    ) {
      return errorResponse(
        "A different payment has already been recorded for this order.",
        409,
      );
    }

    const signatureIsValid =
      verifySignature({
        razorpayOrderId:
          existingOrder
            .razorpayOrderId,

        razorpayPaymentId,

        razorpaySignature,
      });

    if (!signatureIsValid) {
      return errorResponse(
        "Payment verification failed.",
        400,
      );
    }

    const razorpay =
      getRazorpayClient();

    const fetchedPayment =
      (await razorpay.payments.fetch(
        razorpayPaymentId,
      )) as RazorpayPaymentDetails;

    const fetchedPaymentId =
      getPaymentString(
        fetchedPayment.id,
      );

    const fetchedOrderId =
      getPaymentString(
        fetchedPayment.order_id,
      );

    const fetchedCurrency =
      getPaymentString(
        fetchedPayment.currency,
      ).toUpperCase();

    const fetchedAmount =
      getPaymentNumber(
        fetchedPayment.amount,
      );

    if (
      fetchedPaymentId !==
      razorpayPaymentId
    ) {
      return errorResponse(
        "The payment reference could not be verified.",
        400,
      );
    }

    if (
      fetchedOrderId !==
      existingOrder
        .razorpayOrderId
    ) {
      return errorResponse(
        "The payment does not belong to this order.",
        400,
      );
    }

    const expectedAmountInPaise =
      rupeesToPaise(
        Number(
          existingOrder.totalAmount,
        ),
      );

    if (
      fetchedAmount !==
      expectedAmountInPaise
    ) {
      return errorResponse(
        "The paid amount does not match the order total.",
        400,
      );
    }

    if (
      fetchedCurrency !== "INR"
    ) {
      return errorResponse(
        "The payment currency is invalid.",
        400,
      );
    }

    if (
      !isCapturedPayment(
        fetchedPayment,
      )
    ) {
      return errorResponse(
        "The payment has not been captured yet. Please wait and try again.",
        409,
      );
    }

    /*
     * Razorpay has confirmed the captured payment.
     * Lock the order and every product, validate all
     * inventory, deduct stock, and mark the order
     * paid in one database transaction.
     */
    const result =
      await prisma.$transaction(
        async (transaction) => {
          await transaction
            .$executeRaw`
              SELECT pg_advisory_xact_lock(
                hashtext(
                  ${websiteOrderId}
                )
              )
            `;

          const order =
            await transaction.order
              .findUnique({
                where: {
                  id: websiteOrderId,
                },

                select: {
                  id: true,
                  totalAmount: true,
                  paymentMethod: true,
                  paymentStatus: true,
                  status: true,

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

                    orderBy: {
                      productId: "asc",
                    },
                  },
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
            order.razorpayOrderId !==
            razorpayOrderId
          ) {
            throw new Error(
              "RAZORPAY_ORDER_MISMATCH",
            );
          }

          /*
           * Idempotency check inside the locked
           * transaction.
           */
          if (
            order.paymentStatus ===
              PaymentStatus.SUCCESS &&
            order
              .razorpayPaymentId ===
              razorpayPaymentId
          ) {
            return {
              alreadyVerified: true,
              stockUnavailable: false,
              unavailableProduct:
                null,
              order,
            };
          }

          if (
            order.paymentStatus ===
            PaymentStatus.REFUNDED
          ) {
            throw new Error(
              "ORDER_REFUNDED",
            );
          }

          if (
            order.razorpayPaymentId &&
            order.razorpayPaymentId !==
              razorpayPaymentId
          ) {
            throw new Error(
              "DIFFERENT_PAYMENT_RECORDED",
            );
          }

          /*
           * Lock products in a stable order to reduce
           * the risk of deadlocks when several orders
           * are being paid simultaneously.
           */
          for (
            const item of order.items
          ) {
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

            const product =
              rows[0];

            if (
              !product ||
              product.stock <
                item.quantity
            ) {
              /*
               * The payment has already been captured.
               * Record it so it is never lost, cancel
               * the order, and leave inventory
               * unchanged for all items.
               */
              const cancelledOrder =
                await transaction.order
                  .update({
                    where: {
                      id: order.id,
                    },

                    data: {
                      paymentStatus:
                        PaymentStatus.SUCCESS,

                      status:
                        OrderStatus.CANCELLED,

                      razorpayPaymentId,

                      razorpaySignature,
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
                alreadyVerified:
                  false,

                stockUnavailable:
                  true,

                unavailableProduct:
                  product?.name ??
                  item.product.name,

                order:
                  cancelledOrder,
              };
            }
          }

          /*
           * Every product exists, has enough stock,
           * and remains locked. It is now safe to
           * deduct all quantities.
           */
          for (
            const item of order.items
          ) {
            await transaction.product
              .update({
                where: {
                  id:
                    item.productId,
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
            await transaction.order
              .update({
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

                  razorpaySignature,
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
            alreadyVerified: false,
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

    if (result.stockUnavailable) {
      return errorResponse(
        `${result.unavailableProduct ?? "A product"} became unavailable after payment. Your payment was recorded and the order was cancelled for refund processing. Please contact support.`,
        409,
        {
          paymentCaptured: true,

          order: {
            id: result.order.id,

            status:
              result.order.status,

            paymentStatus:
              result.order
                .paymentStatus,

            paymentReference:
              result.order
                .razorpayPaymentId,
          },
        },
      );
    }

    return NextResponse.json(
      {
        success: true,

        alreadyVerified:
          result.alreadyVerified,

        message:
          result.alreadyVerified
            ? "Payment was already verified."
            : "Payment verified successfully.",

        order: {
          id: result.order.id,

          totalAmount: Number(
            result.order.totalAmount,
          ),

          status:
            result.order.status,

          paymentStatus:
            result.order.paymentStatus,

          paymentMethod:
            result.order.paymentMethod,

          paymentReference:
            result.order
              .razorpayPaymentId,

          createdAt:
            result.order
              .createdAt
              .toISOString(),

          updatedAt:
            result.order
              .updatedAt
              .toISOString(),
        },
      },
      {
        status:
          result.alreadyVerified
            ? 200
            : 201,

        headers: noStoreHeaders(),
      },
    );
  } catch (error) {
    console.error(
      "Razorpay payment verification failed:",
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
            "This order is not configured for online payment.",
            409,
          );

        case "RAZORPAY_ORDER_NOT_CREATED":
          return errorResponse(
            "A payment order has not been created for this order.",
            409,
          );

        case "RAZORPAY_ORDER_MISMATCH":
        case "PAYMENT_ORDER_MISMATCH":
          return errorResponse(
            "The payment does not belong to this order.",
            400,
          );

        case "ORDER_REFUNDED":
          return errorResponse(
            "This order has already been refunded.",
            409,
          );

        case "DIFFERENT_PAYMENT_RECORDED":
          return errorResponse(
            "A different payment has already been recorded for this order.",
            409,
          );

        case "INVALID_PAYMENT_SIGNATURE":
          return errorResponse(
            "Payment verification failed.",
            400,
          );

        case "PAYMENT_ID_MISMATCH":
          return errorResponse(
            "The payment reference could not be verified.",
            400,
          );

        case "PAYMENT_AMOUNT_MISMATCH":
          return errorResponse(
            "The paid amount does not match the order total.",
            400,
          );

        case "PAYMENT_CURRENCY_MISMATCH":
          return errorResponse(
            "The payment currency is invalid.",
            400,
          );

        case "PAYMENT_NOT_CAPTURED":
          return errorResponse(
            "The payment has not been captured yet. Please wait and try again.",
            409,
          );
      }
    }

    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      return errorResponse(
        "Payment verification conflicted with another request. Please try again.",
        409,
      );
    }

    return errorResponse(
      "Unable to verify the payment.",
      500,
    );
  }
}