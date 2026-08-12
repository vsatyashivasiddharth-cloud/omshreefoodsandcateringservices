"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Eye,
  Package,
  RefreshCw,
  ShoppingBag,
  Trash2,
  Truck,
  User,
  XCircle,
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

interface Product {
  id: string;
  name: string;
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
  productId?: string;
  variantId?: string | null;
  quantity: number;
  price: number;

  productName?: string | null;
  productSlug?: string | null;
  productImage?: string | null;

  variantLabel?: string | null;
  variantSku?: string | null;
  variantWeightGrams?: number | null;
  variantShippingWeightGrams?: number | null;

  product: Product;
  variant?: OrderVariant | null;
}

interface Order {
  id: string;
  customerName: string;
  phone: string;
  email?: string | null;
  totalAmount: number;
  status: OrderStatus;
  canDelete: boolean;
  createdAt: string;
  items: OrderItem[];
}

interface StatProps {
  title: string;
  value: number;
  icon: ReactNode;
}

interface ApiError {
  error?: string;
  message?: string;
}

const statusOptions: Array<{
  value: OrderStatus;
  label: string;
}> = [
  {
    value: "PENDING",
    label: "Pending",
  },
  {
    value: "PAID",
    label: "Paid",
  },
  {
    value: "PREPARING",
    label: "Preparing",
  },
  {
    value: "PACKED",
    label: "Packed",
  },
  {
    value: "OUT_FOR_DELIVERY",
    label: "Out for Delivery",
  },
  {
    value: "DELIVERED",
    label: "Delivered",
  },
  {
    value: "CANCELLED",
    label: "Cancelled",
  },
];

const validStatuses = new Set<OrderStatus>(
  statusOptions.map((option) => option.value),
);

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function isOrderStatus(
  value: unknown,
): value is OrderStatus {
  return (
    typeof value === "string" &&
    validStatuses.has(value as OrderStatus)
  );
}

function isProduct(
  value: unknown,
): value is Product {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.name === "string"
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
    (typeof value.productId === "string" ||
      value.productId === undefined) &&
    (typeof value.variantId === "string" ||
      value.variantId === null ||
      value.variantId === undefined) &&
    Number.isInteger(quantity) &&
    quantity > 0 &&
    Number.isFinite(price) &&
    price >= 0 &&
    (typeof value.productName === "string" ||
      value.productName === null ||
      value.productName === undefined) &&
    (typeof value.productSlug === "string" ||
      value.productSlug === null ||
      value.productSlug === undefined) &&
    (typeof value.productImage === "string" ||
      value.productImage === null ||
      value.productImage === undefined) &&
    (typeof value.variantLabel === "string" ||
      value.variantLabel === null ||
      value.variantLabel === undefined) &&
    (typeof value.variantSku === "string" ||
      value.variantSku === null ||
      value.variantSku === undefined) &&
    (typeof value.variantWeightGrams ===
      "number" ||
      value.variantWeightGrams === null ||
      value.variantWeightGrams === undefined) &&
    (typeof value.variantShippingWeightGrams ===
      "number" ||
      value.variantShippingWeightGrams === null ||
      value.variantShippingWeightGrams ===
        undefined) &&
    isProduct(value.product) &&
    (value.variant === null ||
      value.variant === undefined ||
      isOrderVariant(value.variant))
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
    typeof value.customerName === "string" &&
    typeof value.phone === "string" &&
    (typeof value.email === "string" ||
      value.email === null ||
      value.email === undefined) &&
    Number.isFinite(Number(value.totalAmount)) &&
    isOrderStatus(value.status) &&
    typeof value.canDelete === "boolean" &&
    typeof value.createdAt === "string" &&
    Array.isArray(value.items) &&
    value.items.every(isOrderItem)
  );
}

function normalizeOrder(order: Order): Order {
  return {
    ...order,
    totalAmount: Math.max(
      0,
      Number(order.totalAmount),
    ),
    items: order.items.map((item) => ({
      ...item,
      quantity: Math.max(
        1,
        Math.floor(Number(item.quantity)),
      ),
      price: Math.max(
        0,
        Number(item.price),
      ),
    })),
  };
}

function formatStatus(status: OrderStatus) {
  return status
    .toLowerCase()
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1),
    )
    .join(" ");
}

function formatOrderDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getStatusVariant(
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

function Stat({
  title,
  value,
  icon,
}: StatProps) {
  return (
    <Card
      padding="lg"
      hover
      className="group bg-white/95 backdrop-blur-sm"
    >
      <div className="flex items-start justify-between gap-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
            {title}
          </p>

          <h3 className="mt-3 text-3xl font-bold text-[#6D2E00]">
            {value}
          </h3>
        </div>

        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#FFF4DE] text-[#C89B3C] transition-all duration-300 group-hover:scale-110 group-hover:bg-[#C89B3C] group-hover:text-white">
          {icon}
        </div>
      </div>
    </Card>
  );
}

export default function OrdersContent() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [
    updatingOrderId,
    setUpdatingOrderId,
  ] = useState<string | null>(null);

  const [
    deletingOrderId,
    setDeletingOrderId,
  ] = useState<string | null>(null);

  const [
    attentionOrderIds,
    setAttentionOrderIds,
  ] = useState<string[]>([]);

  const [
    showOverdueOnly,
    setShowOverdueOnly,
  ] = useState(false);

  const fetchOrders = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError(null);

      try {
        const [
          ordersResponse,
          dashboardResponse,
        ] = await Promise.all([
          fetch(
            "/api/admin/orders",
            {
              method: "GET",
              cache: "no-store",
              signal,
            },
          ),

          fetch(
            "/api/admin/dashboard",
            {
              method: "GET",
              cache: "no-store",
              signal,
            },
          ),
        ]);

        const ordersData: unknown =
          await ordersResponse
            .json()
            .catch(() => null);

        if (!ordersResponse.ok) {
          const apiError =
            isRecord(ordersData)
              ? (ordersData as ApiError)
              : null;

          throw new Error(
            apiError?.error ||
              apiError?.message ||
              "Failed to fetch orders.",
          );
        }

        if (!Array.isArray(ordersData)) {
          throw new Error(
            "The orders response was invalid.",
          );
        }

        const dashboardData: unknown =
          await dashboardResponse
            .json()
            .catch(() => null);

        const loadedAttentionIds =
          dashboardResponse.ok &&
          isRecord(dashboardData) &&
          Array.isArray(
            dashboardData.needsAttentionOrderIds,
          )
            ? dashboardData.needsAttentionOrderIds.filter(
                (
                  value,
                ): value is string =>
                  typeof value ===
                    "string" &&
                  value.trim().length >
                    0,
              )
            : [];

        setOrders(
          ordersData
            .filter(isOrder)
            .map(normalizeOrder),
        );

        setAttentionOrderIds(
          loadedAttentionIds,
        );
      } catch (loadError) {
        if (
          loadError instanceof DOMException &&
          loadError.name === "AbortError"
        ) {
          return;
        }

        console.error(
          "Orders loading error:",
          loadError,
        );

        setOrders([]);
        setAttentionOrderIds([]);

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load customer orders.",
        );
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    const controller =
      new AbortController();

    void fetchOrders(controller.signal);

    return () => {
      controller.abort();
    };
  }, [fetchOrders]);

  async function updateStatus(
    orderId: string,
    status: OrderStatus,
  ) {
    if (!isOrderStatus(status)) {
      toast.error("Invalid order status.");
      return;
    }

    const currentOrder = orders.find(
      (order) => order.id === orderId,
    );

    if (
      !currentOrder ||
      currentOrder.status === status ||
      updatingOrderId ||
      deletingOrderId
    ) {
      return;
    }

    const previousStatus =
      currentOrder.status;

    setUpdatingOrderId(orderId);

    setOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status,
            }
          : order,
      ),
    );

    try {
      const response = await fetch(
        `/api/admin/orders/${encodeURIComponent(
          orderId,
        )}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            status,
          }),
        },
      );

      const data: unknown = await response
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
            "Failed to update order status.",
        );
      }

      toast.success(
        `Order status updated to ${formatStatus(
          status,
        )}.`,
      );
    } catch (updateError) {
      console.error(
        "Order status update error:",
        updateError,
      );

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.id === orderId
            ? {
                ...order,
                status: previousStatus,
              }
            : order,
        ),
      );

      toast.error(
        updateError instanceof Error
          ? updateError.message
          : "Unable to update order status.",
      );
    } finally {
      setUpdatingOrderId(null);
    }
  }

  async function deleteOrder(
    orderId: string,
  ) {
    if (
      updatingOrderId ||
      deletingOrderId
    ) {
      return;
    }

    const currentOrder =
      orders.find(
        (order) =>
          order.id === orderId,
      );

    if (!currentOrder) {
      toast.error(
        "Order not found.",
      );
      return;
    }

    const confirmed =
      window.confirm(
        `Permanently delete order #${currentOrder.id.slice(
          0,
          8,
        )}?\n\nOnly unpaid, unshipped pending or cancelled orders can be deleted. This action cannot be undone.`,
      );

    if (!confirmed) {
      return;
    }

    setDeletingOrderId(
      orderId,
    );

    try {
      const response =
        await fetch(
          `/api/admin/orders/${encodeURIComponent(
            orderId,
          )}`,
          {
            method: "DELETE",
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
            "Failed to delete order.",
        );
      }

      setOrders(
        (currentOrders) =>
          currentOrders.filter(
            (order) =>
              order.id !==
              orderId,
          ),
      );

      setAttentionOrderIds(
        (currentIds) =>
          currentIds.filter(
            (id) =>
              id !== orderId,
          ),
      );

      toast.success(
        "Order deleted successfully.",
      );
    } catch (deleteError) {
      console.error(
        "Order deletion error:",
        deleteError,
      );

      toast.error(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete order.",
      );
    } finally {
      setDeletingOrderId(null);
    }
  }

  const attentionIdSet =
    useMemo(
      () =>
        new Set(
          attentionOrderIds,
        ),
      [attentionOrderIds],
    );

  const overdueOrders =
    useMemo(
      () =>
        orders.filter(
          (order) =>
            attentionIdSet.has(
              order.id,
            ),
        ),
      [
        orders,
        attentionIdSet,
      ],
    );

  const visibleOrders =
    showOverdueOnly
      ? overdueOrders
      : orders;

  const stats = useMemo(
    () => ({
      total: orders.length,

      pending: orders.filter(
        (order) =>
          order.status === "PENDING",
      ).length,

      preparing: orders.filter(
        (order) =>
          order.status === "PAID" ||
          order.status === "PREPARING" ||
          order.status === "PACKED" ||
          order.status ===
            "OUT_FOR_DELIVERY",
      ).length,

      delivered: orders.filter(
        (order) =>
          order.status === "DELIVERED",
      ).length,

      cancelled: orders.filter(
        (order) =>
          order.status === "CANCELLED",
      ).length,

      overdue:
        overdueOrders.length,
    }),
    [
      orders,
      overdueOrders.length,
    ],
  );

  if (loading) {
    return (
      <section className="min-h-screen bg-gradient-to-br from-[#FFFDF8] via-white to-[#FFF6E9]">
        <div className="flex min-h-[70vh] items-center justify-center">
          <Spinner
            size="lg"
            text="Loading orders..."
          />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="min-h-screen bg-gradient-to-br from-[#FFFDF8] via-white to-[#FFF6E9] py-12">
        <Container>
          <Card
            padding="lg"
            className="mx-auto max-w-xl border-red-200 bg-red-50 text-center"
          >
            <XCircle
              size={42}
              className="mx-auto text-red-500"
              aria-hidden="true"
            />

            <h1 className="mt-5 text-2xl font-bold text-red-700">
              Orders Unavailable
            </h1>

            <p className="mt-3 leading-7 text-red-600">
              {error}
            </p>

            <Button
              type="button"
              variant="primary"
              leftIcon={
                <RefreshCw
                  size={18}
                  aria-hidden="true"
                />
              }
              className="mt-6"
              onClick={() =>
                void fetchOrders()
              }
            >
              Try Again
            </Button>
          </Card>
        </Container>
      </section>
    );
  }

  return (
    <section className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#FFFDF8] via-white to-[#FFF6E9] py-8 sm:py-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-0 h-96 w-96 rounded-full bg-[#FFE7B8]/35 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-[#FFE7B8]/35 blur-3xl"
      />

      <Container className="relative">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge variant="neutral">
              Orders Management
            </Badge>

            <h1 className="mt-5 text-3xl font-bold text-[#6D2E00] sm:text-4xl">
              Customer Orders
            </h1>

            <p className="mt-3 max-w-2xl leading-7 text-gray-600">
              Review orders, update fulfilment
              status and inspect purchased products.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            leftIcon={
              <RefreshCw
                size={18}
                aria-hidden="true"
              />
            }
            onClick={() =>
              void fetchOrders()
            }
          >
            Refresh Orders
          </Button>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <Stat
            title="Total"
            value={stats.total}
            icon={
              <ShoppingBag
                size={24}
                aria-hidden="true"
              />
            }
          />

          <Stat
            title="Pending"
            value={stats.pending}
            icon={
              <Clock3
                size={24}
                aria-hidden="true"
              />
            }
          />

          <Stat
            title="In Progress"
            value={stats.preparing}
            icon={
              <Package
                size={24}
                aria-hidden="true"
              />
            }
          />

          <Stat
            title="Delivered"
            value={stats.delivered}
            icon={
              <Truck
                size={24}
                aria-hidden="true"
              />
            }
          />

          <Stat
            title="Cancelled"
            value={stats.cancelled}
            icon={
              <XCircle
                size={24}
                aria-hidden="true"
              />
            }
          />

          <Stat
            title="Overdue Shipments"
            value={stats.overdue}
            icon={
              <AlertTriangle
                size={24}
                aria-hidden="true"
              />
            }
          />
        </div>

        <Card
          padding="md"
          className="mt-8 border-[#F3DFC2] bg-white/90"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-bold text-[#6D2E00]">
                Shipment priority
              </p>

              <p className="mt-1 text-sm leading-6 text-gray-500">
                Overdue includes paid orders waiting more
                than 60 minutes plus immediate shipment
                failures, RTOs and courier problems.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  setShowOverdueOnly(false)
                }
                className={`inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-[#C89B3C]/20 ${
                  !showOverdueOnly
                    ? "bg-[#6D2E00] text-white"
                    : "border border-[#E7C98C] bg-white text-[#6D2E00] hover:bg-[#FFF8EE]"
                }`}
              >
                All Orders ({orders.length})
              </button>

              <button
                type="button"
                onClick={() =>
                  setShowOverdueOnly(true)
                }
                className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-amber-300/40 ${
                  showOverdueOnly
                    ? "bg-amber-500 text-white"
                    : "border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
                }`}
              >
                <AlertTriangle
                  size={16}
                  aria-hidden="true"
                />

                Overdue Shipments (
                {stats.overdue})
              </button>
            </div>
          </div>
        </Card>

        {visibleOrders.length === 0 ? (
          <Card
            variant="glass"
            padding="lg"
            className="mt-10 bg-white/90 text-center shadow-xl"
          >
            {showOverdueOnly ? (
              <CheckCircle2
                size={52}
                className="mx-auto text-green-600"
                aria-hidden="true"
              />
            ) : (
              <ShoppingBag
                size={52}
                className="mx-auto text-[#C89B3C]"
                aria-hidden="true"
              />
            )}

            <h2 className="mt-5 text-2xl font-bold text-[#6D2E00]">
              {showOverdueOnly
                ? "No Overdue Shipments"
                : "No Orders Found"}
            </h2>

            <p className="mt-2 text-gray-500">
              {showOverdueOnly
                ? "No orders currently require shipment attention."
                : "Orders will appear here when customers begin placing them."}
            </p>
          </Card>
        ) : (
          <div className="mt-10 space-y-6">
            {visibleOrders.map((order) => {
              const isUpdating =
                updatingOrderId === order.id;

              const isDeleting =
                deletingOrderId === order.id;

              const canRequestDeletion =
                order.canDelete;

              const needsAttention =
                attentionIdSet.has(
                  order.id,
                );

              return (
                <Card
                  key={order.id}
                  padding="none"
                  hover
                  className={`overflow-hidden backdrop-blur-sm ${
                    needsAttention
                      ? "border-amber-300 bg-amber-50/70 ring-1 ring-amber-200"
                      : "bg-white/95"
                  }`}
                >
                  <div className="flex flex-col gap-8 p-6 sm:p-8 lg:flex-row lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#FFF4DE] text-[#C89B3C]">
                          <User
                            size={24}
                            aria-hidden="true"
                          />
                        </div>

                        <div className="min-w-0">
                          <h2 className="truncate text-xl font-bold text-[#6D2E00] sm:text-2xl">
                            {order.customerName}
                          </h2>

                          <p className="mt-1 text-sm text-gray-500">
                            Order #
                            {order.id.slice(0, 8)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-6 grid gap-4 text-sm text-gray-700 sm:grid-cols-2">
                        <div>
                          <span className="font-semibold text-[#6D2E00]">
                            Phone:
                          </span>{" "}
                          {order.phone}
                        </div>

                        <div className="min-w-0 break-words">
                          <span className="font-semibold text-[#6D2E00]">
                            Email:
                          </span>{" "}
                          {order.email ||
                            "Not provided"}
                        </div>

                        <div>
                          <span className="font-semibold text-[#6D2E00]">
                            Total:
                          </span>{" "}
                          <span className="text-lg font-bold text-[#C89B3C]">
                            {formatCurrency(
                              order.totalAmount,
                            )}
                          </span>
                        </div>

                        <div>
                          <span className="font-semibold text-[#6D2E00]">
                            Date:
                          </span>{" "}
                          {formatOrderDate(
                            order.createdAt,
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex w-full flex-col gap-4 lg:w-72">
                      {needsAttention && (
                        <Badge
                          variant="warning"
                          rounded
                          className="w-fit gap-2"
                        >
                          <AlertTriangle
                            size={15}
                            aria-hidden="true"
                          />

                          Overdue Shipment
                        </Badge>
                      )}

                      <Badge
                        variant={getStatusVariant(
                          order.status,
                        )}
                        rounded
                        className="w-fit"
                      >
                        {formatStatus(
                          order.status,
                        )}
                      </Badge>

                      <label
                        htmlFor={`status-${order.id}`}
                        className="text-sm font-semibold text-[#6D2E00]"
                      >
                        Update status
                      </label>

                      <select
                        id={`status-${order.id}`}
                        value={order.status}
                        disabled={
                          isUpdating ||
                          isDeleting ||
                          Boolean(
                            updatingOrderId &&
                              !isUpdating,
                          ) ||
                          Boolean(
                            deletingOrderId &&
                              !isDeleting,
                          )
                        }
                        onChange={(event) => {
                          const nextStatus =
                            event.target.value;

                          if (
                            isOrderStatus(
                              nextStatus,
                            )
                          ) {
                            void updateStatus(
                              order.id,
                              nextStatus,
                            );
                          }
                        }}
                        className="h-12 rounded-xl border border-[#E7C98C] bg-white px-4 text-[#6D2E00] outline-none transition focus:border-[#C89B3C] focus:ring-4 focus:ring-[#C89B3C]/15 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {statusOptions.map(
                          (option) => (
                            <option
                              key={
                                option.value
                              }
                              value={
                                option.value
                              }
                            >
                              {option.label}
                            </option>
                          ),
                        )}
                      </select>

                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#6D2E00] px-5 font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#8B4513] focus:outline-none focus:ring-4 focus:ring-[#6D2E00]/20"
                      >
                        <Eye
                          size={18}
                          aria-hidden="true"
                        />

                        View Details
                      </Link>

                      {canRequestDeletion && (
                        <button
                          type="button"
                          disabled={
                            isDeleting ||
                            Boolean(
                              updatingOrderId,
                            ) ||
                            Boolean(
                              deletingOrderId &&
                                !isDeleting,
                            )
                          }
                          onClick={() =>
                            void deleteOrder(
                              order.id,
                            )
                          }
                          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 font-semibold text-red-700 transition-all duration-300 hover:-translate-y-0.5 hover:bg-red-100 focus:outline-none focus:ring-4 focus:ring-red-200 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Trash2
                            size={18}
                            aria-hidden="true"
                          />

                          {isDeleting
                            ? "Deleting..."
                            : "Delete Order"}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-[#F3DFC2] bg-[#FFFDF8] p-6 sm:p-8">
                    <div className="flex items-center gap-3">
                      <CheckCircle2
                        size={20}
                        className="text-[#C89B3C]"
                        aria-hidden="true"
                      />

                      <h3 className="text-lg font-bold text-[#6D2E00]">
                        Ordered Items
                      </h3>
                    </div>

                    <div className="mt-5 space-y-3">
                      {order.items.length === 0 ? (
                        <p className="rounded-2xl border border-dashed border-[#F3DFC2] bg-white px-5 py-6 text-center text-gray-500">
                          No order items found.
                        </p>
                      ) : (
                        order.items.map(
                          (item) => {
                            const lineTotal =
                              item.price *
                              item.quantity;

                            return (
                              <div
                                key={item.id}
                                className="flex items-center justify-between gap-5 rounded-2xl border border-[#F3DFC2] bg-white px-5 py-4"
                              >
                                <div className="min-w-0">
                                  <p className="truncate font-semibold text-[#6D2E00]">
                                    {item.productName ||
                                      item.product.name}
                                  </p>

                                  {item.variantLabel && (
                                    <p className="mt-1 text-sm font-semibold text-[#C89B3C]">
                                      {item.variantLabel}
                                      {item.variantSku
                                        ? ` • SKU: ${item.variantSku}`
                                        : ""}
                                    </p>
                                  )}

                                  <p className="mt-1 text-sm text-gray-500">
                                    Quantity:{" "}
                                    {item.quantity}
                                    {item.variantWeightGrams !==
                                      null &&
                                    item.variantWeightGrams !==
                                      undefined
                                      ? ` • ${item.variantWeightGrams} g`
                                      : ""}
                                  </p>
                                </div>

                                <div className="shrink-0 text-right">
                                  <p className="font-bold text-[#6D2E00]">
                                    {formatCurrency(
                                      lineTotal,
                                    )}
                                  </p>

                                  <p className="mt-1 text-xs text-gray-500">
                                    {formatCurrency(
                                      item.price,
                                    )}{" "}
                                    each
                                  </p>
                                </div>
                              </div>
                            );
                          },
                        )
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </Container>
    </section>
  );
}