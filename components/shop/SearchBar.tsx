"use client";

import { Search, X } from "lucide-react";

import IconButton from "@/components/ui/IconButton";
import Input from "@/components/ui/Input";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchBar({
  value,
  onChange,
}: SearchBarProps) {
  const hasValue = value.trim().length > 0;

  return (
    <div className="relative w-full lg:max-w-xl">
      <Input
        type="search"
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
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
        className="pr-14"
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
            onClick={() => onChange("")}
            className="shadow-none hover:translate-y-0"
          />
        </div>
      )}
    </div>
  );
}