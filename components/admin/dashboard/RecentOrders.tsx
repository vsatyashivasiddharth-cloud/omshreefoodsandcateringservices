import {
  CalendarDays,
  IndianRupee,
  Package,
  User,
} from "lucide-react";

import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";

interface Order {
  id: string;
  customerName: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

interface RecentOrdersProps {
  orders: Order[];
}

type StatusVariant =
  | "warning"
  | "primary"
  | "success"
  | "danger"
  | "neutral";

function normalizeStatus(
  status: string,
) {
  return status
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function formatStatusLabel(
  status: string,
) {
  const normalized =
    status
      .trim()
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ");

  if (!normalized) {
    return "Unknown";
  }

  return normalized
    .split(" ")
    .map((word) =>
      word.length > 0
        ? word.charAt(0).toUpperCase() +
          word.slice(1).toLowerCase()
        : "",
    )
    .join(" ");
}

function getStatusVariant(
  status: string,
): StatusVariant {
  const normalized =
    normalizeStatus(status);

  switch (normalized) {
    case "pending":
      return "warning";

    case "processing":
    case "confirmed":
    case "packed":
    case "shipped":
      return "primary";

    case "paid":
    case "delivered":
    case "completed":
      return "success";

    case "cancelled":
    case "canceled":
    case "refunded":
    case "failed":
      return "danger";

    default:
      return "neutral";
  }
}

function formatCurrency(
  amount: number,
) {
  const safeAmount =
    Number.isFinite(
      Number(amount),
    )
      ? Math.max(
          0,
          Number(amount),
        )
      : 0;

  return safeAmount.toLocaleString(
    "en-IN",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    },
  );
}

function formatOrderDate(
  value: string,
) {
  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Date unavailable";
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  );
}

export default function RecentOrders({
  orders,
}: RecentOrdersProps) {
  if (!orders.length) {
    return (
      <Card
        variant="filled"
        padding="lg"
        className="text-center shadow-none"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF4DE] text-[#C89B3C]">
          <Package
            size={27}
            aria-hidden="true"
          />
        </div>

        <h3 className="mt-4 text-xl font-bold text-[#6D2E00]">
          No Recent Orders
        </h3>

        <p className="mt-2 text-gray-600">
          New customer orders will
          appear here.
        </p>
      </Card>
    );
  }

  return (
    <div>
      {/* Desktop table */}

      <div className="hidden overflow-hidden rounded-3xl border border-[#F3DFC2] md:block">
        <table className="w-full">
          <thead className="bg-[#FFF8EE]">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                Customer
              </th>

              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                Amount
              </th>

              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                Status
              </th>

              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                Date
              </th>
            </tr>
          </thead>

          <tbody>
            {orders.map(
              (order) => {
                const statusLabel =
                  formatStatusLabel(
                    order.status,
                  );

                return (
                  <tr
                    key={order.id}
                    className="border-t border-[#F3DFC2] transition-colors hover:bg-[#FFFDF8]"
                  >
                    {/* Customer */}

                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF4DE] text-[#C89B3C]">
                          <User
                            size={18}
                            aria-hidden="true"
                          />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate font-semibold text-[#6D2E00]">
                            {order.customerName ||
                              "Customer"}
                          </p>

                          <p className="mt-1 text-sm text-gray-500">
                            #
                            {order.id.slice(
                              0,
                              8,
                            )}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Amount */}

                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 font-semibold text-[#6D2E00]">
                        <IndianRupee
                          size={17}
                          className="text-[#C89B3C]"
                          aria-hidden="true"
                        />

                        {formatCurrency(
                          order.totalAmount,
                        )}
                      </div>
                    </td>

                    {/* Status */}

                    <td className="px-6 py-5">
                      <Badge
                        variant={getStatusVariant(
                          order.status,
                        )}
                        rounded
                      >
                        {statusLabel}
                      </Badge>
                    </td>

                    {/* Date */}

                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-gray-600">
                        <CalendarDays
                          size={16}
                          aria-hidden="true"
                        />

                        {formatOrderDate(
                          order.createdAt,
                        )}
                      </div>
                    </td>
                  </tr>
                );
              },
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}

      <div className="space-y-4 md:hidden">
        {orders.map(
          (order) => {
            const statusLabel =
              formatStatusLabel(
                order.status,
              );

            return (
              <Card
                key={order.id}
                padding="md"
                className="bg-white shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF4DE] text-[#C89B3C]">
                      <User
                        size={18}
                        aria-hidden="true"
                      />
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate font-bold text-[#6D2E00]">
                        {order.customerName ||
                          "Customer"}
                      </h3>

                      <p className="mt-1 text-sm text-gray-500">
                        #
                        {order.id.slice(
                          0,
                          8,
                        )}
                      </p>
                    </div>
                  </div>

                  <Badge
                    variant={getStatusVariant(
                      order.status,
                    )}
                    rounded
                  >
                    {statusLabel}
                  </Badge>
                </div>

                <div className="mt-5 space-y-3 text-sm">
                  <div className="flex items-center gap-2 font-semibold text-[#6D2E00]">
                    <IndianRupee
                      size={16}
                      className="text-[#C89B3C]"
                      aria-hidden="true"
                    />

                    {formatCurrency(
                      order.totalAmount,
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-gray-600">
                    <CalendarDays
                      size={16}
                      aria-hidden="true"
                    />

                    {formatOrderDate(
                      order.createdAt,
                    )}
                  </div>
                </div>
              </Card>
            );
          },
        )}
      </div>
    </div>
  );
}