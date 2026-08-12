import {
  NextRequest,
  NextResponse,
} from "next/server";
import {
  OrderStatus,
  PaymentStatus,
  ShipmentStatus,
} from "@prisma/client";

import {
  requireAdmin,
} from "@/lib/auth";
import prisma from "@/lib/prisma";

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
      headers:
        noStoreHeaders(),
    },
  );
}

export async function GET(
  request: NextRequest,
) {
  try {
    /*
     * IMPORTANT:
     * Protect this admin API independently
     * from the /admin page-level proxy.
     */
    const authentication =
      await requireAdmin(
        request,
      );

    if (
      !authentication.authenticated
    ) {
      return errorResponse(
        authentication.error,
        authentication.status,
      );
    }

    const orders =
      await prisma.order.findMany({
        select: {
          id: true,

          customerName: true,
          phone: true,
          email: true,

          totalAmount: true,

          status: true,
          paymentStatus: true,

          razorpayOrderId: true,
          razorpayPaymentId: true,
          razorpaySignature: true,

          shipmentStatus: true,

          delhiveryWaybill: true,
          delhiveryShipmentId: true,
          delhiveryOrderId: true,

          createdAt: true,
          updatedAt: true,

          items: {
            select: {
              id: true,

              productId: true,
              variantId: true,

              quantity: true,
              price: true,

              productName: true,
              productSlug: true,
              productImage: true,

              variantLabel: true,
              variantSku: true,

              variantWeightGrams:
                true,

              variantShippingWeightGrams:
                true,

              createdAt: true,

              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  image: true,
                },
              },

              variant: {
                select: {
                  id: true,
                  label: true,
                  sku: true,
                  weightGrams: true,

                  shippingWeightGrams:
                    true,
                },
              },
            },

            orderBy: {
              createdAt: "asc",
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },
      });

    return NextResponse.json(
      orders.map(
        (order) => {
          /*
           * Keep the Admin list deletion affordance
           * aligned with the authoritative DELETE
           * endpoint protection rules.
           */
          const removableOrderStatus =
            order.status ===
              OrderStatus.PENDING ||
            order.status ===
              OrderStatus.CANCELLED;

          const removablePaymentStatus =
            order.paymentStatus ===
              PaymentStatus.PENDING ||
            order.paymentStatus ===
              PaymentStatus.FAILED;

          const hasStartedPayment =
            Boolean(
              order.razorpayOrderId,
            ) ||
            Boolean(
              order.razorpayPaymentId,
            ) ||
            Boolean(
              order.razorpaySignature,
            );

          const removableShipmentStatus =
            order.shipmentStatus ===
              ShipmentStatus.NOT_CREATED ||
            order.shipmentStatus ===
              ShipmentStatus.QUOTED;

          const hasCreatedShipment =
            Boolean(
              order.delhiveryWaybill,
            ) ||
            Boolean(
              order.delhiveryShipmentId,
            ) ||
            Boolean(
              order.delhiveryOrderId,
            );

          const canDelete =
            removableOrderStatus &&
            removablePaymentStatus &&
            !hasStartedPayment &&
            removableShipmentStatus &&
            !hasCreatedShipment;

          return {
            id:
              order.id,

            customerName:
              order.customerName,

            phone:
              order.phone,

            email:
              order.email,

            totalAmount:
              Number(
                order.totalAmount,
              ),

            status:
              order.status,

            paymentStatus:
              order.paymentStatus,

            canDelete,

            createdAt:
              order.createdAt.toISOString(),

            updatedAt:
              order.updatedAt.toISOString(),

            items:
              order.items.map(
                (item) => {
                  /*
                   * Historical order snapshots are
                   * authoritative. The live Product
                   * relation may be null after a
                   * permanent product deletion.
                   */
                  const productName =
                    item.productName?.trim() ||
                    item.product?.name ||
                    "Deleted product";

                  const productSlug =
                    item.productSlug?.trim() ||
                    item.product?.slug ||
                    "";

                  const productImage =
                    item.productImage ??
                    item.product?.image ??
                    null;

                  const variantLabel =
                    item.variantLabel?.trim() ||
                    item.variant?.label ||
                    null;

                  const variantSku =
                    item.variantSku?.trim() ||
                    item.variant?.sku ||
                    null;

                  const variantWeightGrams =
                    item.variantWeightGrams ??
                    item.variant
                      ?.weightGrams ??
                    null;

                  const variantShippingWeightGrams =
                    item
                      .variantShippingWeightGrams ??
                    item.variant
                      ?.shippingWeightGrams ??
                    null;

                  return {
                    id:
                      item.id,

                    productId:
                      item.productId,

                    variantId:
                      item.variantId,

                    quantity:
                      item.quantity,

                    price:
                      Number(
                        item.price,
                      ),

                    productName,
                    productSlug,
                    productImage,

                    variantLabel,
                    variantSku,

                    variantWeightGrams,

                    variantShippingWeightGrams,

                    createdAt:
                      item.createdAt.toISOString(),

                    /*
                     * Keep this nested shape for
                     * compatibility with the
                     * current admin UI.
                     *
                     * productId is null after the
                     * live Product has been deleted.
                     */
                    product: {
                      id:
                        item.productId ?? "",

                      name:
                        productName,

                      slug:
                        productSlug,

                      image:
                        productImage,
                    },

                    variant:
                      item.variantId
                        ? {
                            id:
                              item.variantId,

                            label:
                              variantLabel,

                            sku:
                              variantSku,

                            weightGrams:
                              variantWeightGrams,

                            shippingWeightGrams:
                              variantShippingWeightGrams,
                          }
                        : null,
                  };
                },
              ),
          };
        },
      ),
      {
        status: 200,
        headers:
          noStoreHeaders(),
      },
    );
  } catch (error) {
    console.error(
      "Failed to load admin orders:",
      error,
    );

    return errorResponse(
      "Failed to load orders.",
      500,
    );
  }
}