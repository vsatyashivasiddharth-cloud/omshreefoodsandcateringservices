"use client";

import {
  ButtonHTMLAttributes,
  ReactNode,
} from "react";
import { Loader2 } from "lucide-react";

type Variant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger";

type Size =
  | "sm"
  | "md"
  | "lg"
  | "icon";

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-[#6D2E00] text-white hover:bg-[#4E1F00] shadow-lg",

  secondary:
    "bg-[#C89B3C] text-white hover:bg-[#B8892E] shadow-lg",

  outline:
    "border-2 border-[#6D2E00] bg-transparent text-[#6D2E00] hover:bg-[#6D2E00] hover:text-white",

  ghost:
    "bg-transparent text-[#6D2E00] hover:bg-[#FFF4DE]",

  danger:
    "bg-red-600 text-white hover:bg-red-700 shadow-lg",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-10 px-4 text-sm",

  md: "h-12 px-6 text-base",

  lg: "h-14 px-8 text-lg",

  icon: "h-12 w-12 p-0",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  fullWidth = false,
  leftIcon,
  rightIcon,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex
        items-center
        justify-center
        gap-2
        rounded-full
        font-semibold
        transition-all
        duration-300
        hover:-translate-y-1
        disabled:pointer-events-none
        disabled:opacity-60
        focus:outline-none
        focus:ring-4
        focus:ring-[#C89B3C]/20

        ${variantClasses[variant]}
        ${sizeClasses[size]}

        ${fullWidth ? "w-full" : ""}

        ${className}
      `}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        leftIcon
      )}

      {children}

      {!loading && rightIcon}
    </button>
  );
}