import {
  Quote,
  Star,
} from "lucide-react";

import Card from "@/components/ui/Card";

interface TestimonialCardProps {
  name: string;
  location: string;
  review: string;
  rating: number;
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) =>
      part.charAt(0).toUpperCase(),
    )
    .join("");
}

export default function TestimonialCard({
  name,
  location,
  review,
  rating,
}: TestimonialCardProps) {
  const safeRating = Math.max(
    0,
    Math.min(
      5,
      Number.isFinite(rating)
        ? rating
        : 0,
    ),
  );

  const initials =
    getInitials(name) || "OS";

  return (
    <Card
      padding="lg"
      hover
      className="relative h-full overflow-hidden bg-white"
    >
      <Quote
        size={72}
        aria-hidden="true"
        className="pointer-events-none absolute -right-3 -top-3 text-[#FFF0D4]"
      />

      <div className="relative z-10 flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#FFF4DE] font-bold text-[#6D2E00]">
          {initials}
        </div>

        <div className="min-w-0">
          <h3 className="truncate font-bold text-[#6D2E00]">
            {name}
          </h3>

          <p className="mt-1 truncate text-sm text-gray-500">
            {location}
          </p>
        </div>
      </div>

      <div
        role="img"
        aria-label={`${safeRating} out of 5 stars`}
        className="relative z-10 mt-5 flex gap-1"
      >
        {Array.from({
          length: 5,
        }).map((_, index) => (
          <Star
            key={index}
            size={18}
            fill="currentColor"
            className={
              index < Math.round(safeRating)
                ? "text-[#8A5A00]"
                : "text-gray-300"
            }
            aria-hidden="true"
          />
        ))}
      </div>

      <blockquote className="relative z-10 mt-6">
        <p className="italic leading-8 text-gray-600">
          “{review}”
        </p>
      </blockquote>
    </Card>
  );
}