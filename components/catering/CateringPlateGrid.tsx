import Image from "next/image";
import Link from "next/link";
import {
  Check,
  MessageCircle,
} from "lucide-react";

import type {
  CateringPlate,
} from "@/lib/catering-plates";
import { siteConfig } from "@/lib/site";

interface CateringPlateGridProps {
  plates: CateringPlate[];
}

export default function CateringPlateGrid({
  plates,
}: CateringPlateGridProps) {
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {plates.map((plate) => {
        const whatsappMessage =
          `Hello, I am interested in the ${plate.name}. Please share pricing and details.`;

        const whatsappUrl =
          `https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(
            whatsappMessage,
          )}`;

        return (
          <article
            key={plate.slug}
            className="overflow-hidden rounded-[32px] border border-[#EFD8AE] bg-white shadow-lg"
          >
            <div className="relative aspect-[4/5] bg-[#FFF4DE]">
              <Image
                src={plate.image}
                alt={`${plate.name} catering menu`}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-contain"
              />
            </div>

            <div className="p-6 sm:p-8">
              <h2 className="text-3xl font-bold text-[#6D2E00]">
                {plate.name}
              </h2>

              <p className="mt-4 leading-7 text-gray-600">
                {plate.description}
              </p>

              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {plate.highlights.map(
                  (highlight) => (
                    <li
                      key={highlight}
                      className="flex items-start gap-2 text-sm text-gray-700"
                    >
                      <Check
                        size={17}
                        className="mt-0.5 shrink-0 text-[#C89B3C]"
                      />
                      {highlight}
                    </li>
                  ),
                )}
              </ul>

              <Link
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-[#1EBD5A]"
              >
                <MessageCircle size={19} />
                Enquire About This Plate
              </Link>
            </div>
          </article>
        );
      })}
    </div>
  );
}