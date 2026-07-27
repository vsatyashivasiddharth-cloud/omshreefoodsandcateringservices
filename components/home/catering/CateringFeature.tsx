import type { ElementType } from "react";

import Card from "@/components/ui/Card";

interface CateringFeatureProps {
  icon: ElementType;
  title: string;
  description: string;
}

export default function CateringFeature({
  icon: Icon,
  title,
  description,
}: CateringFeatureProps) {
  return (
    <Card
      padding="md"
      hover
      className="group relative h-full overflow-hidden bg-white/85 backdrop-blur-sm"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-[#FFE7B8]/40 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
      />

      <div className="relative">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFF2D8] transition-all duration-300 group-hover:scale-110 group-hover:bg-[#C89B3C]/20">
          <Icon
            size={30}
            className="text-[#C89B3C]"
            aria-hidden="true"
          />
        </div>

        <h3 className="mt-5 text-xl font-bold text-[#6D2E00] transition-colors duration-300 group-hover:text-[#C89B3C]">
          {title}
        </h3>

        <p className="mt-3 leading-7 text-gray-600">
          {description}
        </p>
      </div>
    </Card>
  );
}