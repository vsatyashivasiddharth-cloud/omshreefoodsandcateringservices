import {
  NextRequest,
  NextResponse,
} from "next/server";
import {
  OrderStatus,
  PaymentStatus,
  PrintJobStatus,
  PrintJobType,
  ShipmentStatus,
  ShippingProvider,
} from "@prisma/client";

import {
  createLocalPackingLabel,
} from "@/lib/local-packing-label";
import prisma from "@/lib/prisma";
import {
  isPrintBridgeAuthorized,
} from "@/lib/staff-print-bridge-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

function jsonResponse(
  body: unknown,
  status = 200,
) {
  return NextResponse.json(
    body,
    {
      status,
      headers: {
        "Cache-Control":
          "private, no-store, max-age=0",
      },
    },
  );
}

export async function GET(
  request: NextRequest,
  { params }: RouteContext,
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

  try {
    const { id } =
      await params;

    const jobId =
      id.trim();

    if (!jobId) {
      return jsonResponse(
        {
          success: false,
          error:
            "Print job ID is required.",
        },
        400,
      );
    }

    const claimedAtValue =
      request.nextUrl.searchParams
        .get(
          "claimedAt",
        )
        ?.trim();

    if (!claimedAtValue) {
      return jsonResponse(
        {
          success: false,
          error:
            "claimedAt is required.",
        },
        400,
      );
    }

    const claimedAt =
      new Date(
        claimedAtValue,
      );

    if (
      Number.isNaN(
        claimedAt.getTime(),
      )
    ) {
      return jsonResponse(
        {
          success: false,
          error:
            "claimedAt is invalid.",
        },
        400,
      );
    }

    const job =
      await prisma
        .printJob.findFirst({
          where: {
            id:
              jobId,

            type:
              PrintJobType
                .ECOMMERCE_LABEL,

            status:
              PrintJobStatus
                .PRINTING,

            claimedAt,

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
            },
          },

          select: {
            id:
              true,

            order: {
              select: {
                id:
                  true,

                customerName:
                  true,

                phone:
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

                createdAt:
                  true,

                items: {
                  orderBy: {
                    createdAt:
                      "asc",
                  },

                  select: {
                    quantity:
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
      return jsonResponse(
        {
          success: false,

          error:
            "This Local print claim is no longer active.",
        },
        409,
      );
    }

    const order =
      job.order;

    const pdfBytes =
      await createLocalPackingLabel({
        orderId:
          order.id,

        customerName:
          order.customerName,

        phone:
          order.phone,

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
          order.createdAt,

        items:
          order.items.map(
            (item) => ({
              quantity:
                item.quantity,

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
      });

    const filename =
      `local-packing-${order.id}.pdf`;

    return new Response(
      Buffer.from(
        pdfBytes,
      ),
      {
        status:
          200,

        headers: {
          "Cache-Control":
            "private, no-store, max-age=0",

          "Content-Type":
            "application/pdf",

          "Content-Disposition":
            `inline; filename="${filename}"`,

          "Content-Length":
            String(
              pdfBytes.byteLength,
            ),
        },
      },
    );
  } catch (error) {
    console.error(
      "Failed to create Local packing label:",
      error,
    );

    return jsonResponse(
      {
        success: false,
        error:
          "Unable to create the Local packing label.",
      },
      500,
    );
  }
}
