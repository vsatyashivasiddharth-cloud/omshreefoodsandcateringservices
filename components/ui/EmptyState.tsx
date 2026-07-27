import { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`
        flex
        flex-col
        items-center
        justify-center
        rounded-3xl
        border
        border-[#F3DFC2]
        bg-white
        px-6
        py-12
        text-center
        shadow-sm

        ${className}
      `}
    >
      {icon && (
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#FFF4DE] text-[#6D2E00]">
          {icon}
        </div>
      )}

      <h3 className="text-2xl font-bold text-[#6D2E00]">
        {title}
      </h3>

      {description && (
        <p className="mt-3 max-w-md text-gray-600">
          {description}
        </p>
      )}

      {action && (
        <div className="mt-8">
          {action}
        </div>
      )}
    </div>
  );
}