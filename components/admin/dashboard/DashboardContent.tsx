"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Boxes,
  ChevronRight,
  CircleAlert,
  ClipboardList,
  IndianRupee,
  LayoutGrid,
  PackageCheck,
  ShoppingBag,
  Truck,
} from "lucide-react";

import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";
import Spinner from "@/components/ui/Spinner";

import LowStockProducts, {
  type LowStockProduct,
} from "./LowStockProducts";
import RecentOrders from "./RecentOrders";
import RevenueChart, {
  type RevenueDataPoint,
} from "./RevenueChart";
import StatCard from "./StatCard";

interface RecentOrder {
  id: string;
  customerName: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

type AttentionSeverity =
  | "critical"
  | "warning"
  | "info";

interface AttentionOrder {
  id: string;
  customerName: string;
  totalAmount: number;
  orderStatus: string;
  shipmentStatus: string;
  delhiveryStatus: string | null;
  delhiveryWaybill: string | null;
  shippingQuotedAt: string | null;
  createdAt: string;
  updatedAt: string;
  severity: AttentionSeverity;
  reason: string;
  action: string;
  ageMinutes: number;
}

interface DashboardData {
  totalOrders: number;
  totalProducts: number;
  totalCategories: number;
  pendingOrders: number;
  deliveredOrders: number;
  revenue: number;
  revenueChart: RevenueDataPoint[];
  recentOrders: RecentOrder[];
  lowStockProducts: LowStockProduct[];
  needsAttention: AttentionOrder[];
  needsAttentionCount: number;
}

function formatStatus(
  value: string,
) {
  return value
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .toLowerCase()
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase(),
    );
}

function formatAge(
  ageMinutes: number,
) {
  const safeMinutes =
    Math.max(
      0,
      Math.floor(ageMinutes),
    );

  if (safeMinutes < 60) {
    return `${safeMinutes} min`;
  }

  const hours =
    Math.floor(
      safeMinutes / 60,
    );

  if (hours < 24) {
    return `${hours} hr${
      hours === 1 ? "" : "s"
    }`;
  }

  const days =
    Math.floor(
      hours / 24,
    );

  return `${days} day${
    days === 1 ? "" : "s"
  }`;
}

function getSeverityBadgeVariant(
  severity: AttentionSeverity,
):
  | "danger"
  | "warning"
  | "neutral" {
  switch (severity) {
    case "critical":
      return "danger";

    case "warning":
      return "warning";

    default:
      return "neutral";
  }
}

export default function DashboardContent() {
  const [
    data,
    setData,
  ] =
    useState<DashboardData | null>(
      null,
    );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const loadDashboard =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await fetch(
            "/api/admin/dashboard",
            {
              cache:
                "no-store",
            },
          );

        const result: unknown =
          await response
            .json()
            .catch(
              () => null,
            );

        if (!response.ok) {
          throw new Error(
            "Unable to load dashboard information.",
          );
        }

        if (
          !result ||
          typeof result !==
            "object"
        ) {
          throw new Error(
            "Invalid dashboard response.",
          );
        }

        setData(
          result as DashboardData,
        );
      } catch (error) {
        console.error(
          "Dashboard loading error:",
          error,
        );

        setData(null);

        setError(
          error instanceof Error
            ? error.message
            : "Something went wrong while loading the dashboard.",
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  if (loading) {
    return (
      <section className="min-h-[70vh] bg-gradient-to-br from-[#FFFDF8] via-white to-[#FFF6E9]">
        <div className="flex min-h-[70vh] items-center justify-center">
          <Spinner
            size="lg"
            text="Loading dashboard..."
          />
        </div>
      </section>
    );
  }

  if (
    !data ||
    error
  ) {
    return (
      <section className="min-h-[70vh] bg-gradient-to-br from-[#FFFDF8] via-white to-[#FFF6E9] py-12">
        <Container>
          <Card
            padding="lg"
            className="mx-auto max-w-xl border-red-200 bg-red-50 text-center"
          >
            <CircleAlert
              size={42}
              className="mx-auto text-red-500"
              aria-hidden="true"
            />

            <h1 className="mt-5 text-2xl font-bold text-red-700">
              Dashboard unavailable
            </h1>

            <p className="mt-3 leading-7 text-red-600">
              {error ||
                "Dashboard information could not be loaded."}
            </p>

            <Button
              type="button"
              variant="primary"
              className="mt-6"
              onClick={() =>
                void loadDashboard()
              }
            >
              Try Again
            </Button>
          </Card>
        </Container>
      </section>
    );
  }

  const needsAttention =
    Array.isArray(
      data.needsAttention,
    )
      ? data.needsAttention
      : [];

  const statistics = [
    {
      title:
        "Total Orders",

      value:
        data.totalOrders,

      icon:
        ClipboardList,
    },

    {
      title:
        "Revenue",

      value:
        `₹${data.revenue.toLocaleString(
          "en-IN",
          {
            minimumFractionDigits:
              0,
            maximumFractionDigits:
              2,
          },
        )}`,

      icon:
        IndianRupee,
    },

    {
      title:
        "Products",

      value:
        data.totalProducts,

      icon:
        ShoppingBag,
    },

    {
      title:
        "Categories",

      value:
        data.totalCategories,

      icon:
        Boxes,
    },

    {
      title:
        "Pending Orders",

      value:
        data.pendingOrders,

      icon:
        PackageCheck,
    },

    {
      title:
        "Delivered Orders",

      value:
        data.deliveredOrders,

      icon:
        Truck,
    },

    {
      title:
        "Needs Attention",

      value:
        Number.isFinite(
          data.needsAttentionCount,
        )
          ? data.needsAttentionCount
          : needsAttention.length,

      icon:
        AlertTriangle,
    },
  ];

  return (
    <section className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#FFFDF8] via-white to-[#FFF6E9] py-8 sm:py-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-0 h-96 w-96 rounded-full bg-[#FFE7B8]/40 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-[#FFE7B8]/40 blur-3xl"
      />

      <Container className="relative">
        <SectionHeader
          badge={
            <Badge
              variant="neutral"
              className="gap-2"
            >
              <LayoutGrid
                size={17}
                aria-hidden="true"
              />

              Admin Dashboard
            </Badge>
          }
          title="Dashboard Overview"
          description="Monitor orders, products, categories, inventory, fulfilment and revenue from one central place."
          align="left"
        />

        <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {statistics.map(
            (
              statistic,
            ) => {
              const Icon =
                statistic.icon;

              return (
                <StatCard
                  key={
                    statistic.title
                  }
                  title={
                    statistic.title
                  }
                  value={
                    statistic.value
                  }
                  icon={
                    <Icon
                      size={23}
                      aria-hidden="true"
                    />
                  }
                />
              );
            },
          )}
        </div>

        <Card
          padding="lg"
          className={`mt-10 shadow-xl backdrop-blur-sm ${
            needsAttention.length >
            0
              ? "border-amber-200 bg-amber-50/90"
              : "border-green-200 bg-green-50/80"
          }`}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                    needsAttention.length >
                    0
                      ? "bg-amber-100 text-amber-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  <AlertTriangle
                    size={22}
                    aria-hidden="true"
                  />
                </span>

                <div>
                  <h2 className="text-2xl font-bold text-[#6D2E00]">
                    Needs Attention
                  </h2>

                  <p className="mt-1 text-sm text-gray-600">
                    Paid orders that may
                    need shipment or
                    delivery action.
                  </p>
                </div>
              </div>
            </div>

            <Badge
              variant={
                needsAttention.length >
                0
                  ? "warning"
                  : "success"
              }
              rounded
            >
              {needsAttention.length >
              0
                ? `${needsAttention.length} order${
                    needsAttention.length ===
                    1
                      ? ""
                      : "s"
                  }`
                : "All clear"}
            </Badge>
          </div>

          {needsAttention.length ===
          0 ? (
            <div className="mt-6 rounded-2xl border border-green-200 bg-white/80 p-5">
              <p className="font-semibold text-green-800">
                No paid orders currently
                require shipment attention.
              </p>

              <p className="mt-1 text-sm leading-6 text-green-700">
                New shipment issues will
                appear here automatically
                when the dashboard is
                refreshed.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {needsAttention.map(
                (order) => (
                  <Link
                    key={order.id}
                    href={`/admin/orders/${encodeURIComponent(
                      order.id,
                    )}`}
                    className="group block rounded-2xl border border-[#E7C98C] bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#C89B3C] hover:shadow-md focus:outline-none focus:ring-4 focus:ring-[#C89B3C]/20"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant={getSeverityBadgeVariant(
                              order.severity,
                            )}
                            rounded
                          >
                            {order.severity ===
                            "critical"
                              ? "Action Required"
                              : order.severity ===
                                  "warning"
                                ? "Review"
                                : "Shipment Pending"}
                          </Badge>

                          <Badge
                            variant="neutral"
                            rounded
                          >
                            {formatStatus(
                              order.shipmentStatus,
                            )}
                          </Badge>

                          <span className="text-xs font-medium text-gray-500">
                            {formatAge(
                              order.ageMinutes,
                            )}{" "}
                            old
                          </span>
                        </div>

                        <h3 className="mt-3 truncate text-lg font-bold text-[#6D2E00]">
                          {order.customerName}
                        </h3>

                        <p className="mt-1 break-all text-xs text-gray-500">
                          {order.id}
                        </p>

                        <p className="mt-3 font-semibold text-gray-800">
                          {order.reason}
                        </p>

                        <p className="mt-1 text-sm leading-6 text-gray-600">
                          {order.action}
                        </p>

                        {order.delhiveryStatus && (
                          <p className="mt-2 text-sm text-gray-500">
                            Delhivery:{" "}
                            {order.delhiveryStatus}
                          </p>
                        )}
                      </div>

                      <div className="flex shrink-0 items-center justify-between gap-5 lg:flex-col lg:items-end">
                        <p className="font-bold text-[#6D2E00]">
                          ₹
                          {order.totalAmount.toLocaleString(
                            "en-IN",
                            {
                              minimumFractionDigits:
                                0,
                              maximumFractionDigits:
                                2,
                            },
                          )}
                        </p>

                        <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#8A3B00] transition group-hover:text-[#C89B3C]">
                          Open Order
                          <ChevronRight
                            size={17}
                            aria-hidden="true"
                          />
                        </span>
                      </div>
                    </div>
                  </Link>
                ),
              )}
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#8A3B00] transition hover:text-[#C89B3C] focus:outline-none focus:ring-4 focus:ring-[#C89B3C]/20"
            >
              View all orders
              <ChevronRight
                size={17}
                aria-hidden="true"
              />
            </Link>
          </div>
        </Card>

        <Card
          padding="lg"
          className="mt-10 bg-white/95 shadow-xl backdrop-blur-sm"
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Badge
                variant="neutral"
                rounded
              >
                Shipping Management
              </Badge>

              <h2 className="mt-4 text-2xl font-bold text-[#6D2E00]">
                Shipping Packages
              </h2>

              <p className="mt-2 max-w-2xl leading-7 text-gray-600">
                Manage your Small, Medium,
                Large and other shipping
                boxes, including outer
                dimensions, empty package
                weight and maximum packed
                weight used for Delhivery
                calculations.
              </p>
            </div>

            <Link
              href="/admin/shipping-packages"
              className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#6D2E00] px-5 font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#8B4513] focus:outline-none focus:ring-4 focus:ring-[#6D2E00]/20"
            >
              Manage Packages

              <ChevronRight
                size={18}
                aria-hidden="true"
              />
            </Link>
          </div>
        </Card>

        <div className="mt-10">
          <RevenueChart
            data={
              data.revenueChart
            }
            title="Revenue Overview"
            description="Completed and successfully paid order revenue from the last six months."
          />
        </div>

        <div className="mt-10">
          <LowStockProducts
            products={
              data.lowStockProducts ??
              []
            }
          />
        </div>

        <Card
          padding="lg"
          className="mt-10 bg-white/95 shadow-xl backdrop-blur-sm"
        >
          <div className="mb-7">
            <h2 className="text-2xl font-bold text-[#6D2E00]">
              Recent Orders
            </h2>

            <p className="mt-2 text-gray-500">
              The latest customer orders
              received by your store.
            </p>
          </div>

          <RecentOrders
            orders={
              data.recentOrders
            }
          />
        </Card>
      </Container>
    </section>
  );
}