import {
  NextRequest,
  NextResponse,
} from "next/server";
import {
  OrderStatus,
  PaymentStatus,
  Prisma,
  PrintJobStatus,
  PrintJobType,
  ShipmentStatus,
  ShippingProvider,
} from "@prisma/client";

import prisma from "@/lib/prisma";
import {
  isPrintBridgeAuthorized,
} from "@/lib/staff-print-bridge-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CLAIM_LEASE_MINUTES = 10;
const MAX_PRINT_ATTEMPTS = 5;

function noStoreHeaders() {
  return {
    "Cache-Control":
      "private, no-store, max-age=0",
  };
}

function jsonResponse(
  body: unknown,
  status = 200,
) {
  return NextResponse.json(
    body,
    {
      status,
      headers: noStoreHeaders(),
    },
  );
}

export async function POST(
  request: NextRequest,
) {
  if (
    !isPrintBridgeAuthorized(
      request,
    )
  ) {
    return jsonResponse(
      {
        success: false,
        error: "Unauthorized.",
      },
      401,
    );
  }

  const staleBefore =
    new Date(
      Date.now() -
        CLAIM_LEASE_MINUTES *
          60 *
          1000,
    );

  try {
    const result =
      await prisma.$transaction(
        async (transaction) => {
          /*
           * Serialize claim operations so two
           * print clients cannot select the same
           * oldest job concurrently.
           */
          await transaction
            .$executeRaw`
              SELECT pg_advisory_xact_lock(
                hashtext(
                  'staff-print-bridge-claim'
                )
              )
            `;

          const job =
            await transaction
              .printJob.findFirst({
                where: {
                  type:
                    PrintJobType
                      .ECOMMERCE_LABEL,

                  attemptCount: {
                    lt:
                      MAX_PRINT_ATTEMPTS,
                  },

                  OR: [
                    {
                      status:
                        PrintJobStatus
                          .PENDING,
                    },
                    {
                      status:
                        PrintJobStatus
                          .FAILED,

                      claimedAt: {
                        lte:
                          staleBefore,
                      },
                    },
                    {
                      status:
                        PrintJobStatus
                          .PRINTING,

                      OR: [
                        {
                          claimedAt:
                            null,
                        },
                        {
                          claimedAt: {
                            lte:
                              staleBefore,
                          },
                        },
                      ],
                    },
                  ],

                  order: {
                    is: {
                      paymentStatus:
                        PaymentStatus
                          .SUCCESS,

                      status: {
                        in: [
                          OrderStatus
                            .PACKED,
                          OrderStatus
                            .OUT_FOR_DELIVERY,
                        ],
                      },

                      OR: [
                        {
                          shippingProvider:
                            ShippingProvider
                              .MANUAL,

                          shipmentStatus: {
                            in: [
                              ShipmentStatus
                                .CREATED,
                              ShipmentStatus
                                .IN_TRANSIT,
                              ShipmentStatus
                                .OUT_FOR_DELIVERY,
                            ],
                          },
                        },
                        {
                          shippingProvider:
                            ShippingProvider
                              .DELHIVERY,

                          delhiveryWaybill: {
                            not: null,
                          },
                        },
                      ],
                    },
                  },
                },

                orderBy: [
                  {
                    createdAt:
                      "asc",
                  },
                  {
                    id:
                      "asc",
                  },
                ],

                select: {
                  id: true,
                  attemptCount: true,

                  order: {
                    select: {
                      id: true,

                      customerName:
                        true,
                      phone:
                        true,
                      email:
                        true,

                      address:
                        true,
                      city:
                        true,
                      state:
                        true,
                      pincode:
                        true,

                      totalAmount:
                        true,

                      shippingProvider:
                        true,
                      shipmentStatus:
                        true,

                      delhiveryWaybill:
                        true,

                      createdAt:
                        true,

                      items: {
                        orderBy: {
                          createdAt:
                            "asc",
                        },

                        select: {
                          id:
                            true,

                          quantity:
                            true,

                          price:
                            true,

                          productName:
                            true,

                          variantLabel:
                            true,

                          variantSku:
                            true,

                          product: {
                            select: {
                              name:
                                true,
                            },
                          },

                          variant: {
                            select: {
                              label:
                                true,
                              sku:
                                true,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              });

          if (!job) {
            return null;
          }

          const claimedAt =
            new Date();

          const claimed =
            await transaction
              .printJob.update({
                where: {
                  id:
                    job.id,
                },

                data: {
                  status:
                    PrintJobStatus
                      .PRINTING,

                  attemptCount: {
                    increment:
                      1,
                  },

                  claimedAt,

                  printedAt:
                    null,

                  lastError:
                    null,
                },
              });

          const order =
            job.order;

          if (
            order.shippingProvider ===
            ShippingProvider.MANUAL
          ) {
            return {
              jobId:
                claimed.id,

              claimedAt:
                claimedAt
                  .toISOString(),

              attemptCount:
                claimed.attemptCount,

              documentType:
                "LOCAL_PACKING_LABEL",

              order: {
                id:
                  order.id,

                customerName:
                  order.customerName,

                phone:
                  order.phone,

                email:
                  order.email,

                address:
                  order.address,

                city:
                  order.city,

                state:
                  order.state,

                pincode:
                  order.pincode,

                totalAmount:
                  Number(
                    order.totalAmount,
                  ),

                createdAt:
                  order.createdAt
                    .toISOString(),

                items:
                  order.items.map(
                    (item) => ({
                      id:
                        item.id,

                      quantity:
                        item.quantity,

                      price:
                        Number(
                          item.price,
                        ),

                      productName:
                        item.productName
                          ?.trim() ||
                        item.product
                          ?.name ||
                        "Deleted product",

                      variantLabel:
                        item.variantLabel
                          ?.trim() ||
                        item.variant
                          ?.label ||
                        null,

                      variantSku:
                        item.variantSku
                          ?.trim() ||
                        item.variant
                          ?.sku ||
                        null,
                    }),
                  ),
              },
            };
          }

          const waybill =
            order.delhiveryWaybill
              ?.trim();

          /*
           * This should be unreachable because
           * the query requires a waybill for
           * Delhivery jobs. Keep the guard so
           * an invalid job is never handed to
           * the printer.
           */
          if (!waybill) {
            throw new Error(
              "Claimed Delhivery print job has no waybill.",
            );
          }

          return {
            jobId:
              claimed.id,

            claimedAt:
              claimedAt
                .toISOString(),

            attemptCount:
              claimed.attemptCount,

            documentType:
              "DELHIVERY_LABEL",

            order: {
              id:
                order.id,

              waybill,
            },
          };
        },
        {
          isolationLevel:
            Prisma
              .TransactionIsolationLevel
              .Serializable,

          maxWait:
            5000,

          timeout:
            10000,
        },
      );

    if (!result) {
      return jsonResponse({
        success: true,
        job: null,
      });
    }

    return jsonResponse({
      success: true,
      job: result,
    });
  } catch (error) {
    console.error(
      "Failed to claim print job:",
      error,
    );

    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code ===
        "P2034"
    ) {
      return jsonResponse(
        {
          success: false,
          error:
            "Print queue is busy. Please retry.",
        },
        409,
      );
    }

    return jsonResponse(
      {
        success: false,
        error:
          "Unable to claim a print job.",
      },
      500,
    );
  }
}
