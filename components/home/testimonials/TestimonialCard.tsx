import { Quote, Star } from "lucide-react";

import Card from "@/components/ui/Card";

interface TestimonialCardProps {
  name: string;
  location: string;
  rating: number;
  review: string;
}

export default function TestimonialCard({
  name,
  location,
  rating,
  review,
}: TestimonialCardProps) {
  const roundedRating = Math.round(rating);

  return (
    <Card
      padding="lg"
      hover
      className="group relative h-full overflow-hidden bg-white/90 backdrop-blur-sm"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full bg-[#FFE7B8]/40 opacity-0 blur-3xl transition-opacity duration-300 group-hover:opacity-100"
      />

      <Quote
        size={64}
        aria-hidden="true"
        className="absolute right-6 top-6 text-[#C89B3C]/10 transition-all duration-300 group-hover:scale-110 group-hover:text-[#C89B3C]/20"
      />

      <div
        className="relative z-10 flex gap-1"
        aria-label={`${rating} out of 5 stars`}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={18}
            fill={roundedRating >= star ? "currentColor" : "none"}
            className={
              roundedRating >= star
                ? "text-[#C89B3C]"
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

      <div
        aria-hidden="true"
        className="my-8 h-px bg-gradient-to-r from-[#C89B3C]/40 via-[#C89B3C]/15 to-transparent"
      />

      <div className="relative z-10 flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#FFF4DE] to-[#FFE8BD] text-lg font-bold text-[#6D2E00] shadow-sm transition-transform duration-300 group-hover:scale-105">
          {name.charAt(0).toUpperCase()}
        </div>

        <div>
          <h3 className="text-lg font-bold text-[#6D2E00]">
            {name}
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            {location}
          </p>
        </div>
      </div>
    </Card>
  );
}