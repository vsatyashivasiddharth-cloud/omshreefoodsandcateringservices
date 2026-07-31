import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  ChefHat,
  Clock3,
  PhoneCall,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";

import Badge from "@/components/ui/Badge";
import Container from "@/components/ui/Container";

const highlights = [
  {
    value: "100%",
    label: "Fresh Preparation",
    icon: ChefHat,
  },
  {
    value: "Premium",
    label: "Ingredients",
    icon: BadgeCheck,
  },
  {
    value: "On-Time",
    label: "Service",
    icon: Clock3,
  },
  {
    value: "Custom",
    label: "Menu Planning",
    icon: UtensilsCrossed,
  },
];

export default function CateringHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#6D2E00] via-[#8B4513] to-[#C89B3C] py-20 text-white sm:py-24 lg:py-28">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-black/15"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-0 h-80 w-80 rounded-full bg-white/10 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-[#FFE3A8]/20 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10"
      />

      <Container className="relative">
        <div className="mx-auto max-w-5xl text-center">
          <Badge
            variant="neutral"
            className="gap-2 border border-white/20 bg-white/10 text-white shadow-lg backdrop-blur-md"
          >
            <Sparkles
              size={16}
              aria-hidden="true"
            />
            Premium Catering Services
          </Badge>

          <div className="mx-auto mt-8 flex h-24 w-24 items-center justify-center rounded-full border border-white/20 bg-white/10 shadow-xl backdrop-blur-md">
            <UtensilsCrossed
              size={42}
              aria-hidden="true"
            />
          </div>

          <h1 className="mt-8 text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Delicious Food
            <span className="block text-[#FFE4A3]">
              for Every Celebration
            </span>
          </h1>

          <p className="mx-auto mt-7 max-w-3xl text-base leading-8 text-white/90 sm:text-lg md:text-xl md:leading-9">
            From intimate family gatherings to
            grand weddings, corporate events and
            festive celebrations, Om Shree Foods
            &amp; Caterers delivers authentic
            homemade flavours, premium ingredients
            and professional catering service.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row sm:items-center">
            <Link
              href="/contact"
              className="inline-flex h-14 items-center justify-center gap-3 rounded-full bg-white px-8 text-lg font-semibold text-[#6D2E00] shadow-xl transition-all duration-300 hover:-translate-y-1 hover:bg-[#FFF4DE] hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-white/30 active:scale-95"
            >
              <PhoneCall
                size={20}
                aria-hidden="true"
              />
              Book Catering
            </Link>

            <Link
              href="/catering/plates"
              className="inline-flex h-14 items-center justify-center gap-3 rounded-full border border-white/30 bg-white/10 px-8 text-lg font-semibold text-white backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:text-[#6D2E00] focus:outline-none focus:ring-4 focus:ring-white/30 active:scale-95"
            >
              Explore Catering Plates
              <ArrowRight
                size={20}
                aria-hidden="true"
              />
            </Link>
          </div>

          <div className="mt-16 grid gap-4 sm:grid-cols-2 md:mt-20 lg:grid-cols-4 lg:gap-6">
            {highlights.map((highlight) => {
              const Icon = highlight.icon;

              return (
                <div
                  key={highlight.label}
                  className="group rounded-3xl border border-white/15 bg-white/10 p-6 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:bg-white/15 hover:shadow-xl"
                >
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 transition-transform duration-300 group-hover:scale-110">
                    <Icon
                      size={30}
                      className="text-[#FFE4A3]"
                      aria-hidden="true"
                    />
                  </div>

                  <p className="mt-4 text-2xl font-bold sm:text-3xl">
                    {highlight.value}
                  </p>

                  <p className="mt-2 text-sm leading-6 text-white/80 sm:text-base">
                    {highlight.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}