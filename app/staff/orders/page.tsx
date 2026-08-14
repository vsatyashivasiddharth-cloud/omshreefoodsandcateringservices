"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  CheckCircle2,
  Clock3,
  IndianRupee,
  MapPin,
  Package,
  RefreshCw,
  Truck,
  UserRound,
} from "lucide-react";

type StaffCategory =
  | "NEW"
  | "SHIPMENT_CREATED"
  | "DELIVERED";

interface StaffOrderItem {
  id: string;
  quantity: number;
  price: number;
  productName: string;
  productImage: string | null;
  variantLabel: string | null;
  variantSku: string | null;
}

interface StaffPrintJob {
  id: string;
  status:
    | "PENDING"
    | "PRINTING"
    | "PRINTED"
    | "FAILED";
  attemptCount: number;
  claimedAt: string | null;
  printedAt: string | null;
  lastError: string | null;
  createdAt: string;
}

interface StaffOrder {
  id: string;

  category: StaffCategory;

  customerName: string;
  phone: string;
  email: string;

  address: string;
  city: string;
  state: string;
  pincode: string;

  totalAmount: number;

  status: string;
  paymentStatus: string;

  staffSeenAt: string | null;

  shippingProvider: string;
  shipmentStatus: string;

  delhiveryWaybill: string | null;
  delhiveryStatus: string | null;

  shippedAt: string | null;
  deliveredAt: string | null;

  createdAt: string;
  updatedAt: string;

  items: StaffOrderItem[];

  printJob: StaffPrintJob | null;
}

interface ApiError {
  error?: string;
}

type StaffOrderAction =
  | "SEEN"
  | "PREPARING"
  | "PACKED";

type LocalShipmentStatus =
  | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED";

const tabs: Array<{
  value: StaffCategory;
  label: string;
  icon:
    typeof Package;
}> = [
  {
    value: "NEW",
    label: "New",
    icon: Package,
  },
  {
    value: "SHIPMENT_CREATED",
    label: "Shipment Created",
    icon: Truck,
  },
  {
    value: "DELIVERED",
    label: "Delivered",
    icon: CheckCircle2,
  },
];

function formatMoney(
  amount: number,
) {
  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    },
  ).format(amount);
}

function formatDate(
  value: string,
) {
  return new Intl.DateTimeFormat(
    "en-IN",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(
    new Date(value),
  );
}

function formatStatus(
  value: string,
) {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase(),
    );
}

export default function StaffOrdersPage() {
  const [
    activeCategory,
    setActiveCategory,
  ] =
    useState<StaffCategory>(
      "NEW",
    );

  const [
    orders,
    setOrders,
  ] =
    useState<StaffOrder[]>([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );

  const loadOrders =
    useCallback(
      async (
        refresh = false,
      ) => {
        if (refresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError(null);

        try {
          const response =
            await fetch(
              "/api/staff/orders",
              {
                method: "GET",
                cache: "no-store",
                credentials:
                  "same-origin",
              },
            );

          const data:
            unknown =
            await response
              .json()
              .catch(
                () => null,
              );

          if (!response.ok) {
            const apiError =
              data &&
              typeof data ===
                "object" &&
              !Array.isArray(
                data,
              )
                ? data as ApiError
                : null;

            throw new Error(
              apiError?.error ||
                "Unable to load Staff Orders.",
            );
          }

          if (!Array.isArray(data)) {
            throw new Error(
              "The Staff Orders response was invalid.",
            );
          }

          setOrders(
            data as StaffOrder[],
          );
        } catch (
          loadError
        ) {
          console.error(
            "Staff Orders load error:",
            loadError,
          );

          setError(
            loadError instanceof
              Error
              ? loadError.message
              : "Unable to load Staff Orders.",
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [],
    );

  const [
    workingOrderId,
    setWorkingOrderId,
  ] =
    useState<string | null>(
      null,
    );

  const [
    workingAction,
    setWorkingAction,
  ] =
    useState<
      StaffOrderAction |
      "SHIPMENT" |
      LocalShipmentStatus |
      null
    >(null);

  async function runStaffAction(
    orderId: string,
    action: StaffOrderAction,
  ) {
    if (workingOrderId) {
      return;
    }

    setWorkingOrderId(
      orderId,
    );

    setWorkingAction(
      action,
    );

    setError(null);

    try {
      const response =
        await fetch(
          `/api/staff/orders/${encodeURIComponent(
            orderId,
          )}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              action,
            }),

            credentials:
              "same-origin",

            cache:
              "no-store",
          },
        );

      const data: unknown =
        await response
          .json()
          .catch(
            () => null,
          );

      if (!response.ok) {
        const apiError =
          data &&
          typeof data ===
            "object" &&
          !Array.isArray(
            data,
          )
            ? data as ApiError
            : null;

        throw new Error(
          apiError?.error ||
            "Unable to update the order.",
        );
      }

      await loadOrders(
        true,
      );
    } catch (
      actionError
    ) {
      console.error(
        "Staff Order action error:",
        actionError,
      );

      setError(
        actionError instanceof
          Error
          ? actionError.message
          : "Unable to update the order.",
      );
    } finally {
      setWorkingOrderId(
        null,
      );

      setWorkingAction(
        null,
      );
    }
  }

  async function createShipment(
    orderId: string,
  ) {
    if (workingOrderId) {
      return;
    }

    const confirmed =
      window.confirm(
        "Create the Delhivery shipment for this packed order?",
      );

    if (!confirmed) {
      return;
    }

    setWorkingOrderId(
      orderId,
    );

    setWorkingAction(
      "SHIPMENT",
    );

    setError(null);

    try {
      const response =
        await fetch(
          `/api/orders/${encodeURIComponent(
            orderId,
          )}/shipment`,
          {
            method: "POST",

            credentials:
              "same-origin",

            cache:
              "no-store",
          },
        );

      const data: unknown =
        await response
          .json()
          .catch(
            () => null,
          );

      if (!response.ok) {
        const apiError =
          data &&
          typeof data ===
            "object" &&
          !Array.isArray(
            data,
          )
            ? data as ApiError
            : null;

        throw new Error(
          apiError?.error ||
            "Unable to create the shipment.",
        );
      }

      /*
       * The Staff list API derives its tab
       * from shipment state, so refreshing
       * moves this order automatically into
       * Shipment Created after success.
       */
      await loadOrders(
        true,
      );
    } catch (
      shipmentError
    ) {
      console.error(
        "Staff shipment creation error:",
        shipmentError,
      );

      setError(
        shipmentError instanceof
          Error
          ? shipmentError.message
          : "Unable to create the shipment.",
      );
    } finally {
      setWorkingOrderId(
        null,
      );

      setWorkingAction(
        null,
      );
    }
  }

  async function updateLocalShipment(
    orderId: string,
    shipmentStatus: LocalShipmentStatus,
  ) {
    if (workingOrderId) {
      return;
    }

    const confirmationMessage =
      shipmentStatus === "IN_TRANSIT"
        ? "Mark this Local Logistics order as dispatched?"
        : shipmentStatus ===
            "OUT_FOR_DELIVERY"
          ? "Mark this Local Logistics order as out for delivery?"
          : "Mark this Local Logistics order as delivered?";

    if (
      !window.confirm(
        confirmationMessage,
      )
    ) {
      return;
    }

    setWorkingOrderId(
      orderId,
    );

    setWorkingAction(
      shipmentStatus,
    );

    setError(null);

    try {
      const response =
        await fetch(
          `/api/admin/orders/${encodeURIComponent(
            orderId,
          )}/fulfilment`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              provider: "MANUAL",
              shipmentStatus,
            }),

            credentials:
              "same-origin",

            cache:
              "no-store",
          },
        );

      const data: unknown =
        await response
          .json()
          .catch(
            () => null,
          );

      if (!response.ok) {
        const apiError =
          data &&
          typeof data ===
            "object" &&
          !Array.isArray(
            data,
          )
            ? data as ApiError
            : null;

        throw new Error(
          apiError?.error ||
            "Unable to update Local Logistics.",
        );
      }

      await loadOrders(
        true,
      );
    } catch (
      fulfilmentError
    ) {
      console.error(
        "Staff Local Logistics error:",
        fulfilmentError,
      );

      setError(
        fulfilmentError instanceof
          Error
          ? fulfilmentError.message
          : "Unable to update Local Logistics.",
      );
    } finally {
      setWorkingOrderId(
        null,
      );

      setWorkingAction(
        null,
      );
    }
  }

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const counts =
    useMemo(
      () => ({
        NEW:
          orders.filter(
            (order) =>
              order.category ===
              "NEW",
          ).length,

        SHIPMENT_CREATED:
          orders.filter(
            (order) =>
              order.category ===
              "SHIPMENT_CREATED",
          ).length,

        DELIVERED:
          orders.filter(
            (order) =>
              order.category ===
              "DELIVERED",
          ).length,
      }),
      [orders],
    );

  const visibleOrders =
    useMemo(
      () =>
        orders.filter(
          (order) =>
            order.category ===
            activeCategory,
        ),
      [
        activeCategory,
        orders,
      ],
    );

  return (
    <main className="min-h-screen bg-[#FFF9EF] pb-[env(safe-area-inset-bottom)]">
      <header className="sticky top-0 z-30 border-b border-[#ECD7B5] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#A66A00] sm:text-xs">
              Om Shree Foods
            </p>

            <h1 className="mt-0.5 text-xl font-bold leading-tight text-[#6D2E00] sm:text-2xl">
              Staff Orders
            </h1>

            <p className="mt-0.5 hidden text-xs text-gray-600 sm:block">
              Packing and shipment
              operations
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              void loadOrders(
                true,
              )
            }
            disabled={
              refreshing
            }
            aria-label={
              refreshing
                ? "Refreshing orders"
                : "Refresh orders"
            }
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-[#D8B775] bg-white text-[#6D2E00] shadow-sm transition hover:bg-[#FFF4DE] disabled:cursor-not-allowed disabled:opacity-60 sm:size-auto sm:min-h-11 sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm sm:font-semibold"
          >
            <RefreshCw
              size={17}
              className={
                refreshing
                  ? "animate-spin"
                  : undefined
              }
              aria-hidden="true"
            />

            <span className="hidden sm:inline">
              {refreshing
                ? "Refreshing..."
                : "Refresh Orders"}
            </span>
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-3 py-3 sm:px-6 sm:py-5 lg:px-8">
        <div className="grid grid-cols-3 gap-1.5 rounded-2xl border border-[#ECD7B5] bg-white p-1.5 shadow-sm sm:gap-2 sm:p-2">
          {tabs.map(
            (tab) => {
              const Icon =
                tab.icon;

              const active =
                activeCategory ===
                tab.value;

              return (
                <button
                  key={
                    tab.value
                  }
                  type="button"
                  onClick={() =>
                    setActiveCategory(
                      tab.value,
                    )
                  }
                  className={
                    active
                      ? "flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl bg-[#6D2E00] px-1.5 py-2 text-xs font-semibold text-white shadow-sm sm:min-h-16 sm:flex-row sm:gap-2 sm:px-4 sm:py-3 sm:text-sm"
                      : "flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1.5 py-2 text-xs font-semibold text-[#6D2E00] transition hover:bg-[#FFF4DE] sm:min-h-16 sm:flex-row sm:gap-2 sm:px-4 sm:py-3 sm:text-sm"
                  }
                >
                  <Icon
                    size={18}
                    aria-hidden="true"
                  />

                  <span className="hidden sm:inline">
                    {tab.label}
                  </span>

                  <span className="sm:hidden">
                    {tab.value ===
                    "SHIPMENT_CREATED"
                      ? "Shipped"
                      : tab.label}
                  </span>

                  <span
                    className={
                      active
                        ? "rounded-full bg-white/20 px-2 py-0.5 text-xs"
                        : "rounded-full bg-[#FFF4DE] px-2 py-0.5 text-xs"
                    }
                  >
                    {
                      counts[
                        tab.value
                      ]
                    }
                  </span>
                </button>
              );
            },
          )}
        </div>

        {loading ? (
          <div className="mt-6 rounded-2xl border border-[#ECD7B5] bg-white p-12 text-center shadow-sm">
            <RefreshCw
              size={28}
              className="mx-auto animate-spin text-[#A66A00]"
              aria-hidden="true"
            />

            <p className="mt-4 font-semibold text-[#6D2E00]">
              Loading Staff
              Orders...
            </p>
          </div>
        ) : error ? (
          <div
            role="alert"
            className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700"
          >
            <p className="font-semibold">
              Could not load
              orders
            </p>

            <p className="mt-2 text-sm">
              {error}
            </p>
          </div>
        ) : visibleOrders.length ===
          0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-[#D8B775] bg-white p-12 text-center">
            <Package
              size={38}
              className="mx-auto text-[#C89B3C]"
              aria-hidden="true"
            />

            <h2 className="mt-4 text-xl font-bold text-[#6D2E00]">
              No{" "}
              {
                tabs.find(
                  (tab) =>
                    tab.value ===
                    activeCategory,
                )?.label
              }{" "}
              orders
            </h2>

            <p className="mt-2 text-sm text-gray-600">
              Orders will appear
              here automatically as
              they move through the
              fulfilment workflow.
            </p>
          </div>
        ) : (
          <div className="mt-3 space-y-3 sm:mt-5 sm:space-y-4">
            {visibleOrders.map(
              (order) => (
                <article
                  key={
                    order.id
                  }
                  className="overflow-hidden rounded-2xl border border-[#ECD7B5] bg-white shadow-sm shadow-[#6D2E00]/5"
                >
                  <div className="flex items-start justify-between gap-3 border-b border-[#F1E4CF] bg-[#FFFDF8] p-4 sm:p-5">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-bold text-[#6D2E00]">
                          Order #
                          {order.id.slice(
                            -8,
                          )}
                        </h2>

                        {order.category ===
                          "NEW" &&
                          !order.staffSeenAt && (
                            <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700">
                              NEW
                            </span>
                          )}
                      </div>

                      <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                        <Clock3
                          size={15}
                          aria-hidden="true"
                        />

                        {formatDate(
                          order.createdAt,
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <div className="flex items-center justify-end gap-1 text-lg font-bold text-[#6D2E00] sm:text-xl">
                        <IndianRupee
                          size={18}
                          aria-hidden="true"
                        />

                        {formatMoney(
                          order.totalAmount,
                        ).replace(
                          "₹",
                          "",
                        )}
                      </div>

                      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-green-700">
                        Paid
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[1fr_1.4fr] lg:gap-6">
                    <div className="space-y-4 sm:space-y-5">
                      <div>
                        <div className="flex items-center gap-2 text-sm font-bold text-[#6D2E00]">
                          <UserRound
                            size={17}
                            aria-hidden="true"
                          />

                          Customer
                        </div>

                        <p className="mt-2 font-semibold text-gray-900">
                          {
                            order.customerName
                          }
                        </p>

                        <p className="mt-1 text-sm text-gray-600">
                          {order.phone}
                        </p>

                        <p className="text-sm text-gray-600">
                          {order.email}
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 text-sm font-bold text-[#6D2E00]">
                          <MapPin
                            size={17}
                            aria-hidden="true"
                          />

                          Delivery Address
                        </div>

                        <p className="mt-2 text-sm leading-6 text-gray-700">
                          {order.address}
                          <br />
                          {order.city},{" "}
                          {order.state}{" "}
                          {order.pincode}
                        </p>
                      </div>

                      <div className="rounded-xl border border-[#ECD7B5] bg-[#FFF4DE] p-3.5 sm:p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[#A66A00]">
                          Fulfilment
                        </p>

                        <p className="mt-2 text-sm font-semibold text-[#6D2E00]">
                          {order.shippingProvider ===
                          "MANUAL"
                            ? "Local Logistics"
                            : formatStatus(
                                order.shippingProvider,
                              )}
                        </p>

                        <p className="mt-1 text-sm text-gray-600">
                          {formatStatus(
                            order.shipmentStatus,
                          )}
                        </p>

                        {order.delhiveryWaybill && (
                          <p className="mt-2 text-sm font-medium text-gray-700">
                            AWB:{" "}
                            {
                              order.delhiveryWaybill
                            }
                          </p>
                        )}

                        {order.delhiveryStatus && (
                          <p className="mt-1 text-sm text-gray-600">
                            Delhivery:{" "}
                            {
                              order.delhiveryStatus
                            }
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 text-sm font-bold text-[#6D2E00]">
                        <Package
                          size={17}
                          aria-hidden="true"
                        />

                        Products
                      </div>

                      <div className="mt-2.5 divide-y divide-[#F1E4CF] overflow-hidden rounded-xl border border-[#F1E4CF]">
                        {order.items.map(
                          (item) => (
                            <div
                              key={
                                item.id
                              }
                              className="flex gap-3 p-3.5 sm:p-4"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-gray-900">
                                  {
                                    item.productName
                                  }
                                </p>

                                {item.variantLabel && (
                                  <p className="mt-1 text-sm text-gray-500">
                                    {
                                      item.variantLabel
                                    }

                                    {item.variantSku
                                      ? ` · ${item.variantSku}`
                                      : ""}
                                  </p>
                                )}

                                <p className="mt-2 text-sm text-gray-700">
                                  Qty:{" "}
                                  {
                                    item.quantity
                                  }{" "}
                                  ×{" "}
                                  {formatMoney(
                                    item.price,
                                  )}
                                </p>
                              </div>
                            </div>
                          ),
                        )}
                      </div>

                      {order.category ===
                        "NEW" && (
                        <div className="mt-4 rounded-xl border border-[#E4D4BA] bg-[#FFF8EE] p-3.5 sm:p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-[#A66A00]">
                            Order Progress
                          </p>

                          <p className="mt-1 text-sm font-semibold text-[#6D2E00]">
                            {order.status ===
                            "PAID"
                              ? "Paid - ready to prepare"
                              : order.status ===
                                  "PREPARING"
                                ? "Preparing"
                                : order.status ===
                                    "PACKED"
                                  ? "Packed - ready for shipment"
                                  : formatStatus(
                                      order.status,
                                    )}
                          </p>

                          <div className="mt-4 grid gap-2 sm:flex sm:flex-wrap">
                            {!order.staffSeenAt && (
                              <button
                                type="button"
                                disabled={
                                  workingOrderId !==
                                  null
                                }
                                onClick={() =>
                                  void runStaffAction(
                                    order.id,
                                    "SEEN",
                                  )
                                }
                                className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-[#D8B775] bg-white px-4 py-3 text-sm font-semibold text-[#6D2E00] transition hover:bg-[#FFF4DE] disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-11 sm:w-auto sm:py-2.5"
                              >
                                {workingOrderId ===
                                  order.id &&
                                workingAction ===
                                  "SEEN"
                                  ? "Marking Seen..."
                                  : "Mark Seen"}
                              </button>
                            )}

                            {order.status ===
                              "PAID" && (
                              <button
                                type="button"
                                disabled={
                                  workingOrderId !==
                                  null
                                }
                                onClick={() =>
                                  void runStaffAction(
                                    order.id,
                                    "PREPARING",
                                  )
                                }
                                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#A66A00] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#8B5A00] disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-11 sm:w-auto sm:py-2.5"
                              >
                                <Clock3
                                  size={17}
                                  aria-hidden="true"
                                />

                                {workingOrderId ===
                                  order.id &&
                                workingAction ===
                                  "PREPARING"
                                  ? "Starting..."
                                  : "Start Preparing"}
                              </button>
                            )}

                            {order.status ===
                              "PREPARING" && (
                              <button
                                type="button"
                                disabled={
                                  workingOrderId !==
                                  null
                                }
                                onClick={() =>
                                  void runStaffAction(
                                    order.id,
                                    "PACKED",
                                  )
                                }
                                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#6D2E00] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#8B4513] disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-11 sm:w-auto sm:py-2.5"
                              >
                                <Package
                                  size={17}
                                  aria-hidden="true"
                                />

                                {workingOrderId ===
                                  order.id &&
                                workingAction ===
                                  "PACKED"
                                  ? "Marking Packed..."
                                  : "Mark Packed"}
                              </button>
                            )}

                            {order.status ===
                              "PACKED" &&
                              order.shippingProvider ===
                                "DELHIVERY" &&
                              !order.delhiveryWaybill && (
                                <button
                                  type="button"
                                  disabled={
                                    workingOrderId !==
                                    null
                                  }
                                  onClick={() =>
                                    void createShipment(
                                      order.id,
                                    )
                                  }
                                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-green-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-11 sm:w-auto sm:py-2.5"
                                >
                                  <Truck
                                    size={17}
                                    aria-hidden="true"
                                  />

                                  {workingOrderId ===
                                    order.id &&
                                  workingAction ===
                                    "SHIPMENT"
                                    ? "Creating Shipment..."
                                    : "Create Shipment"}
                                </button>
                              )}

                            {order.status ===
                              "PACKED" &&
                              order.shippingProvider ===
                                "MANUAL" &&
                              order.shipmentStatus ===
                                "CREATED" && (
                                <button
                                  type="button"
                                  disabled={
                                    workingOrderId !==
                                    null
                                  }
                                  onClick={() =>
                                    void updateLocalShipment(
                                      order.id,
                                      "IN_TRANSIT",
                                    )
                                  }
                                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-green-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-11 sm:w-auto sm:py-2.5"
                                >
                                  <Truck
                                    size={17}
                                    aria-hidden="true"
                                  />

                                  {workingOrderId ===
                                    order.id &&
                                  workingAction ===
                                    "IN_TRANSIT"
                                    ? "Marking Dispatched..."
                                    : "Mark Dispatched"}
                                </button>
                              )}
                          </div>
                        </div>
                      )}

                      {order.category ===
                        "SHIPMENT_CREATED" &&
                        order.shippingProvider ===
                          "MANUAL" && (
                          <div className="mt-4 rounded-xl border border-[#D6E6D8] bg-green-50 p-3.5 sm:p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
                              Local Logistics Progress
                            </p>

                            <p className="mt-1 text-sm font-semibold text-gray-900">
                              {formatStatus(
                                order.shipmentStatus,
                              )}
                            </p>

                            <div className="mt-4 grid gap-2 sm:flex sm:flex-wrap">
                              {order.shipmentStatus ===
                                "IN_TRANSIT" && (
                                <button
                                  type="button"
                                  disabled={
                                    workingOrderId !==
                                    null
                                  }
                                  onClick={() =>
                                    void updateLocalShipment(
                                      order.id,
                                      "OUT_FOR_DELIVERY",
                                    )
                                  }
                                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#A66A00] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#8B5A00] disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-11 sm:w-auto sm:py-2.5"
                                >
                                  <Truck
                                    size={17}
                                    aria-hidden="true"
                                  />

                                  {workingOrderId ===
                                    order.id &&
                                  workingAction ===
                                    "OUT_FOR_DELIVERY"
                                    ? "Updating..."
                                    : "Out for Delivery"}
                                </button>
                              )}

                              {order.shipmentStatus ===
                                "OUT_FOR_DELIVERY" && (
                                <button
                                  type="button"
                                  disabled={
                                    workingOrderId !==
                                    null
                                  }
                                  onClick={() =>
                                    void updateLocalShipment(
                                      order.id,
                                      "DELIVERED",
                                    )
                                  }
                                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-green-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-11 sm:w-auto sm:py-2.5"
                                >
                                  <CheckCircle2
                                    size={17}
                                    aria-hidden="true"
                                  />

                                  {workingOrderId ===
                                    order.id &&
                                  workingAction ===
                                    "DELIVERED"
                                    ? "Marking Delivered..."
                                    : "Mark Delivered"}
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                      {order.printJob && (
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E4D4BA] bg-[#FFFCF7] p-3.5 sm:p-4">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                              Ecommerce
                              Label
                            </p>

                            <p className="mt-1 font-semibold text-[#6D2E00]">
                              {formatStatus(
                                order
                                  .printJob
                                  .status,
                              )}
                            </p>
                          </div>

                          {order.printJob
                            .printedAt && (
                            <p className="text-xs text-gray-500">
                              Printed{" "}
                              {formatDate(
                                order
                                  .printJob
                                  .printedAt,
                              )}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              ),
            )}
          </div>
        )}
      </div>
    </main>
  );
}
