"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  Boxes,
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
      <section className="min-h-screen bg-gradient-to-br from-[#FFFDF8] via-white to-[#FFF6E9] py-12">
        <Container>
          <div className="flex min-h-[60vh] items-center justify-center">
            <Spinner
              size="lg"
              text="Loading dashboard..."
            />
          </div>
        </Container>
      </section>
    );
  }

  if (
    !data ||
    error
  ) {
    return (
      <section className="min-h-screen bg-gradient-to-br from-[#FFFDF8] via-white to-[#FFF6E9] py-12">
        <Container>
          <Card
            variant="outlined"
            padding="lg"
            className="mx-auto max-w-xl border-red-200 bg-red-50 text-center"
          >
            <h2 className="text-2xl font-bold text-red-700">
              Dashboard
              unavailable
            </h2>

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
  ];

  return (
    <section className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#FFFDF8] via-white to-[#FFF6E9] py-10 sm:py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-0 h-96 w-96 rounded-full bg-[#FFF4DE]/60 blur-3xl"
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
          description="Monitor orders, products, categories, inventory and revenue from one central place."
          align="left"
        />

        <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
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
              The latest customer
              orders received by your
              store.
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