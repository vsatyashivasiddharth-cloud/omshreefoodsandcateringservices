import { HTMLAttributes, ReactNode } from "react";

type Variant =
  | "primary"
  | "secondary"
  | "success"
  | "danger"
  | "warning"
  | "neutral";

type Size =
  | "sm"
  | "md"
  | "lg";

interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  rounded?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-[#6D2E00] text-white",

  secondary:
    "bg-[#C89B3C] text-white",

  success:
    "bg-green-100 text-green-700",

  danger:
    "bg-red-100 text-red-700",

  warning:
    "bg-amber-100 text-amber-700",

  neutral:
    "bg-[#FFF4DE] text-[#6D2E00]",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-2.5 py-1 text-xs",

  md: "px-3.5 py-1.5 text-sm",

  lg: "px-5 py-2 text-base",
};

export default function Badge({
  children,
  variant = "neutral",
  size = "md",
  rounded = true,
  className = "",
  ...props
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex
        items-center
        justify-center
        gap-1
        font-semibold
        whitespace-nowrap
        transition-colors
        duration-300

        ${rounded ? "rounded-full" : "rounded-xl"}

        ${variantClasses[variant]}
        ${sizeClasses[size]}

        ${className}
      `}
      {...props}
    >
      {children}
    </span>
  );
}