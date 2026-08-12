"use client";

import type {
  FormEvent,
} from "react";
import {
  Search,
  X,
} from "lucide-react";

import IconButton from "@/components/ui/IconButton";
import Input from "@/components/ui/Input";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

export default function SearchBar({
  value,
  onChange,
  onSubmit,
}: SearchBarProps) {
  const hasValue =
    value.trim().length > 0;

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!hasValue) {
      return;
    }

    onSubmit();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full lg:max-w-2xl"
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Input
            type="search"
            value={value}
            onChange={(event) =>
              onChange(
                event.target.value,
              )
            }
            placeholder="Search snacks, sweets, pickles..."
            aria-label="Search products"
            autoComplete="off"
            spellCheck={false}
            leftIcon={
              <Search
                size={20}
                aria-hidden="true"
              />
            }
            className="pr-14 [&::-webkit-search-cancel-button]:hidden"
          />

          {hasValue && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <IconButton
                type="button"
                icon={
                  <X
                    size={16}
                    aria-hidden="true"
                  />
                }
                variant="ghost"
                size="sm"
                rounded="full"
                aria-label="Clear product search"
                onClick={() =>
                  onChange("")
                }
                className="shadow-none hover:translate-y-0"
              />
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={!hasValue}
          className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#6D2E00] px-6 py-3 font-semibold text-white shadow-md transition-all duration-200 hover:bg-[#4E1F00] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C89B3C] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-[130px]"
        >
          <Search
            size={18}
            aria-hidden="true"
          />
          <span>Search</span>
        </button>
      </div>
    </form>
  );
}