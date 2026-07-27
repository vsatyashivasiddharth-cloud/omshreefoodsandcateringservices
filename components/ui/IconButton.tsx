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
  | "lg";

interface IconButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  rounded?: "full" | "xl";
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-[#6D2E00] text-white hover:bg-[#4E1F00] shadow-lg",

  secondary:
    "bg-[#FFF4DE] text-[#6D2E00] hover:bg-[#C89B3C] hover:text-white border border-[#F3DFC2]",

  outline:
    "border border-[#F3DFC2] bg-white text-[#6D2E00] hover:border-[#C89B3C] hover:bg-[#FFF4DE]",

  ghost:
    "bg-transparent text-[#6D2E00] hover:bg-[#FFF4DE]",

  danger:
    "bg-red-600 text-white hover:bg-red-700 shadow-lg",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-10 w-10",

  md: "h-12 w-12",

  lg: "h-14 w-14",
};

export default function IconButton({
  icon,
  variant = "secondary",
  size = "md",
  loading = false,
  rounded = "xl",
  disabled,
  className = "",
  ...props
}: IconButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex
        items-center
        justify-center
        transition-all
        duration-300
        hover:-translate-y-1
        focus:outline-none
        focus:ring-4
        focus:ring-[#C89B3C]/20
        disabled:pointer-events-none
        disabled:opacity-60

        ${rounded === "full"
          ? "rounded-full"
          : "rounded-2xl"}

        ${variantClasses[variant]}
        ${sizeClasses[size]}

        ${className}
      `}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        icon
      )}
    </button>
  );
}