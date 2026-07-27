import { BarChart3, IndianRupee } from "lucide-react";

import Card from "@/components/ui/Card";

export interface RevenueDataPoint {
  label: string;
  revenue: number;
}

interface RevenueChartProps {
  data: RevenueDataPoint[];
  title?: string;
  description?: string;
}

export default function RevenueChart({
  data,
  title = "Revenue Overview",
  description = "Revenue generated during the selected period.",
}: RevenueChartProps) {
  const highestRevenue = Math.max(
    ...data.map((item) => item.revenue),
    1,
  );

  const totalRevenue = data.reduce(
    (total, item) => total + item.revenue,
    0,
  );

  return (
    <Card
      padding="lg"
      className="bg-white/95 shadow-xl backdrop-blur-sm"
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF4DE] text-[#C89B3C]">
              <BarChart3
                size={22}
                aria-hidden="true"
              />
            </div>

            <div>
              <h2 className="text-xl font-bold text-[#6D2E00] sm:text-2xl">
                {title}
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {description}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#F3DFC2] bg-[#FFFDF8] px-5 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Total Revenue
          </p>

          <div className="mt-1 flex items-center font-bold text-[#6D2E00]">
            <IndianRupee
              size={18}
              aria-hidden="true"
            />

            <span className="text-xl">
              {totalRevenue.toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-dashed border-[#F3DFC2] bg-[#FFFDF8] px-6 py-14 text-center">
          <BarChart3
            size={36}
            className="mx-auto text-[#C89B3C]"
            aria-hidden="true"
          />

          <h3 className="mt-4 text-lg font-bold text-[#6D2E00]">
            No revenue data available
          </h3>

          <p className="mt-2 text-sm text-gray-500">
            Revenue information will appear here when orders are recorded.
          </p>
        </div>
      ) : (
        <div className="mt-10">
          <div className="flex h-72 items-end gap-3 overflow-x-auto border-b border-[#F3DFC2] pb-1 sm:gap-5">
            {data.map((item) => {
              const height = Math.max(
                (item.revenue / highestRevenue) * 100,
                4,
              );

              return (
                <div
                  key={item.label}
                  className="group flex min-w-14 flex-1 flex-col items-center justify-end sm:min-w-16"
                >
                  <div className="mb-2 text-center text-xs font-semibold text-[#6D2E00] opacity-0 transition-opacity group-hover:opacity-100">
                    ₹{item.revenue.toLocaleString("en-IN")}
                  </div>

                  <div
                    className="w-full max-w-16 rounded-t-2xl bg-gradient-to-t from-[#6D2E00] to-[#C89B3C] shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg"
                    style={{
                      height: `${height}%`,
                    }}
                    title={`${item.label}: ₹${item.revenue.toLocaleString(
                      "en-IN",
                    )}`}
                  />
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex gap-3 overflow-x-auto sm:gap-5">
            {data.map((item) => (
              <div
                key={item.label}
                className="min-w-14 flex-1 text-center text-xs font-medium text-gray-500 sm:min-w-16"
              >
                {item.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}