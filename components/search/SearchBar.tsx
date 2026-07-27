"use client";

import { Search, X } from "lucide-react";

import { IconButton, Input } from "@/components/ui";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchBar({
  value,
  onChange,
}: SearchBarProps) {
  return (
    <div className="w-full">
      <div className="relative mx-auto max-w-5xl">
        {/* Search Icon */}

        <div className="pointer-events-none absolute left-6 top-1/2 z-10 -translate-y-1/2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFF4DE] to-[#FFE8BF] shadow-md">
            <Search
              size={22}
              className="text-[#C89B3C]"
            />
          </div>
        </div>

        {/* Input */}

        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search snacks, sweets, pickles, spices..."
          aria-label="Search products"
          className="h-20 rounded-[28px] pl-24 pr-20 text-lg font-medium"
        />

        {/* Clear Button */}

        {value && (
          <div className="absolute right-5 top-1/2 -translate-y-1/2">
            <IconButton
              icon={<X size={20} />}
              variant="ghost"
              size="md"
              rounded="xl"
              aria-label="Clear search"
              onClick={() => onChange("")}
              className="bg-[#FFF4DE] text-[#6D2E00] shadow-none hover:translate-y-0 hover:bg-[#C89B3C] hover:text-white"
            />
          </div>
        )}
      </div>

      {/* Helper Text */}

      <div className="mt-4 text-center text-sm text-gray-500">
        Search by product name or category.
      </div>
    </div>
  );
}