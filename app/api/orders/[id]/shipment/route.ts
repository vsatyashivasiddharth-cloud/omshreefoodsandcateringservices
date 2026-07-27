import {
  NextRequest,
  NextResponse,
} from "next/server";
import {
  OrderStatus,
  PaymentStatus,
  Prisma,
  ShipmentStatus,
  ShippingMode,
  ShippingProvider,
} from "@prisma/client";

import { requireAdmin } from "@/lib/auth";
import {
  createDelhiveryShipment,
  DelhiveryShipmentError,
} from "@/lib/delhivery-shipment";
import prisma from "@/lib/prisma";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
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

function decimalToPositiveNumber(
  value:
    | Prisma.Decimal
    | number
    | null,
  fieldName: string,
) {
  const number = Number(value);

  if (
    !Number.isFinite(number) ||
    number <= 0
  ) {
    throw new Error(
      `${fieldName} is missing or invalid.`,
    );
  }

  return number;
}

function formatProductDescription(
  items: Array<{
    quantity: number;

    product: {
      name: string;
    };
  }>,
) {
  return items
    .map(
      (item) =>
        `${item.product.name} x ${item.quantity}`,
    )
    .join(", ")
    .slice(0, 500);
}

export async function POST(
  request: NextRequest,
  { params }: RouteContext,
) {
  const authentication =
    await requireAdmin(request);

  if (!authentication.authenticated) {
    return errorResponse(
      authentication.error,
      authentication.status,
    );
  }

  try {
    const { id } = await params;

    const orderId = id.trim();

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

                address: true,
                city: true,
                state: true,
                pincode: true,

                totalAmount: true,

                status: true,
                paymentStatus: true,
                paymentMethod: true,

                shippingProvider: true,
                shippingMode: true,
                shipmentStatus: true,

                packageWeightGrams: true,
                packageLengthCm: true,
                packageBreadthCm: true,
                packageHeightCm: true,

                delhiveryWaybill: true,
                delhiveryShipmentId: true,
                delhiveryOrderId: true,
                delhiveryStatus: true,

                createdAt: true,

                items: {
                  select: {
                    quantity: true,

                    product: {
                      select: {
                        name: true,
                      },
                    },
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
            order.shippingProvider !==
            ShippingProvider.DELHIVERY
          ) {
            throw new Error(
              "INVALID_SHIPPING_PROVIDER",
            );
          }

          if (
            order.status ===
            OrderStatus.CANCELLED
          ) {
            throw new Error(
              "ORDER_CANCELLED",
            );
          }

          if (order.delhiveryWaybill) {
            return {
              alreadyCreated: true,

              order: {
                id: order.id,

                shipmentStatus:
                  order.shipmentStatus,

                delhiveryWaybill:
                  order.delhiveryWaybill,

                delhiveryShipmentId:
                  order.delhiveryShipmentId,

                delhiveryOrderId:
                  order.delhiveryOrderId,

                delhiveryStatus:
                  order.delhiveryStatus,
              },
            };
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
            order.paymentStatus !==
            PaymentStatus.SUCCESS
          ) {
            throw new Error(
              "PREPAID_PAYMENT_PENDING",
            );
          }

          if (
            !Array.isArray(
              order.items,
            ) ||
            order.items.length === 0
          ) {
            throw new Error(
              "ORDER_HAS_NO_ITEMS",
            );
          }

          const totalQuantity =
            order.items.reduce(
              (total, item) =>
                total +
                item.quantity,
              0,
            );

          if (totalQuantity < 1) {
            throw new Error(
              "INVALID_ORDER_QUANTITY",
            );
          }

          const packageWeightGrams =
            order.packageWeightGrams;

          if (
            packageWeightGrams ===
              null ||
            !Number.isInteger(
              packageWeightGrams,
            ) ||
            packageWeightGrams < 1
          ) {
            throw new Error(
              "INVALID_PACKAGE_WEIGHT",
            );
          }

          const packageLengthCm =
            decimalToPositiveNumber(
              order.packageLengthCm,
              "Package length",
            );

          const packageBreadthCm =
            decimalToPositiveNumber(
              order.packageBreadthCm,
              "Package breadth",
            );

          const packageHeightCm =
            decimalToPositiveNumber(
              order.packageHeightCm,
              "Package height",
            );

          const totalAmount = Number(
            order.totalAmount,
          );

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

          const shippingMode =
            order.shippingMode ===
            ShippingMode.EXPRESS
              ? "Express"
              : "Surface";

          const shipment =
            await createDelhiveryShipment({
              orderId: order.id,

              customerName:
                order.customerName,

              address:
                order.address,

              city: order.city,
              state: order.state,

              pincode:
                order.pincode,

              country: "India",

              phone: order.phone,

              paymentMode:
                "Prepaid",

              codAmount: 0,

              totalAmount,

              productDescription:
                formatProductDescription(
                  order.items,
                ),

              quantity:
                totalQuantity,

              weightGrams:
                packageWeightGrams,

              /*
               * Delhivery's portal payload currently
               * contains width and height fields.
               */
              widthCm:
                packageBreadthCm,

              heightCm:
                packageHeightCm,

              shippingMode,

              addressType: "home",

              orderDate:
                order.createdAt,

              sellerName:
                "OM SHREE FOODS AND B2C",

              sellerAddress:
                process.env
                  .DELHIVERY_PICKUP_ADDRESS,

              sellerInvoice:
                order.id,
            });

          /*
           * The current manifestation payload does not
           * include a shipment_length field, but length
           * is still validated above for package accuracy.
           */
          void packageLengthCm;

          if (!shipment.waybill) {
            throw new Error(
              "DELHIVERY_WAYBILL_MISSING",
            );
          }

          const updatedOrder =
            await transaction.order.update({
              where: {
                id: order.id,
              },

              data: {
                shipmentStatus:
                  ShipmentStatus.CREATED,

                delhiveryWaybill:
                  shipment.waybill,

                delhiveryShipmentId:
                  shipment.shipmentId,

                delhiveryOrderId:
                  shipment.orderId,

                delhiveryStatus:
                  shipment.status ||
                  "Created",
              },

              select: {
                id: true,

                status: true,
                paymentStatus: true,
                paymentMethod: true,

                shippingProvider: true,
                shippingMode: true,
                shipmentStatus: true,

                delhiveryWaybill: true,
                delhiveryShipmentId: true,
                delhiveryOrderId: true,
                delhiveryStatus: true,

                shippingQuotedAt: true,

                updatedAt: true,
              },
            });

          return {
            alreadyCreated: false,
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

    return NextResponse.json(
      {
        success: true,

        alreadyCreated:
          result.alreadyCreated,

        message:
          result.alreadyCreated
            ? "A Delhivery shipment already exists for this order."
            : "Delhivery shipment created successfully.",

        order: {
          ...result.order,

          updatedAt:
            "updatedAt" in
            result.order
              ? result.order.updatedAt.toISOString()
              : undefined,

          shippingQuotedAt:
            "shippingQuotedAt" in
              result.order &&
            result.order
              .shippingQuotedAt
              ? result.order.shippingQuotedAt.toISOString()
              : null,
        },
      },
      {
        status:
          result.alreadyCreated
            ? 200
            : 201,

        headers: noStoreHeaders(),
      },
    );
  } catch (error) {
    console.error(
      "Delhivery shipment creation failed:",
      error,
    );

    if (
      error instanceof
      DelhiveryShipmentError
    ) {
      return errorResponse(
        error.message ||
          "Delhivery could not create the shipment.",

        error.status >= 400 &&
          error.status < 500
          ? error.status
          : 502,
      );
    }

    if (error instanceof Error) {
      switch (error.message) {
        case "ORDER_NOT_FOUND":
          return errorResponse(
            "Order not found.",
            404,
          );

        case "INVALID_SHIPPING_PROVIDER":
          return errorResponse(
            "This order is not configured for Delhivery shipping.",
            409,
          );

        case "ORDER_CANCELLED":
          return errorResponse(
            "A shipment cannot be created for a cancelled order.",
            409,
          );

        case "INVALID_PAYMENT_METHOD":
          return errorResponse(
            "Only prepaid orders are currently supported.",
            422,
          );

        case "PREPAID_PAYMENT_PENDING":
          return errorResponse(
            "The prepaid payment must succeed before creating the shipment.",
            409,
          );

        case "ORDER_HAS_NO_ITEMS":
          return errorResponse(
            "The order does not contain any products.",
            422,
          );

        case "INVALID_ORDER_QUANTITY":
          return errorResponse(
            "The order quantity is invalid.",
            422,
          );

        case "INVALID_PACKAGE_WEIGHT":
          return errorResponse(
            "The order does not have a valid package weight.",
            422,
          );

        case "INVALID_ORDER_TOTAL":
          return errorResponse(
            "The order total is invalid.",
            422,
          );

        case "DELHIVERY_WAYBILL_MISSING":
          return errorResponse(
            "Delhivery returned an invalid shipment response without a waybill.",
            502,
          );

        default:
          if (
            error.message.includes(
              "Package",
            )
          ) {
            return errorResponse(
              error.message,
              422,
            );
          }
      }
    }

    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return errorResponse(
        "This Delhivery waybill is already attached to another order.",
        409,
      );
    }

    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      return errorResponse(
        "Shipment creation conflicted with another update. Please try again.",
        409,
      );
    }

    return errorResponse(
      "Unable to create the Delhivery shipment.",
      500,
    );
  }
}