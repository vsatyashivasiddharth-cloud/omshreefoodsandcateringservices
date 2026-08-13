import Image from "next/image";
import Link from "next/link";
import {
  Check,
  MessageCircle,
  PhoneCall,
  UtensilsCrossed,
} from "lucide-react";

import type {
  CateringPlate,
} from "@/lib/catering-plates";
import { siteConfig } from "@/lib/site";
import { whatsappUrl } from "@/lib/whatsapp";

interface CateringPlateGridProps {
  plates: CateringPlate[];
}

function getPlateTypeLabel(
  type: CateringPlate["type"],
) {
  return type === "veg"
    ? "Vegetarian"
    : "Non-Vegetarian";
}

export default function CateringPlateGrid({
  plates,
}: CateringPlateGridProps) {
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {plates.map((plate) => {
        const plateTypeLabel =
          getPlateTypeLabel(plate.type);

        return (
          <article
            id={plate.slug}
            key={`${plate.type}-${plate.slug}`}
            className="group scroll-mt-32 overflow-hidden rounded-[32px] border border-[#EFD8AE] bg-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
          >
            <div className="relative aspect-[4/5] overflow-hidden bg-[#FFF4DE]">
              <Image
                src={plate.image}
                alt={`${plate.name} catering menu from ${siteConfig.name}`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 50vw"
                className="object-contain p-2 transition-transform duration-500 group-hover:scale-[1.02] sm:p-4"
              />

              <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/90 px-4 py-2 text-sm font-semibold text-[#6D2E00] shadow-md backdrop-blur-md">
                <UtensilsCrossed
                  size={16}
                  aria-hidden="true"
                />

                {plateTypeLabel}
              </div>
            </div>

            <div className="p-5 sm:p-8">
              <h2 className="text-2xl font-bold leading-tight text-[#6D2E00] sm:text-3xl">
                {plate.name}
              </h2>

              <p className="mt-4 leading-7 text-gray-600">
                {plate.description}
              </p>

              <div className="mt-7 rounded-3xl border border-[#F3DFC2] bg-[#FFFDF8] p-5">
                <h3 className="font-bold text-[#6D2E00]">
                  Package Highlights
                </h3>

                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {plate.highlights.map(
                    (highlight) => (
                      <li
                        key={highlight}
                        className="flex items-start gap-2.5 text-sm leading-6 text-gray-700"
                      >
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FFF1D5]">
                          <Check
                            size={13}
                            className="text-[#A66A00]"
                            aria-hidden="true"
                          />
                        </span>

                        <span>
                          {highlight}
                        </span>
                      </li>
                    ),
                  )}
                </ul>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <Link
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Enquire about ${plate.name} on WhatsApp`}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 py-3 text-center font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#1EBD5A] hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#25D366]/25"
                >
                  <MessageCircle
                    size={19}
                    aria-hidden="true"
                  />

                  WhatsApp Enquiry
                </Link>

                <Link
                  href={`tel:+91${siteConfig.phone}`}
                  aria-label={`Call ${siteConfig.name} about ${plate.name}`}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#D7B36A] bg-white px-5 py-3 text-center font-semibold text-[#6D2E00] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#FFF4DE] focus:outline-none focus:ring-4 focus:ring-[#C89B3C]/25"
                >
                  <PhoneCall
                    size={19}
                    aria-hidden="true"
                  />

                  Call for Pricing
                </Link>
              </div>

              <p className="mt-4 text-center text-xs leading-5 text-gray-500">
                Pricing may vary based on guest
                count, menu customisation and event
                requirements.
              </p>
            </div>
          </article>
        );
      })}
    </div>
  );
}