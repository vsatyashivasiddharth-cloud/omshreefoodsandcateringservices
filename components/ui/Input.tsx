"use client";

import {
  forwardRef,
  InputHTMLAttributes,
  ReactNode,
} from "react";

interface InputProps
  extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      className = "",
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
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6D2E00]/70">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            className={`
              h-12
              w-full
              rounded-2xl
              border
              border-[#F3DFC2]
              bg-white
              px-4
              text-[#6D2E00]
              placeholder:text-[#6D2E00]/50
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
              ${rightIcon ? "pr-12" : ""}
              ${error ? "border-red-500 focus:ring-red-200" : ""}

              ${className}
            `}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6D2E00]/70">
              {rightIcon}
            </div>
          )}
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

Input.displayName = "Input";

export default Input;