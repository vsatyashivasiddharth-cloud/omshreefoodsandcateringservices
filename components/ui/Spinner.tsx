import { Loader2 } from "lucide-react";

type SpinnerSize =
  | "sm"
  | "md"
  | "lg"
  | "xl";

interface SpinnerProps {
  size?: SpinnerSize;
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

const sizeClasses: Record<SpinnerSize, string> = {
  sm: "h-5 w-5",
  md: "h-8 w-8",
  lg: "h-12 w-12",
  xl: "h-16 w-16",
};

export default function Spinner({
  size = "md",
  text,
  fullScreen = false,
  className = "",
}: SpinnerProps) {
  const content = (
    <div
      className={`flex flex-col items-center justify-center gap-4 ${className}`}
    >
      <Loader2
        className={`animate-spin text-[#6D2E00] ${sizeClasses[size]}`}
      />

      {text && (
        <p className="text-sm font-medium text-gray-600">
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FFFDF8]">
        {content}
      </div>
    );
  }

  return content;
}