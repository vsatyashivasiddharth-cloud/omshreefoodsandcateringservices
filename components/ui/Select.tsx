"use client";

import {
  forwardRef,
  ReactNode,
  SelectHTMLAttributes,
} from "react";
import { ChevronDown } from "lucide-react";

interface SelectProps
  extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      className = "",
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-2 block text-sm font-semibold text-[#6D2E00]">
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#6D2E00]/70">
              {leftIcon}
            </div>
          )}

          <select
            ref={ref}
            className={`
              h-12
              w-full
              appearance-none
              rounded-2xl
              border
              border-[#F3DFC2]
              bg-white
              px-4
              pr-12
              text-[#6D2E00]
              transition-all
              duration-300
              focus:border-[#C89B3C]
              focus:outline-none
              focus:ring-4
              focus:ring-[#C89B3C]/20
              disabled:cursor-not-allowed
              disabled:bg-gray-100
              disabled:opacity-70

              ${leftIcon ? "pl-12" : ""}

              ${
                error
                  ? "border-red-500 focus:ring-red-200"
                  : ""
              }

              ${className}
            `}
            {...props}
          >
            {children}
          </select>

          <ChevronDown
            size={18}
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#6D2E00]/70"
          />
        </div>

        {helperText && !error && (
          <p className="mt-2 text-sm text-gray-500">
            {helperText}
          </p>
        )}

        {error && (
          <p className="mt-2 text-sm font-medium text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";

export default Select;