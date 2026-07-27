import type { ReactNode } from "react";

import Card from "@/components/ui/Card";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
}

export default function StatCard({
  title,
  value,
  icon,
}: StatCardProps) {
  return (
    <Card
      padding="lg"
      hover
      className="group h-full bg-white/95 backdrop-blur-sm"
    >
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
            {title}
          </p>

          <h2 className="mt-4 break-words text-3xl font-bold text-[#6D2E00] sm:text-4xl">
            {value}
          </h2>
        </div>

        {icon && (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#FFF4DE] text-[#C89B3C] transition-all duration-300 group-hover:scale-110 group-hover:bg-[#C89B3C] group-hover:text-white">
            {icon}
          </div>
        )}
      </div>

      <div
        aria-hidden="true"
        className="mt-6 h-1 w-14 rounded-full bg-[#F3DFC2] transition-all duration-300 group-hover:w-24 group-hover:bg-[#C89B3C]"
      />
    </Card>
  );
}