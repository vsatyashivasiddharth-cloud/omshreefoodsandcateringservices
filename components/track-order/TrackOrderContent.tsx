"use client";

import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeIndianRupee,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  MapPin,
  Package,
  PackageCheck,
  Phone,
  RefreshCw,
  Search,
  ShoppingBag,
  TriangleAlert,
  Truck,
} from "lucide-react";

import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Container from "@/components/ui/Container";
import Spinner from "@/components/ui/Spinner";
import { formatCurrency } from "@/lib/shop";

interface TrackingCategory {
  id: string;
  name: string;
  slug: string;
}

interface TrackingProduct {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  category: TrackingCategory;
}

interface TrackingOrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  product: TrackingProduct;
}

interface TrackingPackage {
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

interface ShippingDetails {
  provider: string;
  mode: string | null;
  status: string;
  tracking: {
    number: string | null;
    status: string | null;
  };
  quotedAt: string | null;
  pickupScheduledAt: string | null;
  shippedAt: string | null;
  estimatedDeliveryAt: string | null;
  deliveredAt: string | null;
  package: TrackingPackage | null;
}

interface TrackingOrder {
  id: string;
  customerName: string;
  deliveryDestination: {
    city: string;
    state: string;
    pincode: string;
  };
  subtotalAmount: number;
  shippingChargedAmount: number;
  shippingDiscountAmount: number;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  shipping: ShippingDetails;
  items: TrackingOrderItem[];
  createdAt: string;
  updatedAt: string;
}

interface TrackingResponse {
  phone: string;
  count: number;
  orders: TrackingOrder[];
}

interface ErrorResponse {
  error?: string;
  message?: string;
}

interface StatusNoticeProps {
  type: "success" | "error" | "warning" | "info";
  icon: ReactNode;
  title: string;
  children: ReactNode;
}

interface InfoRowProps {
  label: string;
  value: ReactNode;
}

interface StoredRateLimit {
  phone: string;
  blockedUntil: number;
}

const ACTIVE_SHIPMENT_STATUSES = new Set([
  "CREATED",
  "PICKUP_SCHEDULED",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
]);

const RATE_LIMIT_STORAGE_KEY =
  "om-shree-track-order-rate-limit";

const DEFAULT_RETRY_AFTER_SECONDS = 10 * 60;

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function isTrackingResponse(
  value: unknown,
): value is TrackingResponse {
  if (
    !isRecord(value) ||
    typeof value.phone !== "string" ||
    typeof value.count !== "number" ||
    !Array.isArray(value.orders)
  ) {
    return false;
  }

  return value.orders.every(
    (order) =>
      isRecord(order) &&
      typeof order.id === "string" &&
      typeof order.customerName === "string" &&
      typeof order.status === "string" &&
      typeof order.paymentStatus === "string" &&
      typeof order.totalAmount === "number" &&
      typeof order.createdAt === "string" &&
      typeof order.updatedAt === "string" &&
      isRecord(order.deliveryDestination) &&
      isRecord(order.shipping) &&
      Array.isArray(order.items),
  );
}

function formatDate(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatStatus(value: string) {
  return value
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}

function formatCountdown(seconds: number) {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  if (minutes === 0) {
    return `${remainingSeconds} second${
      remainingSeconds === 1 ? "" : "s"
    }`;
  }

  if (remainingSeconds === 0) {
    return `${minutes} minute${
      minutes === 1 ? "" : "s"
    }`;
  }

  return `${minutes} minute${
    minutes === 1 ? "" : "s"
  } ${remainingSeconds} second${
    remainingSeconds === 1 ? "" : "s"
  }`;
}

function parseRetryAfterSeconds(
  response: Response,
) {
  const value = response.headers.get("Retry-After");

  if (!value) {
    return DEFAULT_RETRY_AFTER_SECONDS;
  }

  const numericValue = Number(value);

  if (
    Number.isFinite(numericValue) &&
    numericValue > 0
  ) {
    return Math.ceil(numericValue);
  }

  const retryDate = new Date(value);

  if (!Number.isNaN(retryDate.getTime())) {
    return Math.max(
      1,
      Math.ceil(
        (retryDate.getTime() - Date.now()) / 1000,
      ),
    );
  }

  return DEFAULT_RETRY_AFTER_SECONDS;
}

function readStoredRateLimit(): StoredRateLimit | null {
  try {
    const rawValue = sessionStorage.getItem(
      RATE_LIMIT_STORAGE_KEY,
    );

    if (!rawValue) {
      return null;
    }

    const parsed: unknown = JSON.parse(rawValue);

    if (
      !isRecord(parsed) ||
      typeof parsed.phone !== "string" ||
      typeof parsed.blockedUntil !== "number" ||
      !Number.isFinite(parsed.blockedUntil)
    ) {
      sessionStorage.removeItem(
        RATE_LIMIT_STORAGE_KEY,
      );
      return null;
    }

    if (parsed.blockedUntil <= Date.now()) {
      sessionStorage.removeItem(
        RATE_LIMIT_STORAGE_KEY,
      );
      return null;
    }

    return {
      phone: parsed.phone,
      blockedUntil: parsed.blockedUntil,
    };
  } catch {
    return null;
  }
}

function storeRateLimit(
  phone: string,
  blockedUntil: number,
) {
  try {
    sessionStorage.setItem(
      RATE_LIMIT_STORAGE_KEY,
      JSON.stringify({
        phone,
        blockedUntil,
      } satisfies StoredRateLimit),
    );
  } catch {
    // Tracking still works if browser storage is unavailable.
  }
}

function clearStoredRateLimit() {
  try {
    sessionStorage.removeItem(
      RATE_LIMIT_STORAGE_KEY,
    );
  } catch {
    // Ignore browser storage failures.
  }
}

function getDeliveryMethod(mode: string | null) {
  switch (mode) {
    case "EXPRESS":
      return "Express Delivery";
    case "SURFACE":
      return "Surface Delivery";
    default:
      return "Standard Delivery";
  }
}

function formatWeight(value: number | null) {
  if (
    value === null ||
    !Number.isFinite(value) ||
    value <= 0
  ) {
    return "Not available";
  }

  if (value >= 1000) {
    return `${(value / 1000).toLocaleString(
      "en-IN",
      {
        maximumFractionDigits: 2,
      },
    )} kg`;
  }

  return `${value.toLocaleString("en-IN")} g`;
}

function formatDimension(value: number | null) {
  if (
    value === null ||
    !Number.isFinite(value) ||
    value <= 0
  ) {
    return "—";
  }

  return value.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });
}

function maskOrderId(value: string) {
  if (value.length <= 12) {
    return value;
  }

  return `${value.slice(0, 6)}...${value.slice(-6)}`;
}

function getShipmentMessage(status: string) {
  switch (status.trim().toUpperCase()) {
    case "NOT_CREATED":
      return "The courier shipment has not been created yet.";
    case "QUOTED":
      return "Delivery charges have been calculated. Shipment preparation will begin after payment confirmation.";
    case "CREATED":
      return "Your shipment has been created and is waiting to be prepared for pickup.";
    case "PICKUP_SCHEDULED":
      return "Pickup has been scheduled for your parcel.";
    case "IN_TRANSIT":
      return "Your parcel is travelling toward the delivery destination.";
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
      return "Delivery information will appear when it becomes available.";
  }
}

export default function TrackOrderContent() {
  const [phone, setPhone] = useState("");
  const [result, setResult] =
    useState<TrackingResponse | null>(null);
  const [selectedOrderId, setSelectedOrderId] =
    useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] =
    useState<string | null>(null);
  const [refreshMessage, setRefreshMessage] =
    useState<string | null>(null);
  const [blockedPhone, setBlockedPhone] = useState("");
  const [blockedUntil, setBlockedUntil] = useState(0);
  const [currentTime, setCurrentTime] = useState(
    Date.now(),
  );

  useEffect(() => {
    const storedRateLimit = readStoredRateLimit();

    if (!storedRateLimit) {
      return;
    }

    setBlockedPhone(storedRateLimit.phone);
    setBlockedUntil(storedRateLimit.blockedUntil);
    setCurrentTime(Date.now());
  }, []);

  useEffect(() => {
    if (blockedUntil <= Date.now()) {
      return;
    }

    const timer = window.setInterval(() => {
      const now = Date.now();
      setCurrentTime(now);

      if (now >= blockedUntil) {
        setBlockedPhone("");
        setBlockedUntil(0);
        setError(null);
        setRefreshMessage(null);
        clearStoredRateLimit();
      }
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [blockedUntil]);

  const normalizedPhone = phone.trim();

  const remainingSeconds =
    blockedPhone === normalizedPhone &&
    blockedUntil > currentTime
      ? Math.max(
          0,
          Math.ceil(
            (blockedUntil - currentTime) / 1000,
          ),
        )
      : 0;

  const isRateLimited = remainingSeconds > 0;

  const rateLimitMessage = isRateLimited
    ? `Too many tracking attempts. Please try again in ${formatCountdown(
        remainingSeconds,
      )}.`
    : null;

  const selectedOrder =
    result?.orders.find(
      (order) => order.id === selectedOrderId,
    ) ??
    result?.orders[0] ??
    null;

  const applyRateLimit = useCallback(
    (phoneNumber: string, retryAfterSeconds: number) => {
      const safeRetryAfter = Math.max(
        1,
        Math.ceil(retryAfterSeconds),
      );

      const expiry =
        Date.now() + safeRetryAfter * 1000;

      setBlockedPhone(phoneNumber);
      setBlockedUntil(expiry);
      setCurrentTime(Date.now());
      storeRateLimit(phoneNumber, expiry);
    },
    [],
  );

  const loadOrders = useCallback(
    async (refresh = false) => {
      const normalizedInput = phone.trim();

      if (!/^[6-9]\d{9}$/.test(normalizedInput)) {
        setError(
          "Please enter a valid 10-digit Indian mobile number.",
        );
        return;
      }

      if (
        blockedPhone === normalizedInput &&
        blockedUntil > Date.now()
      ) {
        setCurrentTime(Date.now());
        return;
      }

      if (refresh) {
        setRefreshing(true);
        setRefreshMessage(null);
      } else {
        setLoading(true);
        setResult(null);
        setSelectedOrderId(null);
      }

      setError(null);

      try {
        const response = await fetch(
          "/api/track-order",
          {
            method: "POST",
            cache: "no-store",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              phone: normalizedInput,
            }),
          },
        );

        const data: unknown = await response
          .json()
          .catch(() => null);

        if (response.status === 429) {
          const retryAfterSeconds =
            parseRetryAfterSeconds(response);

          applyRateLimit(
            normalizedInput,
            retryAfterSeconds,
          );

          const message =
            isRecord(data) &&
            typeof data.error === "string"
              ? data.error
              : "Too many tracking attempts.";

          if (refresh) {
            setRefreshMessage(message);
          } else {
            setError(message);
          }

          return;
        }

        if (!response.ok) {
          const errorData = isRecord(data)
            ? (data as ErrorResponse)
            : null;

          throw new Error(
            errorData?.error ||
              errorData?.message ||
              "Unable to retrieve order information.",
          );
        }

        if (!isTrackingResponse(data)) {
          throw new Error(
            "The tracking response was invalid.",
          );
        }

        clearStoredRateLimit();
        setBlockedPhone("");
        setBlockedUntil(0);
        setCurrentTime(Date.now());
        setResult(data);

        setSelectedOrderId((currentOrderId) => {
          if (
            currentOrderId &&
            data.orders.some(
              (order) =>
                order.id === currentOrderId,
            )
          ) {
            return currentOrderId;
          }

          return data.orders[0]?.id ?? null;
        });

        if (refresh) {
          setRefreshMessage(
            "Order information refreshed successfully.",
          );
        }
      } catch (requestError) {
        console.error(
          "Track order request failed:",
          requestError,
        );

        const message =
          requestError instanceof Error
            ? requestError.message
            : "Unable to retrieve order information.";

        if (refresh) {
          setRefreshMessage(message);
        } else {
          setResult(null);
          setSelectedOrderId(null);
          setError(message);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      applyRateLimit,
      blockedPhone,
      blockedUntil,
      phone,
    ],
  );

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    void loadOrders(false);
  }

  function resetSearch() {
    setPhone("");
    setResult(null);
    setSelectedOrderId(null);
    setError(null);
    setRefreshMessage(null);
  }

  const shipping = selectedOrder?.shipping;
  const normalizedShipmentStatus =
    shipping?.status.trim().toUpperCase() ?? "";

  const isShipmentActive =
    ACTIVE_SHIPMENT_STATUSES.has(
      normalizedShipmentStatus,
    );
  const isShipmentCancelled =
    normalizedShipmentStatus === "CANCELLED";
  const isShipmentDelivered =
    normalizedShipmentStatus === "DELIVERED";
  const isShipmentRto =
    normalizedShipmentStatus === "RTO";
  const isShipmentFailed =
    normalizedShipmentStatus === "FAILED";

  const estimatedDeliveryDate = formatDate(
    shipping?.estimatedDeliveryAt ?? null,
  );
  const deliveredDate = formatDate(
    shipping?.deliveredAt ?? null,
  );
  const updatedDate = formatDate(
    selectedOrder?.updatedAt ?? null,
  );

  return (
    <main className="min-h-screen bg-[#FFF8EE] pb-20 pt-28 lg:pt-32">
      <section className="relative overflow-hidden py-12 sm:py-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-28 top-0 h-80 w-80 rounded-full bg-green-100/50 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-[#FFF4DE] blur-3xl"
        />

        <Container>
          <div className="mx-auto max-w-4xl text-center">
            <Badge
              variant="secondary"
              size="md"
              className="gap-2"
            >
              <Truck size={17} aria-hidden="true" />
              Order Tracking
            </Badge>

            <h1 className="mt-6 text-4xl font-bold tracking-tight text-[#6D2E00] sm:text-5xl">
              Track Your Order
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-gray-600">
              Enter the mobile number used while placing your
              order to view your recent orders and delivery
              updates.
            </p>
          </div>

          <Card
            padding="lg"
            className="mx-auto mt-10 max-w-4xl shadow-xl"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FFF4DE] text-[#C89B3C]">
                <Phone size={24} aria-hidden="true" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-[#6D2E00]">
                  Find your recent orders
                </h2>
                <p className="mt-2 leading-7 text-gray-600">
                  Use the same 10-digit mobile number that you
                  entered during checkout.
                </p>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="mt-8 space-y-6"
            >
              <div>
                <label
                  htmlFor="tracking-phone"
                  className="mb-2 block text-sm font-semibold text-[#6D2E00]"
                >
                  Mobile Number
                </label>

                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-5 flex items-center font-semibold text-gray-500">
                    +91
                  </span>

                  <input
                    id="tracking-phone"
                    type="tel"
                    inputMode="numeric"
                    value={phone}
                    onChange={(event) => {
                      const digits =
                        event.target.value.replace(
                          /\D/g,
                          "",
                        );

                      setPhone(digits.slice(0, 10));
                      setError(null);
                      setRefreshMessage(null);
                    }}
                    required
                    autoComplete="tel-national"
                    placeholder="Enter 10-digit mobile number"
                    maxLength={10}
                    disabled={loading || refreshing}
                    className="h-14 w-full rounded-2xl border border-[#F3DFC2] bg-white pl-16 pr-5 text-[#6D2E00] outline-none transition placeholder:text-gray-400 focus:border-[#C89B3C] focus:ring-4 focus:ring-[#C89B3C]/15 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>
              </div>

              {(rateLimitMessage || error) && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-700"
                >
                  <TriangleAlert
                    size={20}
                    className="mt-0.5 shrink-0"
                    aria-hidden="true"
                  />
                  <p className="text-sm leading-6">
                    {rateLimitMessage ?? error}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={
                  loading ||
                  refreshing ||
                  isRateLimited
                }
                className="inline-flex h-14 w-full items-center justify-center gap-3 rounded-full bg-[#6D2E00] px-8 text-lg font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#8B4513] hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-[#6D2E00]/20 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {loading ? (
                  <>
                    <Spinner size="sm" />
                    Finding Orders...
                  </>
                ) : isRateLimited ? (
                  <>
                    <Clock3 size={20} aria-hidden="true" />
                    Try Again in{" "}
                    {formatCountdown(remainingSeconds)}
                  </>
                ) : (
                  <>
                    <Search size={20} aria-hidden="true" />
                    Track My Order
                  </>
                )}
              </button>
            </form>
          </Card>

          {result && result.orders.length === 0 && (
            <Card
              padding="lg"
              className="mx-auto mt-10 max-w-4xl text-center shadow-lg"
            >
              <Package
                size={44}
                className="mx-auto text-[#C89B3C]"
                aria-hidden="true"
              />
              <h2 className="mt-5 text-2xl font-bold text-[#6D2E00]">
                No orders found
              </h2>
              <p className="mx-auto mt-3 max-w-xl leading-7 text-gray-600">
                We could not find a recent order linked to{" "}
                {result.phone}. Check the number and try again.
              </p>
              <button
                type="button"
                onClick={resetSearch}
                className="mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-full border-2 border-[#6D2E00] bg-white px-7 font-semibold text-[#6D2E00] transition hover:bg-[#6D2E00] hover:text-white"
              >
                <ArrowLeft size={18} aria-hidden="true" />
                Try Another Number
              </button>
            </Card>
          )}

          {result &&
            result.orders.length > 0 &&
            selectedOrder &&
            shipping && (
              <div className="mx-auto mt-10 max-w-5xl space-y-8">
                <Card padding="lg" className="shadow-xl">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <Badge
                        variant="success"
                        size="sm"
                        className="gap-2"
                      >
                        <CheckCircle2
                          size={16}
                          aria-hidden="true"
                        />
                        {result.count === 1
                          ? "1 Order Found"
                          : `${result.count} Orders Found`}
                      </Badge>

                      <h2 className="mt-4 text-3xl font-bold text-[#6D2E00]">
                        Hello, {selectedOrder.customerName}
                      </h2>
                      <p className="mt-2 text-sm text-gray-500">
                        Orders linked to {result.phone}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          void loadOrders(true);
                        }}
                        disabled={
                          refreshing || isRateLimited
                        }
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-full border-2 border-[#6D2E00] bg-white px-5 text-sm font-semibold text-[#6D2E00] transition hover:bg-[#6D2E00] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isRateLimited ? (
                          <Clock3
                            size={17}
                            aria-hidden="true"
                          />
                        ) : (
                          <RefreshCw
                            size={17}
                            className={
                              refreshing
                                ? "animate-spin"
                                : ""
                            }
                            aria-hidden="true"
                          />
                        )}
                        {refreshing
                          ? "Refreshing..."
                          : isRateLimited
                            ? `Wait ${formatCountdown(
                                remainingSeconds,
                              )}`
                            : "Refresh"}
                      </button>

                      <button
                        type="button"
                        onClick={resetSearch}
                        className="inline-flex h-11 items-center justify-center rounded-full bg-[#6D2E00] px-5 text-sm font-semibold text-white transition hover:bg-[#8B4513]"
                      >
                        Change Number
                      </button>
                    </div>
                  </div>

                  {(rateLimitMessage ||
                    refreshMessage) && (
                    <div
                      role={
                        rateLimitMessage
                          ? "alert"
                          : "status"
                      }
                      aria-live="polite"
                      className={`mt-5 rounded-2xl border px-5 py-4 text-sm font-medium ${
                        rateLimitMessage
                          ? "border-red-200 bg-red-50 text-red-700"
                          : refreshMessage?.includes(
                                "successfully",
                              )
                            ? "border-green-200 bg-green-50 text-green-800"
                            : "border-red-200 bg-red-50 text-red-700"
                      }`}
                    >
                      {rateLimitMessage ??
                        refreshMessage}
                    </div>
                  )}
                </Card>

                {result.orders.length > 1 && (
                  <Card padding="lg" className="shadow-lg">
                    <h2 className="text-2xl font-bold text-[#6D2E00]">
                      Select an order
                    </h2>

                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      {result.orders.map((order) => {
                        const selected =
                          order.id === selectedOrder.id;

                        return (
                          <button
                            key={order.id}
                            type="button"
                            onClick={() => {
                              setSelectedOrderId(order.id);
                              setRefreshMessage(null);
                            }}
                            className={`rounded-2xl border p-5 text-left transition ${
                              selected
                                ? "border-[#C89B3C] bg-[#FFF4DE] shadow-md"
                                : "border-[#F3DFC2] bg-white hover:border-[#C89B3C]/70"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                                  Order
                                </p>
                                <p className="mt-1 font-semibold text-[#6D2E00]">
                                  {maskOrderId(order.id)}
                                </p>
                              </div>

                              <Badge
                                variant={
                                  order.shipping.status ===
                                  "DELIVERED"
                                    ? "success"
                                    : "secondary"
                                }
                                size="sm"
                              >
                                {formatStatus(
                                  order.shipping.status,
                                )}
                              </Badge>
                            </div>

                            <div className="mt-4 flex items-center justify-between gap-4 text-sm">
                              <span className="text-gray-500">
                                {formatDate(order.createdAt)}
                              </span>
                              <span className="font-bold text-[#6D2E00]">
                                {formatCurrency(
                                  order.totalAmount,
                                )}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </Card>
                )}

                <Card padding="lg" className="shadow-xl">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                        Selected Order
                      </p>
                      <h2 className="mt-2 break-all text-2xl font-bold text-[#6D2E00]">
                        {selectedOrder.id}
                      </h2>
                      <p className="mt-2 text-sm text-gray-500">
                        Placed on{" "}
                        {formatDate(selectedOrder.createdAt)}
                      </p>
                    </div>

                    <Badge
                      variant={
                        isShipmentDelivered
                          ? "success"
                          : "secondary"
                      }
                      size="md"
                    >
                      {formatStatus(shipping.status)}
                    </Badge>
                  </div>

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
                      The courier shipment associated with this
                      order has been cancelled. Please contact
                      customer support for assistance.
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
                      Your order has been delivered successfully
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
                      title={formatStatus(shipping.status)}
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
                      The parcel is being returned to the sender.
                      Please contact customer support.
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
                      The shipment could not proceed. Please
                      contact customer support.
                    </StatusNotice>
                  )}

                  {!isShipmentActive &&
                    !isShipmentCancelled &&
                    !isShipmentDelivered &&
                    !isShipmentRto &&
                    !isShipmentFailed && (
                      <StatusNotice
                        type="info"
                        icon={
                          <Package
                            size={22}
                            aria-hidden="true"
                          />
                        }
                        title={formatStatus(shipping.status)}
                      >
                        {getShipmentMessage(shipping.status)}
                      </StatusNotice>
                    )}

                  <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    <SummaryCard
                      icon={
                        <Package
                          size={21}
                          aria-hidden="true"
                        />
                      }
                      label="Order Status"
                      value={formatStatus(
                        selectedOrder.status,
                      )}
                    />
                    <SummaryCard
                      icon={
                        <Truck
                          size={21}
                          aria-hidden="true"
                        />
                      }
                      label="Delivery Status"
                      value={formatStatus(shipping.status)}
                    />
                    <SummaryCard
                      icon={
                        <CreditCard
                          size={21}
                          aria-hidden="true"
                        />
                      }
                      label="Payment"
                      value={
                        selectedOrder.paymentMethod ||
                        "Prepaid"
                      }
                    />
                    <SummaryCard
                      icon={
                        <BadgeIndianRupee
                          size={21}
                          aria-hidden="true"
                        />
                      }
                      label="Total"
                      value={formatCurrency(
                        selectedOrder.totalAmount,
                      )}
                    />
                  </div>
                </Card>

                <div className="grid gap-8 lg:grid-cols-2">
                  <Card padding="lg" className="shadow-lg">
                    <div className="flex items-center gap-3">
                      <Truck
                        size={24}
                        className="text-[#C89B3C]"
                        aria-hidden="true"
                      />
                      <h2 className="text-2xl font-bold text-[#6D2E00]">
                        Shipment Details
                      </h2>
                    </div>

                    <div className="mt-7 space-y-5">
                      <InfoRow
                        label="Delivery Method"
                        value={getDeliveryMethod(
                          shipping.mode,
                        )}
                      />
                      <InfoRow
                        label="Current Status"
                        value={formatStatus(
                          shipping.status,
                        )}
                      />

                      {shipping.tracking.status && (
                        <InfoRow
                          label="Latest Update"
                          value={formatStatus(
                            shipping.tracking.status,
                          )}
                        />
                      )}

                      {shipping.tracking.number && (
                        <InfoRow
                          label="Tracking Number"
                          value={
                            <span className="break-all">
                              {shipping.tracking.number}
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

                      {formatDate(shipping.shippedAt) && (
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
                          value={estimatedDeliveryDate}
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
                          label="Last Updated"
                          value={updatedDate}
                        />
                      )}
                    </div>
                  </Card>

                  <Card padding="lg" className="shadow-lg">
                    <div className="flex items-center gap-3">
                      <MapPin
                        size={24}
                        className="text-[#C89B3C]"
                        aria-hidden="true"
                      />
                      <h2 className="text-2xl font-bold text-[#6D2E00]">
                        Delivery Destination
                      </h2>
                    </div>

                    <div className="mt-7 space-y-5">
                      <InfoRow
                        label="Customer"
                        value={selectedOrder.customerName}
                      />
                      <InfoRow
                        label="City"
                        value={
                          selectedOrder.deliveryDestination.city
                        }
                      />
                      <InfoRow
                        label="State"
                        value={
                          selectedOrder.deliveryDestination.state
                        }
                      />
                      <InfoRow
                        label="Pincode"
                        value={
                          selectedOrder.deliveryDestination
                            .pincode
                        }
                      />
                    </div>
                  </Card>
                </div>

                <div className="grid gap-8 lg:grid-cols-2">
                  <Card padding="lg" className="shadow-lg">
                    <div className="flex items-center gap-3">
                      <ShoppingBag
                        size={24}
                        className="text-[#C89B3C]"
                        aria-hidden="true"
                      />
                      <h2 className="text-2xl font-bold text-[#6D2E00]">
                        Products
                      </h2>
                    </div>

                    <div className="mt-7 space-y-4">
                      {selectedOrder.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-start justify-between gap-5 border-b border-[#F3DFC2] pb-4 last:border-b-0 last:pb-0"
                        >
                          <div>
                            <p className="font-semibold text-[#6D2E00]">
                              {item.product.name}
                            </p>
                            <p className="mt-1 text-sm text-gray-500">
                              Quantity: {item.quantity}
                            </p>
                          </div>
                          <span className="shrink-0 font-semibold text-[#6D2E00]">
                            {formatCurrency(item.lineTotal)}
                          </span>
                        </div>
                      ))}

                      <div className="border-t border-[#F3DFC2] pt-5">
                        <InfoRow
                          label="Subtotal"
                          value={formatCurrency(
                            selectedOrder.subtotalAmount,
                          )}
                        />

                        <div className="mt-4">
                          <InfoRow
                            label="Delivery Charge"
                            value={
                              selectedOrder.shippingChargedAmount ===
                              0
                                ? "FREE"
                                : formatCurrency(
                                    selectedOrder.shippingChargedAmount,
                                  )
                            }
                          />
                        </div>

                        {selectedOrder.shippingDiscountAmount >
                          0 && (
                          <div className="mt-4">
                            <InfoRow
                              label="Delivery Discount"
                              value={`-${formatCurrency(
                                selectedOrder.shippingDiscountAmount,
                              )}`}
                            />
                          </div>
                        )}

                        <div className="mt-5 border-t border-[#F3DFC2] pt-5">
                          <InfoRow
                            label="Grand Total"
                            value={
                              <span className="text-xl text-[#C89B3C]">
                                {formatCurrency(
                                  selectedOrder.totalAmount,
                                )}
                              </span>
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card padding="lg" className="shadow-lg">
                    <div className="flex items-center gap-3">
                      <Package
                        size={24}
                        className="text-[#C89B3C]"
                        aria-hidden="true"
                      />
                      <h2 className="text-2xl font-bold text-[#6D2E00]">
                        Package Information
                      </h2>
                    </div>

                    {shipping.package ? (
                      <div className="mt-7 space-y-5">
                        <InfoRow
                          label="Package"
                          value={shipping.package.name}
                        />
                        <InfoRow
                          label="Packed Weight"
                          value={formatWeight(
                            shipping.package
                              .packedWeightGrams,
                          )}
                        />
                        <InfoRow
                          label="Dimensions"
                          value={`${formatDimension(
                            shipping.package.dimensions
                              .lengthCm,
                          )} × ${formatDimension(
                            shipping.package.dimensions
                              .breadthCm,
                          )} × ${formatDimension(
                            shipping.package.dimensions
                              .heightCm,
                          )} cm`}
                        />
                      </div>
                    ) : (
                      <p className="mt-7 leading-7 text-gray-600">
                        Package information is not available yet.
                      </p>
                    )}
                  </Card>
                </div>

                <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <Link
                    href="/"
                    className="inline-flex h-13 items-center justify-center gap-2 rounded-full border-2 border-[#6D2E00] bg-white px-7 font-semibold text-[#6D2E00] transition hover:bg-[#6D2E00] hover:text-white"
                  >
                    <ArrowLeft
                      size={19}
                      aria-hidden="true"
                    />
                    Back to Home
                  </Link>

                  <Link
                    href="/shop"
                    className="inline-flex h-13 items-center justify-center gap-2 rounded-full bg-[#6D2E00] px-7 font-semibold text-white shadow-lg transition hover:bg-[#8B4513]"
                  >
                    <ShoppingBag
                      size={19}
                      aria-hidden="true"
                    />
                    Continue Shopping
                  </Link>
                </div>
              </div>
            )}

          {!result && !loading && (
            <Card
              padding="lg"
              className="mx-auto mt-10 max-w-4xl border border-[#F3DFC2] bg-[#FFFDF8] text-center shadow-lg"
            >
              <CalendarDays
                size={42}
                className="mx-auto text-[#C89B3C]"
                aria-hidden="true"
              />
              <h2 className="mt-5 text-2xl font-bold text-[#6D2E00]">
                Your recent orders will appear here
              </h2>
              <p className="mx-auto mt-3 max-w-xl leading-7 text-gray-600">
                Enter the mobile number used during checkout to
                see recent order and shipment information.
              </p>
              <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
                <Clock3 size={17} aria-hidden="true" />
                Shipment information is updated automatically.
              </div>
            </Card>
          )}
        </Container>
      </section>
    </main>
  );
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
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
          <p className="text-sm text-gray-500">{label}</p>
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

function StatusNotice({
  type,
  icon,
  title,
  children,
}: StatusNoticeProps) {
  const styles = {
    success: {
      card: "border-green-200 bg-green-50",
      icon: "text-green-600",
      title: "text-green-800",
      text: "text-green-700",
    },
    error: {
      card: "border-red-200 bg-red-50",
      icon: "text-red-600",
      title: "text-red-800",
      text: "text-red-700",
    },
    warning: {
      card: "border-amber-200 bg-amber-50",
      icon: "text-amber-600",
      title: "text-amber-800",
      text: "text-amber-700",
    },
    info: {
      card: "border-[#F3DFC2] bg-[#FFFDF8]",
      icon: "text-[#C89B3C]",
      title: "text-[#6D2E00]",
      text: "text-gray-600",
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
          <h3 className={`font-semibold ${style.title}`}>
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
