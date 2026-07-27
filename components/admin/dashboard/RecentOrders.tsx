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

function getStatusVariant(
  status: string,
): "warning" | "primary" | "success" | "danger" | "neutral" {
  switch (status.toLowerCase()) {
    case "pending":
      return "warning";

    case "processing":
      return "primary";

    case "delivered":
      return "success";

    case "cancelled":
      return "danger";

    default:
      return "neutral";
  }
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
        <Package
          size={36}
          className="mx-auto text-[#C89B3C]"
          aria-hidden="true"
        />

        <h3 className="mt-4 text-xl font-bold text-[#6D2E00]">
          No recent orders
        </h3>

        <p className="mt-2 text-gray-600">
          New customer orders will appear here.
        </p>
      </Card>
    );
  }

  return (
    <div>
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
            {orders.map((order) => (
              <tr
                key={order.id}
                className="border-t border-[#F3DFC2] transition-colors hover:bg-[#FFFDF8]"
              >
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF4DE] text-[#C89B3C]">
                      <User
                        size={18}
                        aria-hidden="true"
                      />
                    </div>

                    <div>
                      <p className="font-semibold text-[#6D2E00]">
                        {order.customerName}
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        #{order.id.slice(0, 8)}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-5">
                  <div className="flex items-center gap-2 font-semibold text-[#6D2E00]">
                    <IndianRupee
                      size={17}
                      className="text-[#C89B3C]"
                      aria-hidden="true"
                    />

                    {order.totalAmount.toLocaleString("en-IN")}
                  </div>
                </td>

                <td className="px-6 py-5">
                  <Badge
                    variant={getStatusVariant(order.status)}
                    rounded
                  >
                    {order.status}
                  </Badge>
                </td>

                <td className="px-6 py-5">
                  <div className="flex items-center gap-2 text-gray-600">
                    <CalendarDays
                      size={16}
                      aria-hidden="true"
                    />

                    {new Date(order.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-4 md:hidden">
        {orders.map((order) => (
          <Card
            key={order.id}
            padding="md"
            className="bg-white shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-bold text-[#6D2E00]">
                  {order.customerName}
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  #{order.id.slice(0, 8)}
                </p>
              </div>

              <Badge
                variant={getStatusVariant(order.status)}
                rounded
              >
                {order.status}
              </Badge>
            </div>

            <div className="mt-5 space-y-3 text-sm">
              <div className="flex items-center gap-2 font-semibold text-[#6D2E00]">
                <IndianRupee
                  size={16}
                  className="text-[#C89B3C]"
                  aria-hidden="true"
                />

                {order.totalAmount.toLocaleString("en-IN")}
              </div>

              <div className="flex items-center gap-2 text-gray-600">
                <CalendarDays
                  size={16}
                  aria-hidden="true"
                />

                {new Date(order.createdAt).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}