"use client";

import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  CalendarDays,
  Mail,
  MapPin,
  Package,
  PackagePlus,
  Phone,
  ReceiptText,
  RefreshCw,
  User,
} from "lucide-react";

import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Container from "@/components/ui/Container";
import Spinner from "@/components/ui/Spinner";
import { formatCurrency } from "@/lib/shop";

type OrderStatus =
  | "PENDING"
  | "PAID"
  | "PREPARING"
  | "PACKED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

type PaymentStatus =
  | "PENDING"
  | "SUCCESS"
  | "FAILED"
  | "REFUNDED";

type ShippingProvider =
  | "DELHIVERY"
  | "MANUAL";

type ManualShipmentStatus =
  | "CREATED"
  | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED";


interface OrderProduct {
  id: string;
  name: string;
  slug?: string;
  image?: string | null;
  price?: number;
}

interface OrderVariant {
  id: string;
  label: string | null;
  sku: string | null;
  weightGrams: number | null;
  shippingWeightGrams: number | null;
}

interface OrderItem {
  id: string;
  productId: string;
  variantId?: string | null;

  quantity: number;
  price: number;
  createdAt?: string;

  productName?: string | null;
  productSlug?: string | null;
  productImage?: string | null;

  variantLabel?: string | null;
  variantSku?: string | null;
  variantWeightGrams?: number | null;
  variantShippingWeightGrams?: number | null;

  product: OrderProduct;
  variant?: OrderVariant | null;
}

interface Order {
  id: string;

  customerName: string;
  phone: string;
  email: string | null;

  address: string;
  city: string;
  state: string;
  pincode: string;

  subtotalAmount?: number;
  shippingEstimatedAmount?: number;
  shippingChargedAmount?: number;
  shippingDiscountAmount?: number;
  totalAmount: number;

  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: string | null;

  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;

  shippingProvider?: string;
  shippingMode?: string | null;
  shipmentStatus?: string;

  packageWeightGrams?: number | null;
  packageLengthCm?: number | null;
  packageBreadthCm?: number | null;
  packageHeightCm?: number | null;

  delhiveryWaybill?: string | null;
  delhiveryShipmentId?: string | null;
  delhiveryOrderId?: string | null;
  delhiveryStatus?: string | null;

  shippingQuotedAt?: string | null;
  pickupScheduledAt?: string | null;
  shippedAt?: string | null;
  estimatedDeliveryAt?: string | null;
  deliveredAt?: string | null;

  createdAt: string;
  updatedAt?: string;

  items: OrderItem[];
}

interface OrderDetailsProps {
  id: string;
}

interface ApiError {
  error?: string;
  message?: string;
}

interface CreateShipmentResponse {
  success: true;
  alreadyCreated: boolean;
  message: string;
  order: {
    id: string;
    shipmentStatus: string;
    delhiveryWaybill: string;
    delhiveryShipmentId?: string | null;
    delhiveryOrderId?: string | null;
    delhiveryStatus?: string | null;
  };
}

interface SyncShipmentResponse {
  success: true;
  message: string;
  order: {
    id: string;
    status: OrderStatus;
    shipmentStatus: string;
    delhiveryWaybill: string;
    delhiveryStatus?: string | null;
    pickupScheduledAt?: string | null;
    shippedAt?: string | null;
    estimatedDeliveryAt?: string | null;
    deliveredAt?: string | null;
    updatedAt: string;
  };
  tracking: {
    waybill: string;
    status: string;
    statusCode: string | null;
    scanCount: number;
  };
}

interface FulfilmentResponse {
  success: true;
  message: string;
  order: {
    id: string;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    shippingProvider: ShippingProvider;
    shippingMode?: string | null;
    shipmentStatus: string;
    delhiveryWaybill?: string | null;
    delhiveryStatus?: string | null;
    shippingQuotedAt?: string | null;
    shippedAt?: string | null;
    deliveredAt?: string | null;
    updatedAt: string;
  };
}

interface DetailItemProps {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}

interface SummaryRowProps {
  label: ReactNode;
  children: ReactNode;
  className?: string;
  withBorder?: boolean;
}

const validOrderStatuses = new Set<OrderStatus>([
  "PENDING",
  "PAID",
  "PREPARING",
  "PACKED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
]);

const validPaymentStatuses = new Set<PaymentStatus>([
  "PENDING",
  "SUCCESS",
  "FAILED",
  "REFUNDED",
]);

const validManualShipmentStatuses =
  new Set<ManualShipmentStatus>([
    "CREATED",
    "IN_TRANSIT",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
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
): value is string | null | undefined {
  return (
    value === null ||
    value === undefined ||
    typeof value === "string"
  );
}

function isOptionalFiniteNumber(
  value: unknown,
): value is number | undefined {
  return (
    value === undefined ||
    Number.isFinite(Number(value))
  );
}

function isOrderStatus(
  value: unknown,
): value is OrderStatus {
  return (
    typeof value === "string" &&
    validOrderStatuses.has(
      value as OrderStatus,
    )
  );
}

function isPaymentStatus(
  value: unknown,
): value is PaymentStatus {
  return (
    typeof value === "string" &&
    validPaymentStatuses.has(
      value as PaymentStatus,
    )
  );
}

function isShippingProvider(
  value: unknown,
): value is ShippingProvider {
  return (
    value === "DELHIVERY" ||
    value === "MANUAL"
  );
}

function isManualShipmentStatus(
  value: unknown,
): value is ManualShipmentStatus {
  return (
    typeof value === "string" &&
    validManualShipmentStatuses.has(
      value as ManualShipmentStatus,
    )
  );
}

function isOrderProduct(
  value: unknown,
): value is OrderProduct {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    isNullableString(value.slug) &&
    isNullableString(value.image) &&
    isOptionalFiniteNumber(value.price)
  );
}

function isOrderVariant(
  value: unknown,
): value is OrderVariant {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    (typeof value.label === "string" ||
      value.label === null) &&
    (typeof value.sku === "string" ||
      value.sku === null) &&
    (typeof value.weightGrams === "number" ||
      value.weightGrams === null) &&
    (typeof value.shippingWeightGrams ===
      "number" ||
      value.shippingWeightGrams === null)
  );
}

function isOrderItem(
  value: unknown,
): value is OrderItem {
  if (!isRecord(value)) {
    return false;
  }

  const quantity = Number(value.quantity);
  const price = Number(value.price);

  return (
    typeof value.id === "string" &&
    typeof value.productId === "string" &&
    (typeof value.variantId === "string" ||
      value.variantId === null ||
      value.variantId === undefined) &&
    Number.isInteger(quantity) &&
    quantity > 0 &&
    Number.isFinite(price) &&
    price >= 0 &&
    isNullableString(value.createdAt) &&
    isNullableString(value.productName) &&
    isNullableString(value.productSlug) &&
    isNullableString(value.productImage) &&
    isNullableString(value.variantLabel) &&
    isNullableString(value.variantSku) &&
    (value.variantWeightGrams === null ||
      value.variantWeightGrams === undefined ||
      Number.isFinite(
        Number(value.variantWeightGrams),
      )) &&
    (value.variantShippingWeightGrams ===
      null ||
      value.variantShippingWeightGrams ===
        undefined ||
      Number.isFinite(
        Number(
          value.variantShippingWeightGrams,
        ),
      )) &&
    isOrderProduct(value.product) &&
    (value.variant === null ||
      value.variant === undefined ||
      isOrderVariant(value.variant))
  );
}

function isCreateShipmentResponse(
  value: unknown,
): value is CreateShipmentResponse {
  if (
    !isRecord(value) ||
    !isRecord(value.order)
  ) {
    return false;
  }

  return (
    value.success === true &&
    typeof value.alreadyCreated ===
      "boolean" &&
    typeof value.message === "string" &&
    typeof value.order.id === "string" &&
    typeof value.order.shipmentStatus ===
      "string" &&
    typeof value.order.delhiveryWaybill ===
      "string" &&
    value.order.delhiveryWaybill.trim()
      .length > 0 &&
    isNullableString(
      value.order.delhiveryShipmentId,
    ) &&
    isNullableString(
      value.order.delhiveryOrderId,
    ) &&
    isNullableString(
      value.order.delhiveryStatus,
    )
  );
}

function isSyncShipmentResponse(
  value: unknown,
): value is SyncShipmentResponse {
  if (
    !isRecord(value) ||
    !isRecord(value.order) ||
    !isRecord(value.tracking)
  ) {
    return false;
  }

  return (
    value.success === true &&
    typeof value.message === "string" &&
    typeof value.order.id === "string" &&
    isOrderStatus(
      value.order.status,
    ) &&
    typeof value.order.shipmentStatus ===
      "string" &&
    typeof value.order.delhiveryWaybill ===
      "string" &&
    value.order.delhiveryWaybill.trim()
      .length > 0 &&
    isNullableString(
      value.order.delhiveryStatus,
    ) &&
    isNullableString(
      value.order.pickupScheduledAt,
    ) &&
    isNullableString(
      value.order.shippedAt,
    ) &&
    isNullableString(
      value.order.estimatedDeliveryAt,
    ) &&
    isNullableString(
      value.order.deliveredAt,
    ) &&
    typeof value.order.updatedAt ===
      "string" &&
    typeof value.tracking.waybill ===
      "string" &&
    typeof value.tracking.status ===
      "string" &&
    isNullableString(
      value.tracking.statusCode,
    ) &&
    typeof value.tracking.scanCount ===
      "number" &&
    Number.isInteger(
      value.tracking.scanCount,
    ) &&
    value.tracking.scanCount >= 0
  );
}

function isFulfilmentResponse(
  value: unknown,
): value is FulfilmentResponse {
  if (
    !isRecord(value) ||
    !isRecord(value.order)
  ) {
    return false;
  }

  return (
    value.success === true &&
    typeof value.message === "string" &&
    typeof value.order.id === "string" &&
    isOrderStatus(
      value.order.status,
    ) &&
    isPaymentStatus(
      value.order.paymentStatus,
    ) &&
    isShippingProvider(
      value.order.shippingProvider,
    ) &&
    typeof value.order.shipmentStatus ===
      "string" &&
    isNullableString(
      value.order.shippingMode,
    ) &&
    isNullableString(
      value.order.delhiveryWaybill,
    ) &&
    isNullableString(
      value.order.delhiveryStatus,
    ) &&
    isNullableString(
      value.order.shippingQuotedAt,
    ) &&
    isNullableString(
      value.order.shippedAt,
    ) &&
    isNullableString(
      value.order.deliveredAt,
    ) &&
    typeof value.order.updatedAt ===
      "string"
  );
}

function isOrder(
  value: unknown,
): value is Order {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.customerName ===
      "string" &&
    typeof value.phone === "string" &&
    isNullableString(value.email) &&
    typeof value.address === "string" &&
    typeof value.city === "string" &&
    typeof value.state === "string" &&
    typeof value.pincode === "string" &&
    isOptionalFiniteNumber(
      value.subtotalAmount,
    ) &&
    isOptionalFiniteNumber(
      value.shippingEstimatedAmount,
    ) &&
    isOptionalFiniteNumber(
      value.shippingChargedAmount,
    ) &&
    isOptionalFiniteNumber(
      value.shippingDiscountAmount,
    ) &&
    Number.isFinite(
      Number(value.totalAmount),
    ) &&
    isOrderStatus(value.status) &&
    isPaymentStatus(
      value.paymentStatus,
    ) &&
    isNullableString(
      value.paymentMethod,
    ) &&
    isNullableString(
      value.razorpayOrderId,
    ) &&
    isNullableString(
      value.razorpayPaymentId,
    ) &&
    isNullableString(
      value.shippingProvider,
    ) &&
    isNullableString(
      value.shippingMode,
    ) &&
    isNullableString(
      value.shipmentStatus,
    ) &&
    isOptionalFiniteNumber(
      value.packageWeightGrams,
    ) &&
    isOptionalFiniteNumber(
      value.packageLengthCm,
    ) &&
    isOptionalFiniteNumber(
      value.packageBreadthCm,
    ) &&
    isOptionalFiniteNumber(
      value.packageHeightCm,
    ) &&
    isNullableString(
      value.delhiveryWaybill,
    ) &&
    isNullableString(
      value.delhiveryShipmentId,
    ) &&
    isNullableString(
      value.delhiveryOrderId,
    ) &&
    isNullableString(
      value.delhiveryStatus,
    ) &&
    isNullableString(
      value.shippingQuotedAt,
    ) &&
    isNullableString(
      value.pickupScheduledAt,
    ) &&
    isNullableString(
      value.shippedAt,
    ) &&
    isNullableString(
      value.estimatedDeliveryAt,
    ) &&
    isNullableString(
      value.deliveredAt,
    ) &&
    typeof value.createdAt === "string" &&
    isNullableString(
      value.updatedAt,
    ) &&
    Array.isArray(value.items) &&
    value.items.every(
      isOrderItem,
    )
  );
}

function normalizeMoney(
  value: unknown,
) {
  const amount =
    Number(value);

  if (
    !Number.isFinite(amount) ||
    amount < 0
  ) {
    return 0;
  }

  return (
    Math.round(
      amount * 100,
    ) / 100
  );
}

function normalizeOptionalNumber(
  value: unknown,
): number | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number =
    Number(value);

  if (
    !Number.isFinite(number)
  ) {
    return null;
  }

  return number;
}

function normalizeOrder(
  order: Order,
): Order {
  return {
    ...order,

    subtotalAmount:
      order.subtotalAmount ===
      undefined
        ? undefined
        : normalizeMoney(
            order.subtotalAmount,
          ),

    shippingEstimatedAmount:
      order.shippingEstimatedAmount ===
      undefined
        ? undefined
        : normalizeMoney(
            order.shippingEstimatedAmount,
          ),

    shippingChargedAmount:
      order.shippingChargedAmount ===
      undefined
        ? undefined
        : normalizeMoney(
            order.shippingChargedAmount,
          ),

    shippingDiscountAmount:
      order.shippingDiscountAmount ===
      undefined
        ? undefined
        : normalizeMoney(
            order.shippingDiscountAmount,
          ),

    totalAmount:
      normalizeMoney(
        order.totalAmount,
      ),

    packageWeightGrams:
      normalizeOptionalNumber(
        order.packageWeightGrams,
      ),

    packageLengthCm:
      normalizeOptionalNumber(
        order.packageLengthCm,
      ),

    packageBreadthCm:
      normalizeOptionalNumber(
        order.packageBreadthCm,
      ),

    packageHeightCm:
      normalizeOptionalNumber(
        order.packageHeightCm,
      ),

    items:
      order.items.map(
        (item) => ({
          ...item,

          quantity:
            Math.max(
              1,
              Math.floor(
                Number(
                  item.quantity,
                ),
              ),
            ),

          price:
            normalizeMoney(
              item.price,
            ),

          product: {
            ...item.product,

            price:
              item.product.price ===
              undefined
                ? undefined
                : normalizeMoney(
                    item.product.price,
                  ),
          },
        }),
      ),
  };
}

function formatStatus(
  value: string,
) {
  return value
    .toLowerCase()
    .split("_")
    .map(
      (word) =>
        word
          .charAt(0)
          .toUpperCase() +
        word.slice(1),
    )
    .join(" ");
}

function formatDate(
  value?: string | null,
) {
  if (!value) {
    return "Not available";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Not available";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(date);
}

function getOrderStatusVariant(
  status: OrderStatus,
):
  | "warning"
  | "primary"
  | "success"
  | "danger"
  | "neutral" {
  switch (status) {
    case "PENDING":
      return "warning";

    case "PAID":
    case "PREPARING":
    case "PACKED":
    case "OUT_FOR_DELIVERY":
      return "primary";

    case "DELIVERED":
      return "success";

    case "CANCELLED":
      return "danger";

    default:
      return "neutral";
  }
}

function getPaymentStatusVariant(
  status: PaymentStatus,
):
  | "warning"
  | "success"
  | "danger"
  | "neutral" {
  switch (status) {
    case "PENDING":
      return "warning";

    case "SUCCESS":
      return "success";

    case "FAILED":
      return "danger";

    case "REFUNDED":
    default:
      return "neutral";
  }
}

function getPaymentStatusLabel(
  status: PaymentStatus,
) {
  switch (status) {
    case "SUCCESS":
      return "Payment Successful";

    case "FAILED":
      return "Payment Failed";

    case "REFUNDED":
      return "Refunded";

    case "PENDING":
    default:
      return "Payment Pending";
  }
}

function getShipmentStatusVariant(
  status?: string,
):
  | "warning"
  | "primary"
  | "success"
  | "danger"
  | "neutral" {
  switch (
    status?.toUpperCase()
  ) {
    case "QUOTED":
    case "CREATED":
    case "PICKUP_SCHEDULED":
    case "IN_TRANSIT":
    case "OUT_FOR_DELIVERY":
      return "primary";

    case "DELIVERED":
      return "success";

    case "FAILED":
    case "CANCELLED":
    case "RTO":
      return "danger";

    case "NOT_CREATED":
      return "warning";

    default:
      return "neutral";
  }
}

function DetailItem({
  icon,
  label,
  children,
}: DetailItemProps) {
  return (
    <div className="flex items-start gap-4">
      <span className="mt-1 shrink-0 text-[#C89B3C]">
        {icon}
      </span>

      <div className="min-w-0">
        <p className="text-sm text-gray-500">
          {label}
        </p>

        <div className="mt-1 font-semibold text-[#6D2E00]">
          {children}
        </div>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  children,
  className = "",
  withBorder = true,
}: SummaryRowProps) {
  return (
    <div
      className={`flex items-start justify-between gap-5 ${
        withBorder
          ? "border-b border-[#F3DFC2] pb-4"
          : ""
      }`}
    >
      <dt className="shrink-0 text-gray-500">
        {label}
      </dt>

      <dd
        className={`min-w-0 text-right font-semibold text-[#6D2E00] ${className}`}
      >
        {children}
      </dd>
    </div>
  );
}

export default function OrderDetails({
  id,
}: OrderDetailsProps) {
  const [
    order,
    setOrder,
  ] =
    useState<Order | null>(
      null,
    );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );

  const [
    shipmentCreating,
    setShipmentCreating,
  ] = useState(false);

  const [
    shipmentSyncing,
    setShipmentSyncing,
  ] = useState(false);

  const [
    fulfilmentSaving,
    setFulfilmentSaving,
  ] = useState(false);

  const [
    fulfilmentProvider,
    setFulfilmentProvider,
  ] =
    useState<ShippingProvider>(
      "DELHIVERY",
    );

  const [
    manualShipmentStatus,
    setManualShipmentStatus,
  ] =
    useState<ManualShipmentStatus>(
      "CREATED",
    );


  const loadOrder =
    useCallback(
      async (
        signal?: AbortSignal,
      ) => {
        const orderId =
          id.trim();

        if (!orderId) {
          setOrder(null);
          setError(
            "Order ID is required.",
          );
          setLoading(false);
          return;
        }

        setLoading(true);
        setError(null);

        try {
          const response =
            await fetch(
              `/api/admin/orders/${encodeURIComponent(
                orderId,
              )}/details`,
              {
                method:
                  "GET",
                cache:
                  "no-store",
                signal,
              },
            );

          const data:
            unknown =
            await response
              .json()
              .catch(
                () => null,
              );

          if (
            !response.ok
          ) {
            const apiError =
              isRecord(
                data,
              )
                ? (data as ApiError)
                : null;

            throw new Error(
              apiError?.error ||
                apiError?.message ||
                "Unable to load order details.",
            );
          }

          if (
            !isOrder(data)
          ) {
            throw new Error(
              "The order details response was invalid.",
            );
          }

          const normalizedOrder =
            normalizeOrder(
              data,
            );

          setOrder(
            normalizedOrder,
          );

          const loadedProvider =
            isShippingProvider(
              normalizedOrder
                .shippingProvider,
            )
              ? normalizedOrder
                  .shippingProvider
              : "DELHIVERY";

          setFulfilmentProvider(
            loadedProvider,
          );

          if (
            isManualShipmentStatus(
              normalizedOrder
                .shipmentStatus,
            )
          ) {
            setManualShipmentStatus(
              normalizedOrder
                .shipmentStatus,
            );
          } else if (
            normalizedOrder.status ===
            "DELIVERED"
          ) {
            setManualShipmentStatus(
              "DELIVERED",
            );
          } else {
            setManualShipmentStatus(
              "CREATED",
            );
          }
        } catch (
          loadError
        ) {
          if (
            loadError instanceof
              DOMException &&
            loadError.name ===
              "AbortError"
          ) {
            return;
          }

          console.error(
            "Order details loading error:",
            loadError,
          );

          setOrder(null);

          setError(
            loadError instanceof
              Error
              ? loadError.message
              : "Something went wrong while loading the order.",
          );
        } finally {
          if (
            !signal?.aborted
          ) {
            setLoading(
              false,
            );
          }
        }
      },
      [id],
    );

  useEffect(() => {
    const controller =
      new AbortController();

    void loadOrder(
      controller.signal,
    );

    return () => {
      controller.abort();
    };
  }, [loadOrder]);

  const createShipment =
    useCallback(
      async () => {
        if (
          shipmentCreating
        ) {
          return;
        }

        const orderId =
          id.trim();

        if (!orderId) {
          toast.error(
            "Order ID is required.",
          );
          return;
        }

        setShipmentCreating(
          true,
        );

        try {
          const response =
            await fetch(
              `/api/orders/${encodeURIComponent(
                orderId,
              )}/shipment`,
              {
                method:
                  "POST",
                cache:
                  "no-store",
              },
            );

          const data:
            unknown =
            await response
              .json()
              .catch(
                () => null,
              );

          if (
            !response.ok
          ) {
            const apiError =
              isRecord(
                data,
              )
                ? (data as ApiError)
                : null;

            throw new Error(
              apiError?.error ||
                apiError?.message ||
                "Unable to create the shipment.",
            );
          }

          if (
            !isCreateShipmentResponse(
              data,
            )
          ) {
            throw new Error(
              "The shipment response was invalid.",
            );
          }

          toast.success(
            data.message,
          );

          await loadOrder();
        } catch (
          shipmentError
        ) {
          console.error(
            "Shipment creation error:",
            shipmentError,
          );

          toast.error(
            shipmentError instanceof
              Error
              ? shipmentError.message
              : "Unable to create the shipment.",
          );
        } finally {
          setShipmentCreating(
            false,
          );
        }
      },
      [
        id,
        loadOrder,
        shipmentCreating,
      ],
    );

  const syncShipment =
    useCallback(
      async () => {
        if (
          shipmentSyncing
        ) {
          return;
        }

        const orderId =
          id.trim();

        if (!orderId) {
          toast.error(
            "Order ID is required.",
          );
          return;
        }

        setShipmentSyncing(
          true,
        );

        try {
          const response =
            await fetch(
              `/api/admin/orders/${encodeURIComponent(
                orderId,
              )}/sync-shipment`,
              {
                method:
                  "POST",
                cache:
                  "no-store",
              },
            );

          const data:
            unknown =
            await response
              .json()
              .catch(
                () => null,
              );

          if (
            !response.ok
          ) {
            const apiError =
              isRecord(
                data,
              )
                ? (data as ApiError)
                : null;

            throw new Error(
              apiError?.error ||
                apiError?.message ||
                "Unable to synchronize the shipment.",
            );
          }

          if (
            !isSyncShipmentResponse(
              data,
            )
          ) {
            throw new Error(
              "The shipment synchronization response was invalid.",
            );
          }

          toast.success(
            data.message,
          );

          await loadOrder();
        } catch (
          syncError
        ) {
          console.error(
            "Shipment synchronization error:",
            syncError,
          );

          toast.error(
            syncError instanceof
              Error
              ? syncError.message
              : "Unable to synchronize the shipment.",
          );
        } finally {
          setShipmentSyncing(
            false,
          );
        }
      },
      [
        id,
        loadOrder,
        shipmentSyncing,
      ],
    );

  const saveFulfilment =
    useCallback(
      async () => {
        if (
          fulfilmentSaving ||
          shipmentCreating ||
          shipmentSyncing
        ) {
          return;
        }

        const orderId =
          id.trim();

        if (!orderId) {
          toast.error(
            "Order ID is required.",
          );
          return;
        }

        setFulfilmentSaving(true);

        try {
          const body =
            fulfilmentProvider ===
            "MANUAL"
              ? {
                  provider:
                    fulfilmentProvider,
                  shipmentStatus:
                    manualShipmentStatus,
                }
              : {
                  provider:
                    fulfilmentProvider,
                };

          const response =
            await fetch(
              `/api/admin/orders/${encodeURIComponent(
                orderId,
              )}/fulfilment`,
              {
                method: "PATCH",
                cache: "no-store",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body:
                  JSON.stringify(
                    body,
                  ),
              },
            );

          const data: unknown =
            await response
              .json()
              .catch(() => null);

          if (!response.ok) {
            const apiError =
              isRecord(data)
                ? (data as ApiError)
                : null;

            throw new Error(
              apiError?.error ||
                apiError?.message ||
                "Unable to update fulfilment.",
            );
          }

          if (
            !isFulfilmentResponse(
              data,
            )
          ) {
            throw new Error(
              "The fulfilment response was invalid.",
            );
          }

          toast.success(
            data.message,
          );

          await loadOrder();
        } catch (
          fulfilmentError
        ) {
          console.error(
            "Fulfilment update error:",
            fulfilmentError,
          );

          toast.error(
            fulfilmentError instanceof
              Error
              ? fulfilmentError.message
              : "Unable to update fulfilment.",
          );
        } finally {
          setFulfilmentSaving(false);
        }
      },
      [
        fulfilmentProvider,
        fulfilmentSaving,
        id,
        loadOrder,
        manualShipmentStatus,
        shipmentCreating,
        shipmentSyncing,
      ],
    );

  if (loading) {
    return (
      <section className="min-h-[70vh] bg-gradient-to-br from-[#FFFDF8] via-[#FFF8EE] to-[#FFF4DE]">
        <div className="flex min-h-[70vh] items-center justify-center">
          <Spinner
            size="lg"
            text="Loading order details..."
          />
        </div>
      </section>
    );
  }

  if (
    !order ||
    error
  ) {
    return (
      <section className="min-h-[70vh] bg-gradient-to-br from-[#FFFDF8] via-[#FFF8EE] to-[#FFF4DE] py-12">
        <Container>
          <Card
            padding="lg"
            className="mx-auto max-w-xl border-red-200 bg-red-50 text-center"
          >
            <Package
              size={42}
              className="mx-auto text-red-500"
              aria-hidden="true"
            />

            <h1 className="mt-5 text-2xl font-bold text-red-700">
              Order Unavailable
            </h1>

            <p className="mt-3 leading-7 text-red-600">
              {error ||
                "The requested order could not be found."}
            </p>

            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Button
                type="button"
                variant="primary"
                onClick={() =>
                  void loadOrder()
                }
              >
                Try Again
              </Button>

              <Link
                href="/admin/orders"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#F3DFC2] bg-white px-5 font-semibold text-[#6D2E00] transition hover:bg-[#FFF4DE] focus:outline-none focus:ring-4 focus:ring-[#C89B3C]/20"
              >
                <ArrowLeft
                  size={18}
                  aria-hidden="true"
                />

                Back to Orders
              </Link>
            </div>
          </Card>
        </Container>
      </section>
    );
  }

  const calculatedItemsSubtotal =
    order.items.reduce(
      (
        total,
        item,
      ) =>
        total +
        item.price *
          item.quantity,
      0,
    );

  const subtotalAmount =
    order.subtotalAmount &&
    order.subtotalAmount >
      0
      ? order.subtotalAmount
      : calculatedItemsSubtotal;

  const shippingChargedAmount =
    order.shippingChargedAmount ??
    Math.max(
      0,
      order.totalAmount -
        subtotalAmount,
    );

  const shippingEstimatedAmount =
    order.shippingEstimatedAmount ??
    0;

  const shippingDiscountAmount =
    order.shippingDiscountAmount ??
    Math.max(
      0,
      shippingEstimatedAmount -
        shippingChargedAmount,
    );

  const totalQuantity =
    order.items.reduce(
      (
        total,
        item,
      ) =>
        total +
        item.quantity,
      0,
    );

  const hasPackageDetails =
    order.packageWeightGrams !==
      null &&
    order.packageWeightGrams !==
      undefined;

  const hasShippingDetails =
    Boolean(
      order.delhiveryWaybill,
    ) ||
    Boolean(
      order.delhiveryShipmentId,
    ) ||
    Boolean(
      order.shipmentStatus,
    ) ||
    hasPackageDetails;

  const canCreateShipment =
    order.shippingProvider ===
      "DELHIVERY" &&
    order.paymentStatus ===
      "SUCCESS" &&
    order.status !==
      "CANCELLED" &&
    !order.delhiveryWaybill;

  const canSyncShipment =
    order.shippingProvider ===
      "DELHIVERY" &&
    Boolean(
      order.delhiveryWaybill?.trim(),
    );

  return (
    <section className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#FFFDF8] via-[#FFF8EE] to-[#FFF4DE] py-8 sm:py-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-0 h-96 w-96 rounded-full bg-[#FFE7B8]/40 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-[#FFE7B8]/40 blur-3xl"
      />

      <Container className="relative">
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-[#6D2E00] transition-colors hover:text-[#C89B3C] focus:outline-none focus:ring-4 focus:ring-[#C89B3C]/20"
            >
              <ArrowLeft
                size={17}
                aria-hidden="true"
              />

              Back to Orders
            </Link>

            <h1 className="mt-4 text-3xl font-bold text-[#6D2E00] sm:text-4xl">
              Order Details
            </h1>

            <p className="mt-2 text-gray-600">
              Review customer information,
              payment details, shipping data and
              ordered products.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-[#F3DFC2] bg-white/90 px-4 py-3 shadow-sm">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500">
                Order Status
              </p>

              <Badge
                variant={getOrderStatusVariant(
                  order.status,
                )}
                size="lg"
                rounded
              >
                {formatStatus(
                  order.status,
                )}
              </Badge>
            </div>

            <div className="rounded-2xl border border-[#F3DFC2] bg-white/90 px-4 py-3 shadow-sm">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500">
                Payment
              </p>

              <Badge
                variant={getPaymentStatusVariant(
                  order.paymentStatus,
                )}
                size="lg"
                rounded
              >
                {getPaymentStatusLabel(
                  order.paymentStatus,
                )}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card
            padding="lg"
            className="bg-white/95 shadow-xl backdrop-blur-sm"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF4DE] text-[#C89B3C]">
                <User
                  size={23}
                  aria-hidden="true"
                />
              </div>

              <div>
                <h2 className="text-xl font-bold text-[#6D2E00]">
                  Customer Information
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Contact and delivery details
                </p>
              </div>
            </div>

            <div className="mt-7 space-y-5">
              <DetailItem
                icon={
                  <User
                    size={19}
                    aria-hidden="true"
                  />
                }
                label="Customer name"
              >
                {order.customerName}
              </DetailItem>

              <DetailItem
                icon={
                  <Phone
                    size={19}
                    aria-hidden="true"
                  />
                }
                label="Phone"
              >
                <a
                  href={`tel:${order.phone}`}
                  className="hover:text-[#C89B3C]"
                >
                  {order.phone}
                </a>
              </DetailItem>

              <DetailItem
                icon={
                  <Mail
                    size={19}
                    aria-hidden="true"
                  />
                }
                label="Email"
              >
                {order.email ? (
                  <a
                    href={`mailto:${order.email}`}
                    className="break-all hover:text-[#C89B3C]"
                  >
                    {order.email}
                  </a>
                ) : (
                  <span className="font-normal text-gray-500">
                    Not provided
                  </span>
                )}
              </DetailItem>

              <div className="border-t border-[#F3DFC2] pt-5">
                <DetailItem
                  icon={
                    <MapPin
                      size={19}
                      aria-hidden="true"
                    />
                  }
                  label="Delivery address"
                >
                  <address className="not-italic font-normal leading-7">
                    {order.address}
                    <br />
                    {order.city},{" "}
                    {order.state}
                    <br />
                    {order.pincode}
                  </address>
                </DetailItem>
              </div>
            </div>
          </Card>

          <Card
            padding="lg"
            className="bg-white/95 shadow-xl backdrop-blur-sm"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF4DE] text-[#C89B3C]">
                <ReceiptText
                  size={23}
                  aria-hidden="true"
                />
              </div>

              <div>
                <h2 className="text-xl font-bold text-[#6D2E00]">
                  Order Summary
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Order and payment information
                </p>
              </div>
            </div>

            <dl className="mt-7 space-y-5">
              <SummaryRow
                label="Order ID"
                className="break-all"
              >
                {order.id}
              </SummaryRow>

              <SummaryRow label="Order status">
                <Badge
                  variant={getOrderStatusVariant(
                    order.status,
                  )}
                  rounded
                >
                  {formatStatus(
                    order.status,
                  )}
                </Badge>
              </SummaryRow>

              <SummaryRow label="Payment status">
                <Badge
                  variant={getPaymentStatusVariant(
                    order.paymentStatus,
                  )}
                  rounded
                >
                  {getPaymentStatusLabel(
                    order.paymentStatus,
                  )}
                </Badge>
              </SummaryRow>

              <SummaryRow label="Payment method">
                {order.paymentMethod ||
                  "Not selected"}
              </SummaryRow>

              <SummaryRow
                label={
                  <span className="flex items-center gap-2">
                    <CalendarDays
                      size={17}
                      aria-hidden="true"
                    />

                    Order date
                  </span>
                }
              >
                {formatDate(
                  order.createdAt,
                )}
              </SummaryRow>

              <SummaryRow label="Products subtotal">
                {formatCurrency(
                  subtotalAmount,
                )}
              </SummaryRow>

              {shippingEstimatedAmount >
                0 && (
                <SummaryRow label="Courier estimate">
                  {formatCurrency(
                    shippingEstimatedAmount,
                  )}
                </SummaryRow>
              )}

              {shippingDiscountAmount >
                0 && (
                <SummaryRow label="Shipping discount">
                  -
                  {formatCurrency(
                    shippingDiscountAmount,
                  )}
                </SummaryRow>
              )}

              <SummaryRow label="Shipping charged">
                {shippingChargedAmount ===
                0
                  ? "FREE"
                  : formatCurrency(
                      shippingChargedAmount,
                    )}
              </SummaryRow>

              <SummaryRow
                label="Total amount"
                withBorder={false}
              >
                <span className="text-2xl font-bold text-[#C89B3C]">
                  {formatCurrency(
                    order.totalAmount,
                  )}
                </span>
              </SummaryRow>
            </dl>
          </Card>
        </div>

        {hasShippingDetails && (
          <Card
            padding="lg"
            className="mt-6 bg-white/95 shadow-xl backdrop-blur-sm"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#6D2E00]">
                  Shipping Information
                </h2>

                <p className="mt-1 text-sm text-gray-500">
  {order.shippingProvider ===
  "MANUAL"
    ? "Local Logistics fulfilment details"
    : "Package and Delhivery shipment details"}
</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {order.shipmentStatus && (
                  <Badge
                    variant={getShipmentStatusVariant(
                      order.shipmentStatus,
                    )}
                    rounded
                  >
                    {formatStatus(
                      order.shipmentStatus,
                    )}
                  </Badge>
                )}

                {canSyncShipment && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    loading={
                      shipmentSyncing
                    }
                    disabled={
                      shipmentSyncing ||
                      shipmentCreating
                    }
                    leftIcon={
                      <RefreshCw
                        size={17}
                        className={
                          shipmentSyncing
                            ? "animate-spin"
                            : undefined
                        }
                        aria-hidden="true"
                      />
                    }
                    onClick={() =>
                      void syncShipment()
                    }
                  >
                    {shipmentSyncing
                      ? "Syncing Status..."
                      : "Sync Shipment Status"}
                  </Button>
                )}

                {canCreateShipment && (
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    loading={
                      shipmentCreating
                    }
                    disabled={
                      shipmentCreating ||
                      shipmentSyncing
                    }
                    leftIcon={
                      <PackagePlus
                        size={17}
                        aria-hidden="true"
                      />
                    }
                    onClick={() =>
                      void createShipment()
                    }
                  >
                    {shipmentCreating
                      ? "Creating Shipment..."
                      : "Create Shipment"}
                  </Button>
                )}
              </div>
            </div>

            <div className="mt-7 rounded-2xl border border-[#F3DFC2] bg-[#FFFDF8] p-5">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="fulfilment-provider"
                    className="text-sm font-semibold text-[#6D2E00]"
                  >
                    Fulfilment Method
                  </label>

                  <select
                    id="fulfilment-provider"
                    value={
                      fulfilmentProvider
                    }
                    disabled={
                      fulfilmentSaving ||
                      shipmentCreating ||
                      shipmentSyncing
                    }
                    onChange={(event) => {
                      const nextProvider =
                        event.target.value;

                      if (
                        !isShippingProvider(
                          nextProvider,
                        )
                      ) {
                        return;
                      }

                      setFulfilmentProvider(
                        nextProvider,
                      );

                      if (
                        nextProvider ===
                        "MANUAL"
                      ) {
                        if (
                          order.status ===
                          "DELIVERED"
                        ) {
                          setManualShipmentStatus(
                            "DELIVERED",
                          );
                        } else if (
                          isManualShipmentStatus(
                            order.shipmentStatus,
                          )
                        ) {
                          setManualShipmentStatus(
                            order.shipmentStatus,
                          );
                        } else {
                          setManualShipmentStatus(
                            "CREATED",
                          );
                        }
                      }
                    }}
                    className="mt-2 h-11 w-full rounded-xl border border-[#E5CFAE] bg-white px-3 text-sm font-semibold text-[#6D2E00] outline-none transition focus:border-[#C89B3C] focus:ring-4 focus:ring-[#C89B3C]/15 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="DELHIVERY">
                      Delhivery
                    </option>

                    <option
                      value="MANUAL"
                      disabled={Boolean(
                        order
                          .delhiveryWaybill
                          ?.trim() ||
                          order
                            .delhiveryShipmentId
                            ?.trim() ||
                          order
                            .delhiveryOrderId
                            ?.trim(),
                      )}
                    >
                      Local Logistics
                    </option>
                  </select>
                </div>

                {fulfilmentProvider ===
                  "MANUAL" && (
                  <div>
                    <label
                      htmlFor="manual-shipment-status"
                      className="text-sm font-semibold text-[#6D2E00]"
                    >
                      Shipment Status
                    </label>

                    <select
                      id="manual-shipment-status"
                      value={
                        manualShipmentStatus
                      }
                      disabled={
                        fulfilmentSaving ||
                        shipmentCreating ||
                        shipmentSyncing
                      }
                      onChange={(event) => {
                        const nextStatus =
                          event.target.value;

                        if (
                          isManualShipmentStatus(
                            nextStatus,
                          )
                        ) {
                          setManualShipmentStatus(
                            nextStatus,
                          );
                        }
                      }}
                      className="mt-2 h-11 w-full rounded-xl border border-[#E5CFAE] bg-white px-3 text-sm font-semibold text-[#6D2E00] outline-none transition focus:border-[#C89B3C] focus:ring-4 focus:ring-[#C89B3C]/15 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="CREATED">
                        Ready for Dispatch
                      </option>

                      <option value="IN_TRANSIT">
                        In Transit
                      </option>

                      <option value="OUT_FOR_DELIVERY">
                        Out for Delivery
                      </option>

                      <option value="DELIVERED">
                        Delivered
                      </option>
                    </select>
                  </div>
                )}
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm leading-6 text-gray-500">
                  {fulfilmentProvider ===
                  "MANUAL"
                    ? "Use Local Logistics for your own delivery arrangement or another local courier."
                    : "Delhivery shipment creation and automatic tracking remain unchanged."}
                </p>

                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  loading={
                    fulfilmentSaving
                  }
                  disabled={
                    fulfilmentSaving ||
                    shipmentCreating ||
                    shipmentSyncing
                  }
                  onClick={() =>
                    void saveFulfilment()
                  }
                >
                  {fulfilmentSaving
                    ? "Saving..."
                    : "Save Fulfilment"}
                </Button>
              </div>
            </div>

            <dl className="mt-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              <SummaryRow label="Provider">
              {order.shippingProvider ===
              "MANUAL"
                ? "Local Logistics"
                : order.shippingProvider
                  ? formatStatus(
                      order.shippingProvider,
                    )
                  : "Not selected"}
            </SummaryRow>

            {order.shippingProvider ===
              "DELHIVERY" && (
              <>
                <SummaryRow label="Shipping mode">
                  {order.shippingMode
                    ? formatStatus(
                        order.shippingMode,
                      )
                    : "Not selected"}
                </SummaryRow>

                <SummaryRow label="Waybill / AWB">
                  {order.delhiveryWaybill ||
                    "Not assigned"}
                </SummaryRow>

                <SummaryRow label="Delhivery status">
                  {order.delhiveryStatus
                    ? formatStatus(
                        order.delhiveryStatus,
                      )
                    : "Not available"}
                </SummaryRow>
              </>
            )}

            <SummaryRow label="Package weight">
              {order.packageWeightGrams
                ? `${order.packageWeightGrams.toLocaleString(
                    "en-IN",
                  )} g`
                : "Not recorded"}
            </SummaryRow>

            <SummaryRow label="Package size">
              {order.packageLengthCm &&
              order.packageBreadthCm &&
              order.packageHeightCm
                ? `${order.packageLengthCm} × ${order.packageBreadthCm} × ${order.packageHeightCm} cm`
                : "Not recorded"}
            </SummaryRow>

            {order.shippingProvider ===
              "DELHIVERY" && (
              <>
                <SummaryRow label="Quote created">
                  {formatDate(
                    order.shippingQuotedAt,
                  )}
                </SummaryRow>

                <SummaryRow label="Pickup scheduled">
                  {formatDate(
                    order.pickupScheduledAt,
                  )}
                </SummaryRow>
              </>
            )}

            <SummaryRow label="Shipped">
              {formatDate(
                order.shippedAt,
              )}
            </SummaryRow>

            <SummaryRow label="Delivered">
              {formatDate(
                order.deliveredAt,
              )}
            </SummaryRow>

            <SummaryRow
              label="Estimated delivery"
              withBorder={false}
            >
              {formatDate(
                order.estimatedDeliveryAt,
              )}
            </SummaryRow>
          </dl>
          </Card>
        )}

        <Card
          padding="none"
          className="mt-8 overflow-hidden bg-white/95 shadow-xl backdrop-blur-sm"
        >
          <div className="flex flex-col gap-3 border-b border-[#F3DFC2] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div>
              <h2 className="text-2xl font-bold text-[#6D2E00]">
                Ordered Products
              </h2>

              <p className="mt-1 text-gray-500">
                {totalQuantity}{" "}
                {totalQuantity === 1
                  ? "item"
                  : "items"}{" "}
                in this order
              </p>
            </div>

            <p className="text-lg font-bold text-[#6D2E00]">
              {formatCurrency(
                calculatedItemsSubtotal,
              )}
            </p>
          </div>

          {order.items.length ===
          0 ? (
            <div className="p-10 text-center">
              <Package
                size={38}
                className="mx-auto text-[#C89B3C]"
                aria-hidden="true"
              />

              <p className="mt-4 text-gray-600">
                No products were found for this
                order.
              </p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full">
                  <thead className="bg-[#FFF8EE]">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">
                        Product
                      </th>

                      <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">
                        Quantity
                      </th>

                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">
                        Unit Price
                      </th>

                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">
                        Total
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {order.items.map(
                      (item) => (
                        <tr
                          key={
                            item.id
                          }
                          className="border-t border-[#F3DFC2] transition-colors hover:bg-[#FFFDF8]"
                        >
                          <td className="px-6 py-5">
                            <p className="font-semibold text-[#6D2E00]">
                              {item.productName ||
                                item
                                  .product
                                  .name}
                            </p>

                            {item.variantLabel && (
                              <p className="mt-1 text-sm font-semibold text-[#C89B3C]">
                                {
                                  item.variantLabel
                                }
                                {item.variantSku
                                  ? ` • SKU: ${item.variantSku}`
                                  : ""}
                              </p>
                            )}

                            {item.variantWeightGrams !==
                              null &&
                              item.variantWeightGrams !==
                                undefined && (
                                <p className="mt-1 text-xs text-gray-500">
                                  Net
                                  weight:{" "}
                                  {
                                    item.variantWeightGrams
                                  }{" "}
                                  g
                                </p>
                              )}
                          </td>

                          <td className="px-6 py-5 text-center text-gray-600">
                            {
                              item.quantity
                            }
                          </td>

                          <td className="px-6 py-5 text-right text-gray-600">
                            {formatCurrency(
                              item.price,
                            )}
                          </td>

                          <td className="px-6 py-5 text-right font-bold text-[#6D2E00]">
                            {formatCurrency(
                              item.price *
                                item.quantity,
                            )}
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>

              <div className="space-y-4 p-5 md:hidden">
                {order.items.map(
                  (item) => (
                    <Card
                      key={
                        item.id
                      }
                      variant="filled"
                      padding="md"
                      className="shadow-none"
                    >
                      <h3 className="font-bold text-[#6D2E00]">
                        {item.productName ||
                          item
                            .product
                            .name}
                      </h3>

                      {item.variantLabel && (
                        <p className="mt-1 text-sm font-semibold text-[#C89B3C]">
                          {
                            item.variantLabel
                          }
                          {item.variantSku
                            ? ` • SKU: ${item.variantSku}`
                            : ""}
                        </p>
                      )}

                      {item.variantWeightGrams !==
                        null &&
                        item.variantWeightGrams !==
                          undefined && (
                          <p className="mt-1 text-xs text-gray-500">
                            Net
                            weight:{" "}
                            {
                              item.variantWeightGrams
                            }{" "}
                            g
                          </p>
                        )}

                      <div className="mt-4 flex items-end justify-between gap-4">
                        <div className="text-sm leading-7 text-gray-500">
                          <p>
                            Quantity:{" "}
                            {
                              item.quantity
                            }
                          </p>

                          <p>
                            {formatCurrency(
                              item.price,
                            )}{" "}
                            each
                          </p>
                        </div>

                        <p className="font-bold text-[#6D2E00]">
                          {formatCurrency(
                            item.price *
                              item.quantity,
                          )}
                        </p>
                      </div>
                    </Card>
                  ),
                )}
              </div>
            </>
          )}
        </Card>
      </Container>
    </section>
  );
}