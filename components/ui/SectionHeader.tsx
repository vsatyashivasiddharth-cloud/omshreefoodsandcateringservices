import { ReactNode } from "react";
import Badge from "./Badge";

interface SectionHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  badge?: ReactNode;
  align?: "left" | "center";
  action?: ReactNode;
  className?: string;
}

export default function SectionHeader({
  title,
  description,
  badge,
  align = "center",
  action,
  className = "",
}: SectionHeaderProps) {
  const isCenter = align === "center";

  return (
    <div
      className={`
        mb-12
        flex
        flex-col
        gap-4
        ${isCenter ? "items-center text-center" : "items-start text-left"}
        ${className}
      `}
    >
      {badge && (
        <Badge variant="secondary">
          {badge}
        </Badge>
      )}

      <div className="flex w-full items-center justify-between gap-4">
        <div className={isCenter ? "w-full" : ""}>
          <h2 className="text-3xl font-bold tracking-tight text-[#6D2E00] md:text-4xl">
            {title}
          </h2>

          {description && (
            <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-gray-600 md:text-lg">
              {description}
            </p>
          )}
        </div>

        {!isCenter && action}
      </div>

      {isCenter && action}
    </div>
  );
}