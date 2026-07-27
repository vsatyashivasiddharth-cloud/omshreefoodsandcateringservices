"use client";

import { Filter } from "lucide-react";

import Card from "@/components/ui/Card";

interface ProductFiltersProps {
  categories: string[];
  selected: string;
  onChange: (category: string) => void;
}

export default function ProductFilters({
  categories,
  selected,
  onChange,
}: ProductFiltersProps) {
  return (
    <Card
      padding="lg"
      className="bg-white/90 backdrop-blur-sm"
    >
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FFF3DA] text-[#C89B3C]">
          <Filter
            size={20}
            aria-hidden="true"
          />
        </div>

        <div>
          <h2 className="text-xl font-bold text-[#6D2E00]">
            Browse Categories
          </h2>

          <p className="text-sm text-gray-500">
            Filter products by category.
          </p>
        </div>
      </div>

      <div
        role="group"
        aria-label="Product categories"
        className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2 sm:flex-wrap sm:overflow-visible sm:pb-0"
      >
        {categories.map((category) => {
          const active = selected === category;

          return (
            <button
              key={category}
              type="button"
              onClick={() => onChange(category)}
              aria-pressed={active}
              className={`shrink-0 rounded-full border px-5 py-3 text-sm font-semibold transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-[#C89B3C]/20 ${
                active
                  ? "scale-[1.03] border-[#6D2E00] bg-[#6D2E00] text-white shadow-lg"
                  : "border-[#E8D9BF] bg-[#FFFDF8] text-[#6D2E00] hover:-translate-y-0.5 hover:border-[#C89B3C] hover:bg-[#FFF4DE] hover:shadow-md"
              }`}
            >
              {category}
            </button>
          );
        })}
      </div>
    </Card>
  );
}