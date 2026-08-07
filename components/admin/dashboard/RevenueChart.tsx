import {
  BarChart3,
  IndianRupee,
} from "lucide-react";

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

function normalizeRevenue(
  value: unknown,
) {
  const number = Number(value);

  if (
    !Number.isFinite(number) ||
    number < 0
  ) {
    return 0;
  }

  return number;
}

function formatCurrency(
  value: number,
) {
  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    },
  ).format(value);
}

export default function RevenueChart({
  data,
  title = "Revenue Overview",
  description = "Revenue generated during the selected period.",
}: RevenueChartProps) {
  const normalizedData =
    data.map((item) => ({
      label: item.label,
      revenue:
        normalizeRevenue(
          item.revenue,
        ),
    }));

  const highestRevenue =
    Math.max(
      ...normalizedData.map(
        (item) =>
          item.revenue,
      ),
      1,
    );

  const totalRevenue =
    normalizedData.reduce(
      (total, item) =>
        total +
        item.revenue,
      0,
    );

  const hasRevenue =
    normalizedData.some(
      (item) =>
        item.revenue > 0,
    );

  return (
    <Card
      padding="lg"
      className="bg-white/95 shadow-xl backdrop-blur-sm"
    >
      {/* Header */}

      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FFF4DE] text-[#C89B3C]">
            <BarChart3
              size={22}
              aria-hidden="true"
            />
          </div>

          <div>
            <h2 className="text-xl font-bold text-[#6D2E00] sm:text-2xl">
              {title}
            </h2>

            <p className="mt-1 text-sm leading-6 text-gray-500">
              {description}
            </p>
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
              {totalRevenue.toLocaleString(
                "en-IN",
                {
                  minimumFractionDigits:
                    0,
                  maximumFractionDigits:
                    2,
                },
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Empty response */}

      {normalizedData.length ===
      0 ? (
        <div className="mt-8 rounded-3xl border border-dashed border-[#F3DFC2] bg-[#FFFDF8] px-6 py-14 text-center">
          <BarChart3
            size={36}
            className="mx-auto text-[#C89B3C]"
            aria-hidden="true"
          />

          <h3 className="mt-4 text-lg font-bold text-[#6D2E00]">
            No revenue data
            available
          </h3>

          <p className="mt-2 text-sm text-gray-500">
            Revenue information
            will appear here when
            orders are recorded.
          </p>
        </div>
      ) : (
        <div className="mt-10">
          {/* Chart */}

          <div className="relative">
            {/* Guide lines */}

            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-64"
            >
              <div className="absolute inset-x-0 top-0 border-t border-dashed border-[#F3DFC2]" />

              <div className="absolute inset-x-0 top-1/4 border-t border-dashed border-[#F3DFC2]/80" />

              <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-[#F3DFC2]/80" />

              <div className="absolute inset-x-0 top-3/4 border-t border-dashed border-[#F3DFC2]/80" />
            </div>

            <div className="flex h-64 items-end gap-3 overflow-x-auto border-b border-[#E7C98C] sm:gap-5">
              {normalizedData.map(
                (item) => {
                  const percentage =
                    item.revenue > 0
                      ? Math.max(
                          (
                            item.revenue /
                            highestRevenue
                          ) * 100,
                          6,
                        )
                      : 0;

                  return (
                    <div
                      key={
                        item.label
                      }
                      className="group relative flex h-full min-w-14 flex-1 flex-col justify-end sm:min-w-16"
                    >
                      {/* Revenue tooltip/value */}

                      <div className="mb-2 min-h-5 text-center text-xs font-semibold text-[#6D2E00] transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                        {item.revenue >
                        0
                          ? formatCurrency(
                              item.revenue,
                            )
                          : "₹0"}
                      </div>

                      {/* Fixed-height bar area */}

                      <div className="relative flex h-[220px] w-full items-end justify-center">
                        {item.revenue >
                        0 ? (
                          <div
                            className="relative w-full max-w-16 rounded-t-2xl bg-gradient-to-t from-[#6D2E00] via-[#9B5919] to-[#C89B3C] shadow-sm transition-all duration-500 group-hover:-translate-y-1 group-hover:shadow-lg"
                            style={{
                              height: `${percentage}%`,
                            }}
                            title={`${item.label}: ${formatCurrency(
                              item.revenue,
                            )}`}
                          >
                            <div
                              aria-hidden="true"
                              className="absolute inset-x-2 top-2 h-1 rounded-full bg-white/30"
                            />
                          </div>
                        ) : (
                          <div
                            title={`${item.label}: ₹0`}
                            className="h-1.5 w-full max-w-16 rounded-full bg-[#F3DFC2]"
                          />
                        )}
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          </div>

          {/* Month labels */}

          <div className="mt-3 flex gap-3 overflow-x-auto sm:gap-5">
            {normalizedData.map(
              (item) => (
                <div
                  key={
                    item.label
                  }
                  className="min-w-14 flex-1 text-center text-xs font-medium text-gray-500 sm:min-w-16"
                >
                  {item.label}
                </div>
              ),
            )}
          </div>

          {!hasRevenue && (
            <div className="mt-6 rounded-2xl border border-[#F3DFC2] bg-[#FFFDF8] px-5 py-4 text-center">
              <p className="text-sm font-medium text-gray-500">
                There was no
                qualifying revenue
                during these six
                months.
              </p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}