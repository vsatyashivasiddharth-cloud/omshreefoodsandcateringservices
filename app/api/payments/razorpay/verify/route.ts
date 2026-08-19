import {
  createHmac,
  timingSafeEqual,
} from "node:crypto";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  CouponRedemptionStatus,
  OrderStatus,
  PaymentStatus,
  Prisma,
} from "@prisma/client";

import prisma from "@/lib/prisma";

import {
  PaidOrderProcessingError,
  processPaidOrder,
} from "@/lib/process-paid-order";

import {
  sendStaffNewOrderPush,
} from "@/lib/staff-push";

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

function isRecord(
  value: unknown,
): value is Record<
  string,
  unknown
> {
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
      "RAZORPAY_KEY_SECRET_NOT_CONFIGURED",
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
      headers:
        noStoreHeaders(),
    },
  );
}

function verifyPaymentSignature({
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
    ? value.trim()
    : "";
}

function getPaymentNumber(
  value: unknown,
) {
  const number =
    Number(value);

  return Number.isFinite(
    number,
  )
    ? number
    : null;
}

function isCapturedPayment(
  payment:
    RazorpayPaymentDetails,
) {
  const status =
    getPaymentString(
      payment.status,
    ).toLowerCase();

  return (
    status === "captured" &&
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
      websiteOrderId.length >
        100 ||
      razorpayOrderId.length >
        100 ||
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
     * Load trusted order values from the
     * database.
     *
     * Never trust amount or order
     * relationships supplied by the browser.
     */
    const order =
      await prisma.order.findUnique({
        where: {
          id:
            websiteOrderId,
        },

        select: {
          id: true,

          totalAmount: true,

          status: true,
          paymentStatus: true,
          paymentMethod: true,

          razorpayOrderId: true,
          razorpayPaymentId: true,

          couponRedemption: {
            select: {
              status: true,
            },
          },

          createdAt: true,
          updatedAt: true,
        },
      });

    if (!order) {
      return errorResponse(
        "Order not found.",
        404,
      );
    }

    if (
      order.paymentMethod !==
      "Prepaid"
    ) {
      return errorResponse(
        "This order is not configured for online payment.",
        409,
      );
    }

    if (
      !order.razorpayOrderId
    ) {
      return errorResponse(
        "A payment order has not been created for this order.",
        409,
      );
    }

    if (
      razorpayOrderId !==
      order.razorpayOrderId
    ) {
      return errorResponse(
        "The payment does not belong to this order.",
        400,
      );
    }

    /*
     * Exact-payment fast path.
     *
     * processPaidOrder() repeats the same
     * protection while holding the database
     * advisory lock.
     *
     * A paid order that is CANCELLED must not
     * be reported as a normal completed order.
     * It represents a captured payment that
     * requires refund handling.
     */
    if (
      order.paymentStatus ===
        PaymentStatus.SUCCESS &&
      order.razorpayPaymentId ===
        razorpayPaymentId
    ) {
      const requiresRefund =
        order.status ===
        OrderStatus.CANCELLED;

      if (requiresRefund) {
        const refundReason =
          order.couponRedemption
            ?.status ===
          CouponRedemptionStatus.EXPIRED
            ? "COUPON_RESERVATION_EXPIRED"
            : "ORDER_CANCELLED";

        const message =
          refundReason ===
          "COUPON_RESERVATION_EXPIRED"
            ? "Your payment was captured after the coupon reservation expired. The order was cancelled and the payment requires refund processing. Please contact support."
            : "This payment was captured, but the order is cancelled and requires refund processing. Please contact support.";

        return errorResponse(
          message,
          409,
          {
            paymentCaptured:
              true,

            requiresRefund:
              true,

            refundReason,

            order: {
              id:
                order.id,

              totalAmount:
                Number(
                  order.totalAmount,
                ),

              status:
                order.status,

              paymentStatus:
                order.paymentStatus,

              paymentMethod:
                order.paymentMethod,

              paymentReference:
                order
                  .razorpayPaymentId,

              createdAt:
                order.createdAt
                  .toISOString(),

              updatedAt:
                order.updatedAt
                  .toISOString(),
            },
          },
        );
      }

      return NextResponse.json(
        {
          success: true,

          alreadyVerified:
            true,

          requiresRefund:
            false,

          refundReason:
            null,

          message:
            "Payment was already verified.",

          order: {
            id:
              order.id,

            totalAmount:
              Number(
                order.totalAmount,
              ),

            status:
              order.status,

            paymentStatus:
              order.paymentStatus,

            paymentMethod:
              order.paymentMethod,

            paymentReference:
              order
                .razorpayPaymentId,

            createdAt:
              order.createdAt
                .toISOString(),

            updatedAt:
              order.updatedAt
                .toISOString(),
          },
        },
        {
          status: 200,

          headers:
            noStoreHeaders(),
        },
      );
    }

    if (
      order.paymentStatus ===
      PaymentStatus.REFUNDED
    ) {
      return errorResponse(
        "This order has already been refunded.",
        409,
      );
    }

    if (
      order.razorpayPaymentId &&
      order.razorpayPaymentId !==
        razorpayPaymentId
    ) {
      return errorResponse(
        "A different payment has already been recorded for this order.",
        409,
      );
    }

    /*
     * Verify the Razorpay Checkout HMAC
     * signature using the Razorpay Order ID
     * stored in our own database.
     */
    const signatureIsValid =
      verifyPaymentSignature({
        razorpayOrderId:
          order.razorpayOrderId,

        razorpayPaymentId,

        razorpaySignature,
      });

    if (!signatureIsValid) {
      return errorResponse(
        "Payment verification failed.",
        400,
      );
    }

    /*
     * Fetch the payment directly from
     * Razorpay.
     *
     * Verify payment ID, Razorpay Order ID,
     * amount, currency and captured state
     * before inventory can be modified.
     */
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
      order.razorpayOrderId
    ) {
      return errorResponse(
        "The payment does not belong to this order.",
        400,
      );
    }

    const expectedAmountInPaise =
      rupeesToPaise(
        Number(
          order.totalAmount,
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
      fetchedCurrency !==
      "INR"
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
     * Inventory deduction and payment-state
     * mutation happen in one shared,
     * serializable, locked and idempotent
     * transaction.
     */
    const result =
      await processPaidOrder({
        websiteOrderId:
          order.id,

        razorpayOrderId:
          order.razorpayOrderId,

        razorpayPaymentId,

        razorpaySignature,
      });

    if (
      !result.requiresRefund &&
      !result.alreadyProcessed
    ) {
      try {
        await sendStaffNewOrderPush();
      } catch (error) {
        console.error(
          "Staff push notification failed after successful payment verification:",
          {
            websiteOrderId:
              result.order.id,

            error,
          },
        );
      }
    }

    /*
     * A captured payment can require refund
     * when the order was already cancelled,
     * inventory became unavailable, or the
     * coupon reservation expired before
     * payment finalization.
     *
     * None of these cases should deduct
     * inventory.
     */
    if (
      result.requiresRefund
    ) {
      const message =
        result.refundReason ===
        "STOCK_UNAVAILABLE"
          ? `${
              result.unavailableProduct ??
              "A product"
            } became unavailable after payment. Your payment was recorded and the order was cancelled for refund processing. Please contact support.`
          : result.refundReason ===
              "COUPON_RESERVATION_EXPIRED"
            ? "Your payment was captured after the coupon reservation expired. The order was cancelled and the payment requires refund processing. Please contact support."
            : "Your payment was captured after this order had already been cancelled. No inventory was deducted. The payment requires refund processing. Please contact support.";

      return errorResponse(
        message,
        409,
        {
          paymentCaptured:
            true,

          requiresRefund:
            true,

          refundReason:
            result.refundReason,

          unavailableProduct:
            result.unavailableProduct,

          order: {
            id:
              result.order.id,

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
          result.alreadyProcessed,

        requiresRefund:
          false,

        refundReason:
          null,

        message:
          result.alreadyProcessed
            ? "Payment was already verified."
            : "Payment verified successfully.",

        order: {
          id:
            result.order.id,

          totalAmount:
            Number(
              result.order.totalAmount,
            ),

          status:
            result.order.status,

          paymentStatus:
            result.order
              .paymentStatus,

          paymentMethod:
            result.order
              .paymentMethod,

          paymentReference:
            result.order
              .razorpayPaymentId,

          createdAt:
            result.order.createdAt
              .toISOString(),

          updatedAt:
            result.order.updatedAt
              .toISOString(),
        },
      },
      {
        status:
          result.alreadyProcessed
            ? 200
            : 201,

        headers:
          noStoreHeaders(),
      },
    );
  } catch (error) {
    console.error(
      "Razorpay payment verification failed:",
      error,
    );

    if (
      error instanceof
      SyntaxError
    ) {
      return errorResponse(
        "Invalid JSON request body.",
        400,
      );
    }

    if (
      error instanceof
      PaidOrderProcessingError
    ) {
      switch (
        error.code
      ) {
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

        case "RAZORPAY_ORDER_MISMATCH":
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
      }
    }

    if (
      error instanceof
        Prisma
          .PrismaClientKnownRequestError &&
      error.code ===
        "P2034"
    ) {
      return errorResponse(
        "Payment verification conflicted with another request. Please try again.",
        409,
      );
    }

    if (
      error instanceof Error &&
      error.message ===
        "RAZORPAY_KEY_SECRET_NOT_CONFIGURED"
    ) {
      return errorResponse(
        "Payment configuration is incomplete.",
        500,
      );
    }

    return errorResponse(
      "Unable to verify the payment.",
      500,
    );
  }
}
