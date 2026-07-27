import { HTMLAttributes, ReactNode } from "react";

type Variant =
  | "default"
  | "glass"
  | "outlined"
  | "filled";

type Padding =
  | "none"
  | "sm"
  | "md"
  | "lg";

interface CardProps
  extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: Variant;
  padding?: Padding;
  hover?: boolean;
}

const variantClasses: Record<Variant, string> = {
  default:
    "border border-[#F3DFC2] bg-white shadow-sm",

  glass:
    "border border-white/40 bg-white/80 backdrop-blur-xl shadow-lg",

  outlined:
    "border-2 border-[#F3DFC2] bg-transparent",

  filled:
    "bg-[#FFFDF8] border border-[#F3DFC2]",
};

const paddingClasses: Record<Padding, string> = {
  none: "",

  sm: "p-4",

  md: "p-6",

  lg: "p-8",
};

export default function Card({
  children,
  variant = "default",
  padding = "md",
  hover = false,
  className = "",
  ...props
}: CardProps) {
  return (
    <div
      className={`
        rounded-3xl
        transition-all
        duration-300

        ${variantClasses[variant]}
        ${paddingClasses[padding]}

        ${
          hover
            ? "hover:-translate-y-1 hover:shadow-xl hover:border-[#C89B3C]/40"
            : ""
        }

        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}