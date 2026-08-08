"use client";

import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BadgeIndianRupee,
  CheckCircle2,
  Clock3,
  CreditCard,
  ImageOff,
  MapPin,
  Package,
  PackageCheck,
  Phone,
  RefreshCw,
  ShoppingBag,
  TriangleAlert,
  Truck,
} from "lucide-react";

import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Container from "@/components/ui/Container";
import Spinner from "@/components/ui/Spinner";
import {
  formatCurrency,
  shopConfig,
} from "@/lib/shop";

interface OrderCategory {
  id: string;
  name: string;
  slug: string;
}

interface OrderProduct {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  category: OrderCategory;
}

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  createdAt: string;
  product: OrderProduct;
}

interface DeliveryAddress {
  address: string;
  city: string;
  state: string;
  pincode: string;
}

interface ShippingPackageDetails {
  id: string;
  name: string;
  code: string;
  packedWeightGrams: number | null;

  dimensions: {
    lengthCm: number | null;
    breadthCm: number | null;
    heightCm: number | null;
  };
}

interface TrackingDetails {
  number: string | null;
  status: string | null;
}

interface OrderShippingDetails {
  mode: string | null;
  status: string;

  quotedAt: string | null;
  pickupScheduledAt: string | null;
  shippedAt: string | null;
  estimatedDeliveryAt: string | null;
  deliveredAt: string | null;

  tracking: TrackingDetails;

  package:
    | ShippingPackageDetails
    | null;
}

interface OrderDetails {
  id: string;

  customerName: string;
  phone: string;
  email: string | null;

  deliveryAddress: DeliveryAddress;

  subtotalAmount: number;
  shippingEstimatedAmount: number;
  shippingChargedAmount: number;
  shippingDiscountAmount: number;
  totalAmount: number;

  status: string;
  paymentStatus: string;
  paymentMethod: string | null;

  shipping: OrderShippingDetails;

  items: OrderItem[];

  createdAt: string;
  updatedAt: string;
}

interface ErrorResponse {
  error?: string;
  message?: string;
}

interface InfoRowProps {
  label: string;
  value: ReactNode;
}

interface DetailCardProps {
  icon: ReactNode;
  label: string;
  value: string;
}

const ACTIVE_SHIPMENT_STATUSES =
  new Set([
    "CREATED",
    "PICKUP_SCHEDULED",
    "IN_TRANSIT",
    "OUT_FOR_DELIVERY",
  ]);

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function isNullableString(
  value: unknown,
): value is string | null {
  return (
    typeof value === "string" ||
    value === null
  );
}

function isNullableNumber(
  value: unknown,
): value is number | null {
  return (
    value === null ||
    (typeof value === "number" &&
      Number.isFinite(value))
  );
}

function isOrderCategory(
  value: unknown,
): value is OrderCategory {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.slug === "string"
  );
}

function isOrderProduct(
  value: unknown,
): value is OrderProduct {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.slug === "string" &&
    isNullableString(value.image) &&
    isOrderCategory(value.category)
  );
}

function isOrderItem(
  value: unknown,
): value is OrderItem {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    Number.isInteger(value.quantity) &&
    Number(value.quantity) > 0 &&
    typeof value.unitPrice ===
      "number" &&
    Number.isFinite(value.unitPrice) &&
    value.unitPrice >= 0 &&
    typeof value.lineTotal ===
      "number" &&
    Number.isFinite(value.lineTotal) &&
    value.lineTotal >= 0 &&
    typeof value.createdAt ===
      "string" &&
    isOrderProduct(value.product)
  );
}

function isDeliveryAddress(
  value: unknown,
): value is DeliveryAddress {
  return (
    isRecord(value) &&
    typeof value.address === "string" &&
    typeof value.city === "string" &&
    typeof value.state === "string" &&
    typeof value.pincode === "string"
  );
}

function isShippingPackage(
  value: unknown,
): value is ShippingPackageDetails {
  if (!isRecord(value)) {
    return false;
  }

  const dimensions =
    value.dimensions;

  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.code === "string" &&
    isNullableNumber(
      value.packedWeightGrams,
    ) &&
    isRecord(dimensions) &&
    isNullableNumber(
      dimensions.lengthCm,
    ) &&
    isNullableNumber(
      dimensions.breadthCm,
    ) &&
    isNullableNumber(
      dimensions.heightCm,
    )
  );
}

function isTrackingDetails(
  value: unknown,
): value is TrackingDetails {
  return (
    isRecord(value) &&
    isNullableString(value.number) &&
    isNullableString(value.status)
  );
}

function isShippingDetails(
  value: unknown,
): value is OrderShippingDetails {
  return (
    isRecord(value) &&
    isNullableString(value.mode) &&
    typeof value.status ===
      "string" &&
    isNullableString(value.quotedAt) &&
    isNullableString(
      value.pickupScheduledAt,
    ) &&
    isNullableString(value.shippedAt) &&
    isNullableString(
      value.estimatedDeliveryAt,
    ) &&
    isNullableString(
      value.deliveredAt,
    ) &&
    isTrackingDetails(
      value.tracking,
    ) &&
    (value.package === null ||
      isShippingPackage(
        value.package,
      ))
  );
}

function isOrderDetails(
  value: unknown,
): value is OrderDetails {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.customerName ===
      "string" &&
    typeof value.phone === "string" &&
    isNullableString(value.email) &&
    isDeliveryAddress(
      value.deliveryAddress,
    ) &&
    typeof value.subtotalAmount ===
      "number" &&
    Number.isFinite(
      value.subtotalAmount,
    ) &&
    typeof value
      .shippingEstimatedAmount ===
      "number" &&
    Number.isFinite(
      value.shippingEstimatedAmount,
    ) &&
    typeof value
      .shippingChargedAmount ===
      "number" &&
    Number.isFinite(
      value.shippingChargedAmount,
    ) &&
    typeof value
      .shippingDiscountAmount ===
      "number" &&
    Number.isFinite(
      value.shippingDiscountAmount,
    ) &&
    typeof value.totalAmount ===
      "number" &&
    Number.isFinite(
      value.totalAmount,
    ) &&
    typeof value.status === "string" &&
    typeof value.paymentStatus ===
      "string" &&
    isNullableString(
      value.paymentMethod,
    ) &&
    isShippingDetails(
      value.shipping,
    ) &&
    Array.isArray(value.items) &&
    value.items.every(isOrderItem) &&
    typeof value.createdAt ===
      "string" &&
    typeof value.updatedAt ===
      "string"
  );
}

function formatDate(
  value: string | null,
) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(date);
}

function formatStatus(
  value: string,
) {
  return value
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}

function formatWeight(
  value: number | null,
) {
  if (
    value === null ||
    !Number.isFinite(value) ||
    value <= 0
  ) {
    return "Not available";
  }

  if (value >= 1000) {
    return `${(
      value / 1000
    ).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })} kg`;
  }

  return `${value.toLocaleString(
    "en-IN",
  )} g`;
}

function formatDimension(
  value: number | null,
) {
  if (
    value === null ||
    !Number.isFinite(value) ||
    value <= 0
  ) {
    return "—";
  }

  return value.toLocaleString(
    "en-IN",
    {
      maximumFractionDigits: 2,
    },
  );
}

function getDeliveryMethod(
  mode: string | null,
) {
  return mode === "EXPRESS"
    ? "Express Delivery"
    : "Standard Delivery";
}

function getShipmentMessage(
  status: string,
) {
  switch (
    status.trim().toUpperCase()
  ) {
    case "QUOTED":
      return "Your delivery charge has been calculated. The shipment will be created after payment confirmation.";

    case "CREATED":
      return "Your shipment has been created and is waiting to be prepared for pickup.";

    case "PICKUP_SCHEDULED":
      return "Pickup has been scheduled for your parcel.";

    case "IN_TRANSIT":
      return "Your parcel is currently travelling toward the delivery location.";

    case "OUT_FOR_DELIVERY":
      return "Your parcel is out for delivery and should reach you soon.";

    case "DELIVERED":
      return "Your order has been delivered successfully.";

    case "CANCELLED":
      return "The courier shipment associated with this order has been cancelled.";

    case "RTO":
      return "The parcel is being returned to the sender.";

    case "FAILED":
      return "The shipment could not proceed. Please contact customer support.";

    default:
      return "Delivery information will appear here when it becomes available.";
  }
}

interface OrderItemImageProps {
  src: string | null | undefined;
  alt: string;
}

function OrderItemImage({
  src,
  alt,
}: OrderItemImageProps) {
  const normalizedSrc =
    src?.trim() ?? "";

  const [
    failedSrc,
    setFailedSrc,
  ] = useState<string | null>(null);

  const showPlaceholder =
    !normalizedSrc ||
    failedSrc === normalizedSrc;

  if (showPlaceholder) {
    return (
      <div
        className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#FFF8EA] via-[#FFF4DE] to-[#FFE8BF]"
        aria-label={`${alt} image unavailable`}
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#C89B3C]/20 bg-white/75 shadow-sm">
          <ImageOff
            size={20}
            className="text-[#C89B3C]"
            aria-hidden="true"
          />
        </div>
      </div>
    );
  }

  return (
    <Image
      src={normalizedSrc}
      alt={alt}
      fill
      sizes="80px"
      className="object-cover"
      onError={() => {
        setFailedSrc(normalizedSrc);
      }}
    />
  );
}

export default function OrderSuccessContent() {
  const searchParams =
    useSearchParams();

  const initialOrderId =
    searchParams
      .get("id")
      ?.trim() ?? "";

  const initialOrderAccessToken =
    searchParams
      .get("token")
      ?.trim() ?? "";

  const [
    orderAccess,
  ] = useState(() => ({
    orderId: initialOrderId,
    orderAccessToken:
      initialOrderAccessToken,
  }));

  const {
    orderId,
    orderAccessToken,
  } = orderAccess;

  const [order, setOrder] =
    useState<OrderDetails | null>(
      null,
    );

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [
    refreshNotification,
    setRefreshNotification,
  ] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    if (
      !orderId ||
      !orderAccessToken
    ) {
      return;
    }

    /*
     * The order access token is a bearer secret.
     *
     * Keep it only in this mounted component after
     * initial page loading and remove it from the
     * visible browser URL.
     *
     * history.replaceState does not reload the page.
     */
    window.history.replaceState(
      window.history.state,
      "",
      "/order-success",
    );
  }, [
    orderAccessToken,
    orderId,
  ]);

  const loadOrder = useCallback(
    async (
      signal?: AbortSignal,
      isRefresh = false,
    ) => {
      if (!orderId || !orderAccessToken) {
        setOrder(null);
        setError(
          "The secure order link is incomplete or invalid.",
        );
        setLoading(false);
        return;
      }

      if (isRefresh) {
        setRefreshing(true);
        setRefreshNotification(null);
      } else {
        setLoading(true);
      }

      try {
        const response = await fetch(
          `/api/orders/${encodeURIComponent(
            orderId,
          )}?token=${encodeURIComponent(
            orderAccessToken,
          )}`,
          {
            method: "GET",
            cache: "no-store",
            signal,
          },
        );

        const data: unknown =
          await response
            .json()
            .catch(() => null);

        if (!response.ok) {
          const errorData =
            isRecord(data)
              ? (data as ErrorResponse)
              : null;

          throw new Error(
            errorData?.error ||
              errorData?.message ||
              "Unable to load your order.",
          );
        }

        if (!isOrderDetails(data)) {
          throw new Error(
            "The order confirmation response was invalid.",
          );
        }

        setOrder(data);
        setError(null);

        if (isRefresh) {
          setRefreshNotification({
            type: "success",
            message:
              "Delivery information refreshed successfully.",
          });
        }
      } catch (loadError) {
        if (
          loadError instanceof
            DOMException &&
          loadError.name ===
            "AbortError"
        ) {
          return;
        }

        console.error(
          "Failed to load order:",
          loadError,
        );

        const message =
          loadError instanceof Error
            ? loadError.message
            : "Unable to load your order.";

        if (isRefresh) {
          /*
           * Keep the previously loaded order visible when
           * only a refresh request fails.
           */
          setRefreshNotification({
            type: "error",
            message,
          });
        } else {
          setOrder(null);
          setError(message);
        }
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [
      orderAccessToken,
      orderId,
    ],
  );

  useEffect(() => {
    const controller =
      new AbortController();

    const timeoutId =
      window.setTimeout(() => {
        void loadOrder(
          controller.signal,
          false,
        );
      }, 0);

    return () => {
      window.clearTimeout(
        timeoutId,
      );
      controller.abort();
    };
  }, [loadOrder]);

  if (loading) {
    return (
      <section className="py-16 sm:py-20">
        <Container>
          <Card
            padding="lg"
            className="flex min-h-[420px] flex-col items-center justify-center text-center shadow-xl"
          >
            <Spinner size="lg" />

            <h1 className="mt-6 text-2xl font-bold text-[#6D2E00]">
              Loading Your Order
            </h1>

            <p className="mt-3 text-gray-500">
              Please wait while we
              prepare your confirmation.
            </p>
          </Card>
        </Container>
      </section>
    );
  }

  if (error || !order) {
    return (
      <section className="py-16 sm:py-20">
        <Container>
          <Card
            padding="lg"
            className="mx-auto max-w-3xl text-center shadow-xl"
          >
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
              <TriangleAlert
                size={42}
                className="text-red-500"
                aria-hidden="true"
              />
            </div>

            <h1 className="mt-6 text-3xl font-bold text-[#6D2E00]">
              Order Details Unavailable
            </h1>

            <p className="mx-auto mt-4 max-w-xl leading-7 text-gray-600">
              {error ||
                "We could not securely load the requested order."}
            </p>

            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/shop"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#6D2E00] px-7 font-semibold text-white transition hover:bg-[#4E1F00] focus:outline-none focus:ring-4 focus:ring-[#C89B3C]/20"
              >
                <ShoppingBag
                  size={18}
                  aria-hidden="true"
                />

                Continue Shopping
              </Link>

              <Link
                href="/"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full border-2 border-[#6D2E00] px-7 font-semibold text-[#6D2E00] transition hover:bg-[#6D2E00] hover:text-white focus:outline-none focus:ring-4 focus:ring-[#C89B3C]/20"
              >
                <ArrowLeft
                  size={18}
                  aria-hidden="true"
                />

                Back to Home
              </Link>
            </div>
          </Card>
        </Container>
      </section>
    );
  }

  const totalItems =
    order.items.reduce(
      (total, item) =>
        total + item.quantity,
      0,
    );

  const supportPhone =
    shopConfig.supportPhone;

  const shipping =
    order.shipping;

  const shippingPackage =
    shipping.package;

  const trackingNumber =
    shipping.tracking.number;

  const rawTrackingStatus =
    shipping.tracking.status;

  const normalizedShipmentStatus =
    shipping.status
      .trim()
      .toUpperCase();

  const isShipmentActive =
    ACTIVE_SHIPMENT_STATUSES.has(
      normalizedShipmentStatus,
    );

  const isShipmentCancelled =
    normalizedShipmentStatus ===
    "CANCELLED";

  const isShipmentDelivered =
    normalizedShipmentStatus ===
    "DELIVERED";

  const isShipmentRto =
    normalizedShipmentStatus ===
    "RTO";

  const isShipmentFailed =
    normalizedShipmentStatus ===
    "FAILED";

  const estimatedDeliveryDate =
    formatDate(
      shipping.estimatedDeliveryAt,
    );

  const deliveredDate =
    formatDate(
      shipping.deliveredAt,
    );

  const updatedDate =
    formatDate(order.updatedAt);

  return (
    <section className="relative overflow-hidden py-12 sm:py-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-green-100/60 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[#FFF4DE]/80 blur-3xl"
      />

      <Container>
        <Card
          padding="lg"
          className="relative overflow-hidden text-center shadow-xl"
        >
          <div className="relative mx-auto flex max-w-4xl flex-col items-center py-4 sm:py-8">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-green-100 ring-8 ring-green-50 sm:h-28 sm:w-28">
              <CheckCircle2
                size={64}
                className="text-green-600 sm:h-[70px] sm:w-[70px]"
                aria-hidden="true"
              />
            </div>

            <Badge
              variant="success"
              size="md"
              className="mt-8 gap-2"
            >
              <CheckCircle2
                size={17}
                aria-hidden="true"
              />

              Order Confirmed
            </Badge>

            <h1 className="mt-6 text-4xl font-bold tracking-tight text-[#6D2E00] sm:text-5xl">
              Thank You,{" "}
              {order.customerName}!
            </h1>

            <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-gray-600">
              We have received your order
              successfully. You can review
              your payment, products and
              latest delivery information
              below.
            </p>

            <div
              role="status"
              className="mt-8 rounded-3xl border border-green-200 bg-green-50 px-6 py-5 shadow-sm"
            >
              <p className="font-semibold text-green-800">
                Order reference
              </p>

              <p className="mt-2 break-all text-sm text-green-700 sm:text-base">
                {order.id}
              </p>

              {formatDate(
                order.createdAt,
              ) && (
                <p className="mt-2 text-sm text-green-700">
                  Placed on{" "}
                  {formatDate(
                    order.createdAt,
                  )}
                </p>
              )}
            </div>
          </div>
        </Card>

        <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_400px]">
          <div className="space-y-8">
            <Card
              padding="lg"
              className="shadow-lg"
            >
              <div className="flex flex-col gap-3 border-b border-[#F3DFC2] pb-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-[#6D2E00] sm:text-3xl">
                    Your Order
                  </h2>

                  <p className="mt-2 text-gray-500">
                    {order.items.length}{" "}
                    {order.items.length ===
                    1
                      ? "product"
                      : "products"}{" "}
                    · {totalItems}{" "}
                    {totalItems === 1
                      ? "item"
                      : "items"}
                  </p>
                </div>

                <Badge
                  variant="secondary"
                  size="sm"
                >
                  {formatStatus(
                    order.status,
                  )}
                </Badge>
              </div>

              <div className="mt-6 space-y-4">
                {order.items.map(
                  (item) => (
                    <Card
                      key={item.id}
                      variant="filled"
                      padding="sm"
                      className="shadow-none"
                    >
                      <div className="flex gap-4">
                        <Link
                          href={`/shop/${item.product.slug}`}
                          aria-label={`View ${item.product.name}`}
                          className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-[#FFF4DE] focus:outline-none focus:ring-4 focus:ring-[#C89B3C]/20"
                        >
                          <OrderItemImage
                            src={
                              item.product
                                .image
                            }
                            alt={
                              item.product
                                .name
                            }
                          />
                        </Link>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <Link
                                href={`/shop/${item.product.slug}`}
                                className="rounded font-semibold text-[#6D2E00] transition-colors hover:text-[#C89B3C] focus:outline-none focus:ring-2 focus:ring-[#C89B3C]/30"
                              >
                                {
                                  item.product
                                    .name
                                }
                              </Link>

                              <p className="mt-1 text-xs uppercase tracking-wide text-[#C89B3C]">
                                {
                                  item.product
                                    .category
                                    .name
                                }
                              </p>

                              <p className="mt-2 text-sm text-gray-500">
                                {formatCurrency(
                                  item.unitPrice,
                                )}{" "}
                                ×{" "}
                                {item.quantity}
                              </p>
                            </div>

                            <p className="shrink-0 text-lg font-bold text-[#6D2E00]">
                              {formatCurrency(
                                item.lineTotal,
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ),
                )}
              </div>

              <Card
                variant="filled"
                padding="md"
                className="mt-8 shadow-none"
              >
                <div className="space-y-4">
                  <InfoRow
                    label="Subtotal"
                    value={formatCurrency(
                      order.subtotalAmount,
                    )}
                  />

                  <InfoRow
                    label="Delivery Charge"
                    value={
                      order.shippingChargedAmount ===
                      0 ? (
                        <span className="text-green-700">
                          FREE
                        </span>
                      ) : (
                        formatCurrency(
                          order.shippingChargedAmount,
                        )
                      )
                    }
                  />

                  {order.shippingDiscountAmount >
                    0 && (
                    <InfoRow
                      label="Delivery Discount"
                      value={
                        <span className="text-green-700">
                          -
                          {formatCurrency(
                            order.shippingDiscountAmount,
                          )}
                        </span>
                      }
                    />
                  )}

                  <div className="border-t border-[#F3DFC2]" />

                  <InfoRow
                    label="Grand Total"
                    value={
                      <span className="text-2xl font-bold text-[#C89B3C]">
                        {formatCurrency(
                          order.totalAmount,
                        )}
                      </span>
                    }
                  />
                </div>
              </Card>
            </Card>

            <Card
              padding="lg"
              className="shadow-lg"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-[#6D2E00] sm:text-3xl">
                    Delivery Information
                  </h2>

                  <p className="mt-3 leading-7 text-gray-500">
                    Review the latest
                    delivery, payment and
                    package information.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    void loadOrder(
                      undefined,
                      true,
                    );
                  }}
                  disabled={refreshing}
                  className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full border-2 border-[#6D2E00] bg-white px-5 text-sm font-semibold text-[#6D2E00] transition hover:bg-[#6D2E00] hover:text-white focus:outline-none focus:ring-4 focus:ring-[#C89B3C]/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw
                    size={17}
                    aria-hidden="true"
                    className={
                      refreshing
                        ? "animate-spin"
                        : ""
                    }
                  />

                  {refreshing
                    ? "Refreshing..."
                    : "Refresh Delivery Status"}
                </button>
              </div>

              {refreshNotification && (
                <div
                  role={
                    refreshNotification.type ===
                    "error"
                      ? "alert"
                      : "status"
                  }
                  className={`mt-5 rounded-2xl border px-4 py-3 text-sm font-medium ${
                    refreshNotification.type ===
                    "success"
                      ? "border-green-200 bg-green-50 text-green-800"
                      : "border-red-200 bg-red-50 text-red-700"
                  }`}
                >
                  {
                    refreshNotification.message
                  }
                </div>
              )}

              {isShipmentCancelled && (
                <StatusNotice
                  type="error"
                  icon={
                    <TriangleAlert
                      size={22}
                      aria-hidden="true"
                    />
                  }
                  title="Delivery shipment cancelled"
                >
                  The courier shipment
                  associated with this order
                  has been cancelled. Your
                  payment and website order
                  remain recorded. Please
                  contact customer support
                  for assistance or
                  rescheduling.
                </StatusNotice>
              )}

              {isShipmentDelivered && (
                <StatusNotice
                  type="success"
                  icon={
                    <PackageCheck
                      size={22}
                      aria-hidden="true"
                    />
                  }
                  title="Order delivered"
                >
                  Your order has been
                  delivered successfully
                  {deliveredDate
                    ? ` on ${deliveredDate}.`
                    : "."}
                </StatusNotice>
              )}

              {isShipmentActive && (
                <StatusNotice
                  type="info"
                  icon={
                    <Truck
                      size={22}
                      aria-hidden="true"
                    />
                  }
                  title={formatStatus(
                    shipping.status,
                  )}
                >
                  {estimatedDeliveryDate
                    ? `Estimated delivery: ${estimatedDeliveryDate}.`
                    : getShipmentMessage(
                        shipping.status,
                      )}
                </StatusNotice>
              )}

              {isShipmentRto && (
                <StatusNotice
                  type="warning"
                  icon={
                    <Truck
                      size={22}
                      aria-hidden="true"
                    />
                  }
                  title="Returning to sender"
                >
                  The parcel is being
                  returned to the sender.
                  Please contact customer
                  support for assistance.
                </StatusNotice>
              )}

              {isShipmentFailed && (
                <StatusNotice
                  type="error"
                  icon={
                    <TriangleAlert
                      size={22}
                      aria-hidden="true"
                    />
                  }
                  title="Shipment requires attention"
                >
                  The shipment could not
                  proceed. Please contact
                  customer support so the
                  delivery can be reviewed.
                </StatusNotice>
              )}

              <div className="mt-7 grid gap-5 sm:grid-cols-2">
                <DetailCard
                  icon={
                    <Truck
                      size={21}
                      aria-hidden="true"
                    />
                  }
                  label="Delivery Method"
                  value={getDeliveryMethod(
                    shipping.mode,
                  )}
                />

                <DetailCard
                  icon={
                    <Package
                      size={21}
                      aria-hidden="true"
                    />
                  }
                  label="Delivery Status"
                  value={formatStatus(
                    shipping.status,
                  )}
                />

                <DetailCard
                  icon={
                    <CreditCard
                      size={21}
                      aria-hidden="true"
                    />
                  }
                  label="Payment Method"
                  value={
                    order.paymentMethod ||
                    "Prepaid"
                  }
                />

                <DetailCard
                  icon={
                    <BadgeIndianRupee
                      size={21}
                      aria-hidden="true"
                    />
                  }
                  label="Payment Status"
                  value={formatStatus(
                    order.paymentStatus,
                  )}
                />
              </div>

              <Card
                variant="filled"
                padding="md"
                className="mt-7 shadow-none"
              >
                <div className="space-y-4">
                  <InfoRow
                    label="Current Status"
                    value={formatStatus(
                      shipping.status,
                    )}
                  />

                  {rawTrackingStatus && (
                    <InfoRow
                      label="Latest Update"
                      value={formatStatus(
                        rawTrackingStatus,
                      )}
                    />
                  )}

                  {trackingNumber && (
                    <InfoRow
                      label="Tracking Number"
                      value={
                        <span className="break-all">
                          {trackingNumber}
                        </span>
                      }
                    />
                  )}

                  {formatDate(
                    shipping.pickupScheduledAt,
                  ) && (
                    <InfoRow
                      label="Pickup Scheduled"
                      value={formatDate(
                        shipping.pickupScheduledAt,
                      )}
                    />
                  )}

                  {formatDate(
                    shipping.shippedAt,
                  ) && (
                    <InfoRow
                      label="Shipped On"
                      value={formatDate(
                        shipping.shippedAt,
                      )}
                    />
                  )}

                  {estimatedDeliveryDate && (
                    <InfoRow
                      label="Estimated Delivery"
                      value={
                        estimatedDeliveryDate
                      }
                    />
                  )}

                  {deliveredDate && (
                    <InfoRow
                      label="Delivered On"
                      value={deliveredDate}
                    />
                  )}

                  {updatedDate && (
                    <InfoRow
                      label="Last Refreshed"
                      value={updatedDate}
                    />
                  )}
                </div>
              </Card>

              {shippingPackage && (
                <Card
                  variant="filled"
                  padding="md"
                  className="mt-5 shadow-none"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#C89B3C] shadow-sm">
                      <Package
                        size={22}
                        aria-hidden="true"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-[#6D2E00]">
                        Package Information
                      </h3>

                      <p className="mt-1 text-sm text-gray-500">
                        Your products are
                        packed securely for
                        delivery.
                      </p>

                      <div className="mt-4 grid gap-3 text-sm text-gray-600 sm:grid-cols-2">
                        <p>
                          Package:{" "}
                          <span className="font-semibold text-[#6D2E00]">
                            {
                              shippingPackage.name
                            }
                          </span>
                        </p>

                        <p>
                          Packed weight:{" "}
                          <span className="font-semibold text-[#6D2E00]">
                            {formatWeight(
                              shippingPackage.packedWeightGrams,
                            )}
                          </span>
                        </p>

                        <p className="sm:col-span-2">
                          Dimensions:{" "}
                          <span className="font-semibold text-[#6D2E00]">
                            {formatDimension(
                              shippingPackage
                                .dimensions
                                .lengthCm,
                            )}{" "}
                            ×{" "}
                            {formatDimension(
                              shippingPackage
                                .dimensions
                                .breadthCm,
                            )}{" "}
                            ×{" "}
                            {formatDimension(
                              shippingPackage
                                .dimensions
                                .heightCm,
                            )}{" "}
                            cm
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </Card>

            <Card
              padding="lg"
              className="shadow-lg"
            >
              <h2 className="text-2xl font-bold text-[#6D2E00] sm:text-3xl">
                What Happens Next?
              </h2>

              <p className="mt-3 leading-7 text-gray-500">
                Your order and shipment
                information will be updated
                as the delivery progresses.
              </p>

              <div className="mt-8 space-y-6">
                <NextStep
                  icon={
                    <CheckCircle2
                      size={22}
                      aria-hidden="true"
                    />
                  }
                  title="Order Confirmed"
                  description="Your payment and order details have been recorded successfully."
                />

                <NextStep
                  icon={
                    <PackageCheck
                      size={22}
                      aria-hidden="true"
                    />
                  }
                  title="Fresh Preparation"
                  description="Your food will be freshly prepared and packed carefully."
                />

                <NextStep
                  icon={
                    <Truck
                      size={22}
                      aria-hidden="true"
                    />
                  }
                  title="Delivery Updates"
                  description="Use the refresh button above to load the latest information stored for your shipment."
                />
              </div>
            </Card>
          </div>

          <aside className="space-y-8 xl:sticky xl:top-28 xl:self-start">
            <Card
              padding="lg"
              className="shadow-lg"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FFF4DE]">
                  <MapPin
                    size={22}
                    className="text-[#C89B3C]"
                    aria-hidden="true"
                  />
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-[#6D2E00]">
                    Delivery Details
                  </h2>

                  <p className="mt-2 text-sm text-gray-500">
                    Your order will be
                    delivered to this
                    address.
                  </p>
                </div>
              </div>

              <div className="mt-7 space-y-5">
                <InfoRow
                  label="Customer"
                  value={
                    order.customerName
                  }
                />

                <InfoRow
                  label="Phone"
                  value={order.phone}
                />

                {order.email && (
                  <InfoRow
                    label="Email"
                    value={order.email}
                  />
                )}

                <InfoRow
                  label="Address"
                  value={
                    <span className="text-right">
                      {
                        order
                          .deliveryAddress
                          .address
                      }
                      <br />
                      {
                        order
                          .deliveryAddress
                          .city
                      }
                      ,{" "}
                      {
                        order
                          .deliveryAddress
                          .state
                      }{" "}
                      {
                        order
                          .deliveryAddress
                          .pincode
                      }
                    </span>
                  }
                />

                {estimatedDeliveryDate && (
                  <InfoRow
                    label="Estimated Delivery"
                    value={
                      estimatedDeliveryDate
                    }
                  />
                )}
              </div>
            </Card>

            <Card
              padding="lg"
              className="shadow-lg"
            >
              <h2 className="text-2xl font-bold text-[#6D2E00]">
                Need Help?
              </h2>

              <p className="mt-4 leading-7 text-gray-600">
                Contact our support team
                with your order reference
                for assistance.
              </p>

              <Card
                variant="filled"
                padding="md"
                className="mt-7 shadow-none"
              >
                <a
                  href={`tel:${supportPhone}`}
                  className="flex items-center gap-4 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#C89B3C]/20"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FFF4DE]">
                    <Phone
                      size={22}
                      className="text-[#C89B3C]"
                      aria-hidden="true"
                    />
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">
                      Customer Support
                    </p>

                    <p className="mt-1 font-semibold text-[#6D2E00]">
                      +91 {supportPhone}
                    </p>
                  </div>
                </a>
              </Card>

              <Card
                variant="filled"
                padding="md"
                className="mt-5 bg-green-50 shadow-none"
              >
                <div className="flex items-start gap-3">
                  <Clock3
                    size={21}
                    className="mt-0.5 shrink-0 text-green-600"
                    aria-hidden="true"
                  />

                  <div>
                    <p className="font-semibold text-green-800">
                      Business Hours
                    </p>

                    <p className="mt-2 text-sm leading-6 text-green-700">
                      Monday – Sunday
                      <br />
                      9:00 AM – 9:00 PM
                    </p>
                  </div>
                </div>
              </Card>
            </Card>
          </aside>
        </div>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/"
            className="inline-flex h-14 items-center justify-center gap-3 rounded-full border-2 border-[#6D2E00] bg-white px-8 text-lg font-semibold text-[#6D2E00] transition-all duration-300 hover:-translate-y-1 hover:bg-[#6D2E00] hover:text-white focus:outline-none focus:ring-4 focus:ring-[#6D2E00]/20"
          >
            <ArrowLeft
              size={20}
              aria-hidden="true"
            />

            Back to Home
          </Link>

          <Link
            href="/shop"
            className="inline-flex h-14 items-center justify-center gap-3 rounded-full bg-[#6D2E00] px-8 text-lg font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:bg-[#8B4513] hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-[#6D2E00]/20"
          >
            <ShoppingBag
              size={20}
              aria-hidden="true"
            />

            Continue Shopping

            <ArrowRight
              size={20}
              aria-hidden="true"
            />
          </Link>
        </div>
      </Container>
    </section>
  );
}

function DetailCard({
  icon,
  label,
  value,
}: DetailCardProps) {
  return (
    <Card
      variant="filled"
      padding="md"
      className="shadow-none"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#C89B3C] shadow-sm">
          {icon}
        </div>

        <div>
          <p className="text-sm text-gray-500">
            {label}
          </p>

          <p className="mt-1 font-semibold text-[#6D2E00]">
            {value}
          </p>
        </div>
      </div>
    </Card>
  );
}

function InfoRow({
  label,
  value,
}: InfoRowProps) {
  return (
    <div className="flex items-start justify-between gap-5">
      <span className="shrink-0 text-gray-500">
        {label}
      </span>

      <span className="min-w-0 break-words text-right font-semibold text-[#6D2E00]">
        {value}
      </span>
    </div>
  );
}

function NextStep({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4 sm:gap-5">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#FFF4DE] text-[#C89B3C] ring-4 ring-white">
        {icon}
      </div>

      <div>
        <h3 className="font-semibold text-[#6D2E00]">
          {title}
        </h3>

        <p className="mt-2 leading-7 text-gray-600">
          {description}
        </p>
      </div>
    </div>
  );
}

function StatusNotice({
  type,
  icon,
  title,
  children,
}: {
  type:
    | "success"
    | "error"
    | "warning"
    | "info";
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  const styles = {
    success: {
      card:
        "border-green-200 bg-green-50",
      icon:
        "text-green-600",
      title:
        "text-green-800",
      text:
        "text-green-700",
    },

    error: {
      card:
        "border-red-200 bg-red-50",
      icon:
        "text-red-600",
      title:
        "text-red-800",
      text:
        "text-red-700",
    },

    warning: {
      card:
        "border-amber-200 bg-amber-50",
      icon:
        "text-amber-600",
      title:
        "text-amber-800",
      text:
        "text-amber-700",
    },

    info: {
      card:
        "border-[#F3DFC2] bg-[#FFFDF8]",
      icon:
        "text-[#C89B3C]",
      title:
        "text-[#6D2E00]",
      text:
        "text-gray-600",
    },
  } as const;

  const style = styles[type];

  return (
    <Card
      variant="filled"
      padding="md"
      className={`mt-7 border shadow-none ${style.card}`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm ${style.icon}`}
        >
          {icon}
        </div>

        <div>
          <h3
            className={`font-semibold ${style.title}`}
          >
            {title}
          </h3>

          <p
            className={`mt-2 text-sm leading-6 ${style.text}`}
          >
            {children}
          </p>
        </div>
      </div>
    </Card>
  );
}