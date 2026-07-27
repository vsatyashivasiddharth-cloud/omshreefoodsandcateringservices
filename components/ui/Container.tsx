import { HTMLAttributes, ReactNode } from "react";

type Size =
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "full";

interface ContainerProps
  extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  size?: Size;
}

const sizeClasses: Record<Size, string> = {
  sm: "max-w-3xl",

  md: "max-w-5xl",

  lg: "max-w-6xl",

  xl: "max-w-7xl",

  full: "max-w-full",
};

export default function Container({
  children,
  size = "xl",
  className = "",
  ...props
}: ContainerProps) {
  return (
    <div
      className={`
        mx-auto
        w-full
        px-4
        sm:px-6
        lg:px-8

        ${sizeClasses[size]}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}