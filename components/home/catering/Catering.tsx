import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import Badge from "@/components/ui/Badge";
import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";

import CateringFeature from "./CateringFeature";
import { cateringServices } from "./cateringData";

const galleryImages = [
  {
    src: "/images/catering/wedding.jpg",
    alt: "Wedding catering event",
    className: "row-span-2",
    sizes: "(max-width: 1024px) 100vw, 25vw",
  },
  {
    src: "/images/catering/birthday.jpg",
    alt: "Birthday catering event",
    className: "",
    sizes: "(max-width: 1024px) 50vw, 25vw",
  },
  {
    src: "/images/catering/corporate.jpg",
    alt: "Corporate catering event",
    className: "",
    sizes: "(max-width: 1024px) 50vw, 25vw",
  },
];

export default function Catering() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#FFFDF8] via-[#FFF8F0] to-[#FFF4DE] py-20 sm:py-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-0 h-96 w-96 rounded-full bg-[#FFE7B8]/40 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-[#FFE7B8]/40 blur-3xl"
      />

      <Container className="relative">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-16 xl:gap-20">
          <div>
            <SectionHeader
              badge={
                <Badge
                  variant="neutral"
                  className="gap-2"
                >
                  <Sparkles
                    size={16}
                    aria-hidden="true"
                  />

                  Premium Catering
                </Badge>
              }
              title="Delicious Food for Every Occasion"
              description="Om Shree Foods & Caterers provides dependable catering services for weddings, birthdays, festivals, corporate events, family gatherings and every special celebration."
              align="left"
            />

            <div className="mt-10 grid gap-5 sm:grid-cols-2">
              {cateringServices.map((item) => (
                <CateringFeature
                  key={item.title}
                  {...item}
                />
              ))}
            </div>

            <Link
              href="/catering"
              className="mt-10 inline-flex h-13 items-center justify-center gap-2 rounded-full bg-[#6D2E00] px-8 font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:bg-[#4E1F00] hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-[#6D2E00]/20 active:scale-95"
            >
              Explore Catering

              <ArrowRight
                size={18}
                aria-hidden="true"
              />
            </Link>
          </div>

          <div className="grid h-[560px] grid-cols-2 grid-rows-2 gap-4 sm:h-[640px] sm:gap-5 lg:h-[700px]">
            {galleryImages.map((image) => (
              <div
                key={image.src}
                className={`group relative overflow-hidden rounded-[28px] border border-white/60 bg-[#FFF4DE] shadow-xl ${
                  image.className
                }`}
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes={image.sizes}
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />

                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-70 transition-opacity duration-500 group-hover:opacity-100"
                />
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}