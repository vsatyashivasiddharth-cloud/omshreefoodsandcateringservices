import {
  createHmac,
  timingSafeEqual,
} from "node:crypto";

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
  PaidOrderProcessingError,
  processPaidOrder,
} from "@/lib/process-paid-order";
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
      headers: noStoreHeaders(),
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
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}

function isCapturedPayment(
  payment: RazorpayPaymentDetails,
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
     * Load the expected values from the database.
     * Never trust the amount or internal order
     * relationship supplied by the browser.
     */
    const order =
      await prisma.order.findUnique({
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

    if (!order.razorpayOrderId) {
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
     * Return early when this exact payment was
     * already processed. The shared helper also
     * repeats this check inside its database lock.
     */
    if (
      order.paymentStatus ===
        PaymentStatus.SUCCESS &&
      order.razorpayPaymentId ===
        razorpayPaymentId
    ) {
      return NextResponse.json(
        {
          success: true,
          alreadyVerified: true,

          message:
            "Payment was already verified.",

          order: {
            id: order.id,

            totalAmount: Number(
              order.totalAmount,
            ),

            status: order.status,

            paymentStatus:
              order.paymentStatus,

            paymentMethod:
              order.paymentMethod,

            paymentReference:
              order.razorpayPaymentId,

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
          headers: noStoreHeaders(),
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
     * Verify the Checkout response using the
     * Razorpay Order ID stored in the database.
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
     * Fetch the payment from Razorpay and confirm
     * its captured state, amount, currency, order ID,
     * and payment ID before changing inventory.
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
        Number(order.totalAmount),
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
     * Inventory deduction and order payment updates
     * are handled by one shared, locked, idempotent
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

    if (result.stockUnavailable) {
      return errorResponse(
        `${result.unavailableProduct ?? "A product"} became unavailable after payment. Your payment was recorded and the order was cancelled for refund processing. Please contact support.`,
        409,
        {
          paymentCaptured: true,
          requiresRefund: true,

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
          result.alreadyProcessed,

        message:
          result.alreadyProcessed
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

    if (
      error instanceof
      PaidOrderProcessingError
    ) {
      switch (error.code) {
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
        Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
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