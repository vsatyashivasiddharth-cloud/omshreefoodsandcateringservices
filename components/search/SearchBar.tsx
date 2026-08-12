"use client";

import {
  Search,
  X,
} from "lucide-react";

import {
  IconButton,
  Input,
} from "@/components/ui";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  loading?: boolean;
}

export default function SearchBar({
  value,
  onChange,
  onSubmit,
  loading = false,
}: SearchBarProps) {
  const hasValue =
    value.trim().length > 0;

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      !hasValue ||
      loading
    ) {
      return;
    }

    onSubmit();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full"
    >
      <div className="relative mx-auto max-w-5xl">
        {/* Search Icon */}

        <div className="pointer-events-none absolute left-6 top-1/2 z-10 -translate-y-1/2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFF4DE] to-[#FFE8BF] shadow-md">
            <Search
              size={22}
              className="text-[#C89B3C]"
              aria-hidden="true"
            />
          </div>
        </div>

        {/* Input */}

        <Input
          type="search"
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value,
            )
          }
          placeholder="Search snacks, sweets, pickles, spices..."
          aria-label="Search products or categories"
          autoComplete="off"
          spellCheck={false}
          className="h-20 rounded-[28px] pl-24 pr-20 text-lg font-medium [&::-webkit-search-cancel-button]:hidden"
        />

        {/* Clear Button */}

        {hasValue && (
          <div className="absolute right-5 top-1/2 -translate-y-1/2">
            <IconButton
              type="button"
              icon={
                <X
                  size={20}
                  aria-hidden="true"
                />
              }
              variant="ghost"
              size="md"
              rounded="xl"
              aria-label="Clear search"
              onClick={() =>
                onChange("")
              }
              className="bg-[#FFF4DE] text-[#6D2E00] shadow-none hover:translate-y-0 hover:bg-[#C89B3C] hover:text-white"
            />
          </div>
        )}
      </div>

      {/* Search action */}

      <button
        type="submit"
        disabled={
          !hasValue ||
          loading
        }
        className="mt-5 inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#6D2E00] px-6 py-4 text-base font-semibold text-white shadow-lg transition-all duration-200 hover:bg-[#4E1F00] hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C89B3C] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Search
          size={20}
          aria-hidden="true"
        />

        <span>
          {loading
            ? "Searching..."
            : "Search Products / Categories"}
        </span>
      </button>

      {/* Helper Text */}

      <div className="mt-4 text-center text-sm text-gray-500">
        Press Enter or use the search
        button to find products by name
        or category.
      </div>
    </form>
  );
}