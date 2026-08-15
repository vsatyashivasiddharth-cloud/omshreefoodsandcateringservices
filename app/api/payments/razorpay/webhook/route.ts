import {
  createHmac,
  timingSafeEqual,
} from "node:crypto";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
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

interface RazorpayWebhookPayload {
  entity?: unknown;
  event?: unknown;

  payload?: {
    payment?: {
      entity?: {
        id?: unknown;
        order_id?: unknown;
        amount?: unknown;
        currency?: unknown;
        status?: unknown;
        captured?: unknown;
      };
    };

    order?: {
      entity?: {
        id?: unknown;
        amount?: unknown;
        amount_paid?: unknown;
        currency?: unknown;
        status?: unknown;
        notes?: unknown;
      };
    };
  };
}

function noStoreHeaders() {
  return {
    "Cache-Control":
      "private, no-store, max-age=0",
  };
}

function jsonResponse(
  body: Record<
    string,
    unknown
  >,
  status = 200,
) {
  return NextResponse.json(
    body,
    {
      status,

      headers:
        noStoreHeaders(),
    },
  );
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

function getString(
  value: unknown,
) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function getNumber(
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

function getWebhookSecret() {
  const secret =
    process.env
      .RAZORPAY_WEBHOOK_SECRET
      ?.trim();

  if (!secret) {
    throw new Error(
      "RAZORPAY_WEBHOOK_SECRET_NOT_CONFIGURED",
    );
  }

  return secret;
}

function verifyWebhookSignature({
  rawBody,
  receivedSignature,
}: {
  rawBody: string;
  receivedSignature: string;
}) {
  const expectedSignature =
    createHmac(
      "sha256",
      getWebhookSecret(),
    )
      .update(rawBody)
      .digest("hex");

  const expectedBuffer =
    Buffer.from(
      expectedSignature,
      "utf8",
    );

  const receivedBuffer =
    Buffer.from(
      receivedSignature,
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

function parseWebhookPayload(
  rawBody: string,
): RazorpayWebhookPayload | null {
  try {
    const parsed: unknown =
      JSON.parse(rawBody);

    if (!isRecord(parsed)) {
      return null;
    }

    return parsed as
      RazorpayWebhookPayload;
  } catch {
    return null;
  }
}

function extractWebsiteOrderId(
  notes: unknown,
) {
  if (!isRecord(notes)) {
    return "";
  }

  return getString(
    notes.websiteOrderId,
  );
}

export async function POST(
  request: NextRequest,
) {
  const eventId =
    request.headers
      .get(
        "x-razorpay-event-id",
      )
      ?.trim() ?? "";

  try {
    /*
     * Razorpay webhook authentication MUST
     * use the original raw request body.
     *
     * Do not call request.json() before
     * signature validation.
     */
    const rawBody =
      await request.text();

    const receivedSignature =
      request.headers
        .get(
          "x-razorpay-signature",
        )
        ?.trim() ?? "";

    if (!receivedSignature) {
      return jsonResponse(
        {
          received:
            false,

          error:
            "Missing webhook signature.",
        },
        400,
      );
    }

    if (
      !verifyWebhookSignature({
        rawBody,
        receivedSignature,
      })
    ) {
      console.warn(
        "Rejected Razorpay webhook with invalid signature:",
        {
          eventId:
            eventId ||
            null,
        },
      );

      return jsonResponse(
        {
          received:
            false,

          error:
            "Invalid webhook signature.",
        },
        400,
      );
    }

    const webhook =
      parseWebhookPayload(
        rawBody,
      );

    if (!webhook) {
      return jsonResponse(
        {
          received:
            false,

          error:
            "Invalid webhook payload.",
        },
        400,
      );
    }

    const event =
      getString(
        webhook.event,
      );

    /*
     * Only order.paid changes local payment
     * and inventory state.
     *
     * Valid webhook events that we do not
     * consume intentionally return 200 so
     * Razorpay does not retry them.
     */
    if (
      event !==
      "order.paid"
    ) {
      return jsonResponse({
        received:
          true,

        processed:
          false,

        event:
          event ||
          null,

        message:
          "Webhook event ignored.",
      });
    }

    const paymentEntity =
      webhook.payload
        ?.payment
        ?.entity;

    const razorpayOrderEntity =
      webhook.payload
        ?.order
        ?.entity;

    if (
      !isRecord(
        paymentEntity,
      ) ||
      !isRecord(
        razorpayOrderEntity,
      )
    ) {
      return jsonResponse(
        {
          received:
            false,

          error:
            "The order.paid payload is incomplete.",
        },
        400,
      );
    }

    const razorpayPaymentId =
      getString(
        paymentEntity.id,
      );

    const paymentOrderId =
      getString(
        paymentEntity.order_id,
      );

    const razorpayOrderId =
      getString(
        razorpayOrderEntity.id,
      );

    const paymentStatus =
      getString(
        paymentEntity.status,
      ).toLowerCase();

    const paymentCaptured =
      paymentEntity.captured ===
        true ||
      paymentStatus ===
        "captured";

    const orderStatus =
      getString(
        razorpayOrderEntity.status,
      ).toLowerCase();

    const paymentCurrency =
      getString(
        paymentEntity.currency,
      ).toUpperCase();

    const orderCurrency =
      getString(
        razorpayOrderEntity.currency,
      ).toUpperCase();

    const paymentAmount =
      getNumber(
        paymentEntity.amount,
      );

    const orderAmountPaid =
      getNumber(
        razorpayOrderEntity
          .amount_paid,
      );

    if (
      !razorpayPaymentId ||
      !paymentOrderId ||
      !razorpayOrderId
    ) {
      return jsonResponse(
        {
          received:
            false,

          error:
            "Payment identifiers are missing from the webhook.",
        },
        400,
      );
    }

    if (
      paymentOrderId !==
      razorpayOrderId
    ) {
      return jsonResponse(
        {
          received:
            false,

          error:
            "The payment order reference does not match.",
        },
        400,
      );
    }

    if (
      !paymentCaptured ||
      orderStatus !==
        "paid"
    ) {
      return jsonResponse(
        {
          received:
            false,

          error:
            "The webhook does not represent a captured payment.",
        },
        409,
      );
    }

    if (
      paymentCurrency !==
        "INR" ||
      orderCurrency !==
        "INR"
    ) {
      return jsonResponse(
        {
          received:
            false,

          error:
            "The webhook payment currency is invalid.",
        },
        400,
      );
    }

    if (
      paymentAmount ===
        null ||
      orderAmountPaid ===
        null ||
      paymentAmount !==
        orderAmountPaid
    ) {
      return jsonResponse(
        {
          received:
            false,

          error:
            "The webhook payment amount is invalid.",
        },
        400,
      );
    }

    /*
     * Prefer the website order ID stored in
     * Razorpay order notes.
     *
     * Fall back to the saved Razorpay Order ID
     * if notes are absent.
     */
    let websiteOrderId =
      extractWebsiteOrderId(
        razorpayOrderEntity
          .notes,
      );

    if (!websiteOrderId) {
      const databaseOrder =
        await prisma.order.findFirst({
          where: {
            razorpayOrderId,
          },

          select: {
            id: true,
          },
        });

      websiteOrderId =
        databaseOrder?.id ??
        "";
    }

    if (!websiteOrderId) {
      console.error(
        "Razorpay webhook could not find its website order:",
        {
          eventId:
            eventId ||
            null,

          razorpayOrderId,

          razorpayPaymentId,
        },
      );

      /*
       * The database transaction that creates
       * the order may not have committed yet.
       * Return a retryable server response.
       */
      return jsonResponse(
        {
          received:
            true,

          processed:
            false,

          error:
            "Website order not found.",
        },
        503,
      );
    }

    const databaseOrder =
      await prisma.order.findUnique({
        where: {
          id:
            websiteOrderId,
        },

        select: {
          id: true,
          totalAmount: true,
          razorpayOrderId: true,
        },
      });

    if (!databaseOrder) {
      return jsonResponse(
        {
          received:
            true,

          processed:
            false,

          error:
            "Website order not found.",
        },
        503,
      );
    }

    if (
      databaseOrder
        .razorpayOrderId !==
      razorpayOrderId
    ) {
      return jsonResponse(
        {
          received:
            false,

          error:
            "The webhook does not belong to this website order.",
        },
        400,
      );
    }

    /*
     * Razorpay reports payment amounts in
     * paise.
     *
     * Compare against the total stored in
     * our own database.
     */
    const expectedAmount =
      Math.round(
        Number(
          databaseOrder
            .totalAmount,
        ) * 100,
      );

    if (
      !Number.isSafeInteger(
        expectedAmount,
      ) ||
      expectedAmount < 1 ||
      paymentAmount !==
        expectedAmount
    ) {
      return jsonResponse(
        {
          received:
            false,

          error:
            "The webhook amount does not match the order total.",
        },
        400,
      );
    }

    /*
     * All payment-state and inventory changes
     * happen in the shared serializable,
     * advisory-locked transaction.
     */
    const result =
      await processPaidOrder({
        websiteOrderId:
          databaseOrder.id,

        razorpayOrderId,

        razorpayPaymentId,

        /*
         * This is the webhook HMAC signature,
         * not Razorpay Checkout's payment
         * signature.
         *
         * Do not persist it in
         * Order.razorpaySignature.
         */
        razorpaySignature:
          null,
      });

    if (
      !result.requiresRefund &&
      !result.alreadyProcessed
    ) {
      try {
        await sendStaffNewOrderPush();
      } catch (error) {
        console.error(
          "Staff push notification failed after successful Razorpay webhook payment:",
          {
            websiteOrderId:
              result.order.id,

            eventId:
              eventId ||
              null,

            error,
          },
        );
      }
    }

    /*
     * A captured payment can require refund
     * because:
     *
     * 1. stock disappeared before finalization,
     * or
     *
     * 2. the order had already been cancelled.
     *
     * processPaidOrder() records the captured
     * payment but does not deduct inventory.
     *
     * Return HTTP 200 so Razorpay does not
     * keep retrying an event that has already
     * been safely recorded.
     */
    if (
      result.requiresRefund
    ) {
      if (
        result.refundReason ===
        "STOCK_UNAVAILABLE"
      ) {
        console.error(
          "Captured Razorpay payment could not be fulfilled because stock became unavailable:",
          {
            eventId:
              eventId ||
              null,

            websiteOrderId:
              result.order.id,

            razorpayOrderId,

            razorpayPaymentId,

            unavailableProduct:
              result
                .unavailableProduct,
          },
        );
      } else {
        console.error(
          "Captured Razorpay payment belongs to an order that was already cancelled:",
          {
            eventId:
              eventId ||
              null,

            websiteOrderId:
              result.order.id,

            razorpayOrderId,

            razorpayPaymentId,
          },
        );
      }

      return jsonResponse({
        received:
          true,

        processed:
          true,

        alreadyProcessed:
          result
            .alreadyProcessed,

        requiresRefund:
          true,

        refundReason:
          result.refundReason,

        unavailableProduct:
          result
            .unavailableProduct,

        order: {
          id:
            result.order.id,

          status:
            result.order.status,

          paymentStatus:
            result.order
              .paymentStatus,
        },

        message:
          result.refundReason ===
          "STOCK_UNAVAILABLE"
            ? "Payment recorded, but stock became unavailable and the order requires refund processing."
            : "Payment recorded, but the order was already cancelled and requires refund processing.",
      });
    }

    return jsonResponse({
      received:
        true,

      processed:
        true,

      alreadyProcessed:
        result
          .alreadyProcessed,

      requiresRefund:
        false,

      refundReason:
        null,

      order: {
        id:
          result.order.id,

        status:
          result.order.status,

        paymentStatus:
          result.order
            .paymentStatus,
      },

      message:
        result.alreadyProcessed
          ? "Payment was already processed."
          : "Payment processed successfully.",
    });
  } catch (error) {
    console.error(
      "Razorpay webhook processing failed:",
      {
        eventId:
          eventId ||
          null,

        error,
      },
    );

    if (
      error instanceof
      PaidOrderProcessingError
    ) {
      switch (
        error.code
      ) {
        case "ORDER_NOT_FOUND":
          return jsonResponse(
            {
              received:
                true,

              processed:
                false,

              error:
                "Website order not found.",
            },
            503,
          );

        case "INVALID_PAYMENT_METHOD":
          return jsonResponse(
            {
              received:
                false,

              error:
                "The order is not configured for prepaid payment.",
            },
            409,
          );

        case "RAZORPAY_ORDER_MISMATCH":
          return jsonResponse(
            {
              received:
                false,

              error:
                "The Razorpay order does not match the website order.",
            },
            400,
          );

        case "ORDER_REFUNDED":
          /*
           * The payment was already handled
           * and refunded.
           *
           * Do not ask Razorpay to retry.
           */
          return jsonResponse({
            received:
              true,

            processed:
              false,

            requiresRefund:
              false,

            refundReason:
              null,

            message:
              "The order has already been refunded.",
          });

        case "DIFFERENT_PAYMENT_RECORDED":
          return jsonResponse(
            {
              received:
                false,

              error:
                "A different payment is already recorded for this order.",
            },
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
      return jsonResponse(
        {
          received:
            true,

          processed:
            false,

          error:
            "A database transaction conflict occurred.",
        },
        503,
      );
    }

    if (
      error instanceof Error &&
      error.message ===
        "RAZORPAY_WEBHOOK_SECRET_NOT_CONFIGURED"
    ) {
      return jsonResponse(
        {
          received:
            false,

          error:
            "Webhook configuration is incomplete.",
        },
        500,
      );
    }

    return jsonResponse(
      {
        received:
          true,

        processed:
          false,

        error:
          "Unable to process the webhook.",
      },
      500,
    );
  }
}
