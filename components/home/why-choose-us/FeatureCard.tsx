import type { ElementType } from "react";

import Card from "@/components/ui/Card";

interface FeatureCardProps {
  icon: ElementType;
  title: string;
  description: string;
}

export default function FeatureCard({
  icon: Icon,
  title,
  description,
}: FeatureCardProps) {
  return (
    <Card
      padding="lg"
      hover
      className="group relative h-full overflow-hidden bg-white/85 backdrop-blur-sm"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full bg-[#FFE7B8]/40 opacity-0 blur-3xl transition-opacity duration-300 group-hover:opacity-100"
      />

      <div className="relative">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFF4DD] transition-all duration-300 group-hover:scale-110 group-hover:bg-[#C89B3C]">
          <Icon
            size={30}
            className="text-[#6D2E00] transition-colors duration-300 group-hover:text-white"
            aria-hidden="true"
          />
        </div>

        <h3 className="mt-6 text-2xl font-bold text-[#6D2E00] transition-colors duration-300 group-hover:text-[#C89B3C]">
          {title}
        </h3>

        <p className="mt-4 leading-8 text-gray-600">
          {description}
        </p>

        <div
          aria-hidden="true"
          className="mt-6 h-1 w-14 rounded-full bg-[#F3DFC2] transition-all duration-300 group-hover:w-24 group-hover:bg-[#C89B3C]"
        />
      </div>
    </Card>
  );
}