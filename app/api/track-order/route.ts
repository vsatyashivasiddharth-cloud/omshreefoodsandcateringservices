import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  maskIndianPhone,
  normalizeIndianPhone,
} from "@/lib/phone";
import prisma from "@/lib/prisma";
import {
  checkTrackOrderRateLimit,
} from "@/lib/track-order-rate-limit";

const MAX_RECENT_ORDERS = 5;

function noStoreHeaders() {
  return {
    "Cache-Control":
      "private, no-store, max-age=0",
    Pragma: "no-cache",
    Expires: "0",
  };
}

function errorResponse(
  error: string,
  status: number,
  additionalHeaders?: Record<
    string,
    string
  >,
) {
  return NextResponse.json(
    {
      error,
    },
    {
      status,

      headers: {
        ...noStoreHeaders(),
        ...additionalHeaders,
      },
    },
  );
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

function getTrimmedString(
  value: unknown,
) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function getClientIpAddress(
  request: NextRequest,
) {
  const forwardedFor =
    request.headers.get(
      "x-forwarded-for",
    );

  if (forwardedFor) {
    const firstAddress =
      forwardedFor
        .split(",")[0]
        ?.trim();

    if (firstAddress) {
      return firstAddress;
    }
  }

  const vercelForwardedFor =
    request.headers
      .get(
        "x-vercel-forwarded-for",
      )
      ?.split(",")[0]
      ?.trim();

  if (vercelForwardedFor) {
    return vercelForwardedFor;
  }

  const realIp =
    request.headers
      .get("x-real-ip")
      ?.trim();

  if (realIp) {
    return realIp;
  }

  /*
   * Local development requests might
   * not include a forwarded IP header.
   */
  return "unknown-client";
}

function serializeDate(
  value:
    | Date
    | null
    | undefined,
) {
  return value
    ? value.toISOString()
    : null;
}

function serializeDecimal(
  value: unknown,
) {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
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

    const phone =
      getTrimmedString(
        rawBody.phone,
      );

    const phoneNormalized =
      normalizeIndianPhone(phone);

    if (!phoneNormalized) {
      return errorResponse(
        "Please enter a valid 10-digit Indian mobile number.",
        400,
      );
    }

    const ipAddress =
      getClientIpAddress(request);

    const rateLimit =
      await checkTrackOrderRateLimit({
        phone: phoneNormalized,
        ipAddress,
      });

    if (!rateLimit.allowed) {
      return errorResponse(
        "Too many tracking attempts. Please wait a few minutes and try again.",
        429,
        {
          "Retry-After": String(
            rateLimit.retryAfterSeconds,
          ),
        },
      );
    }

    const orders =
      await prisma.order.findMany({
        where: {
          phoneNormalized,
        },

        orderBy: {
          createdAt: "desc",
        },

        take: MAX_RECENT_ORDERS,

        select: {
          id: true,
          customerName: true,

          city: true,
          state: true,
          pincode: true,

          subtotalAmount: true,

          shippingChargedAmount:
            true,

          shippingDiscountAmount:
            true,

          totalAmount: true,

          status: true,
          paymentStatus: true,
          paymentMethod: true,

          shippingProvider: true,
          shippingMode: true,
          shipmentStatus: true,

          delhiveryWaybill: true,
          delhiveryStatus: true,

          shippingQuotedAt: true,
          pickupScheduledAt: true,
          shippedAt: true,

          estimatedDeliveryAt:
            true,

          deliveredAt: true,

          packageWeightGrams: true,
          packageLengthCm: true,
          packageBreadthCm: true,
          packageHeightCm: true,

          package: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },

          items: {
            orderBy: {
              createdAt: "asc",
            },

            select: {
              id: true,
              quantity: true,
              price: true,

              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  image: true,

                  category: {
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                    },
                  },
                },
              },
            },
          },

          createdAt: true,
          updatedAt: true,
        },
      });

    return NextResponse.json(
      {
        phone:
          maskIndianPhone(
            phoneNormalized,
          ),

        count: orders.length,

        orders: orders.map(
          (order) => ({
            id: order.id,

            customerName:
              order.customerName,

            deliveryDestination: {
              city: order.city,
              state: order.state,
              pincode: order.pincode,
            },

            subtotalAmount:
              serializeDecimal(
                order.subtotalAmount,
              ),

            shippingChargedAmount:
              serializeDecimal(
                order
                  .shippingChargedAmount,
              ),

            shippingDiscountAmount:
              serializeDecimal(
                order
                  .shippingDiscountAmount,
              ),

            totalAmount:
              serializeDecimal(
                order.totalAmount,
              ),

            status: order.status,

            paymentStatus:
              order.paymentStatus,

            paymentMethod:
              order.paymentMethod,

            shipping: {
              provider:
                order.shippingProvider,

              mode:
                order.shippingMode,

              status:
                order.shipmentStatus,

              tracking: {
                number:
                  order.delhiveryWaybill,

                status:
                  order.delhiveryStatus,
              },

              quotedAt:
                serializeDate(
                  order.shippingQuotedAt,
                ),

              pickupScheduledAt:
                serializeDate(
                  order
                    .pickupScheduledAt,
                ),

              shippedAt:
                serializeDate(
                  order.shippedAt,
                ),

              estimatedDeliveryAt:
                serializeDate(
                  order
                    .estimatedDeliveryAt,
                ),

              deliveredAt:
                serializeDate(
                  order.deliveredAt,
                ),

              package:
                order.package
                  ? {
                      id:
                        order.package.id,

                      name:
                        order.package
                          .name,

                      code:
                        order.package
                          .code,

                      packedWeightGrams:
                        order
                          .packageWeightGrams,

                      dimensions: {
                        lengthCm:
                          serializeDecimal(
                            order
                              .packageLengthCm,
                          ),

                        breadthCm:
                          serializeDecimal(
                            order
                              .packageBreadthCm,
                          ),

                        heightCm:
                          serializeDecimal(
                            order
                              .packageHeightCm,
                          ),
                      },
                    }
                  : null,
            },

            items:
              order.items.map(
                (item) => {
                  const unitPrice =
                    Number(
                      item.price,
                    );

                  return {
                    id: item.id,

                    quantity:
                      item.quantity,

                    unitPrice,

                    lineTotal:
                      Math.round(
                        unitPrice *
                          item.quantity *
                          100,
                      ) / 100,

                    product:
                      item.product,
                  };
                },
              ),

            createdAt:
              serializeDate(
                order.createdAt,
              ),

            updatedAt:
              serializeDate(
                order.updatedAt,
              ),
          }),
        ),
      },
      {
        status: 200,
        headers:
          noStoreHeaders(),
      },
    );
  } catch (error) {
    console.error(
      "Phone order tracking failed:",
      error,
    );

    if (
      error instanceof SyntaxError
    ) {
      return errorResponse(
        "Invalid request body.",
        400,
      );
    }

    return errorResponse(
      "Unable to retrieve order information right now.",
      500,
    );
  }
}