"use client";

import { ArrowDownUp } from "lucide-react";

import Select from "@/components/ui/Select";

interface SortDropdownProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SortDropdown({
  value,
  onChange,
}: SortDropdownProps) {
  return (
    <div className="w-full lg:w-72">
      <Select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        aria-label="Sort products"
        leftIcon={
          <ArrowDownUp
            size={18}
            aria-hidden="true"
          />
        }
      >
        <option value="default">
          Sort Products
        </option>

        <option value="price-low">
          Price: Low to High
        </option>

        <option value="price-high">
          Price: High to Low
        </option>

        <option value="name">
          Name: A to Z
        </option>
      </Select>
    </div>
  );
}