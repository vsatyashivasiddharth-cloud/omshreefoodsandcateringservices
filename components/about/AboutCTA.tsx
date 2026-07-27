import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  ChefHat,
  HeartHandshake,
  ShoppingBag,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";

import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Container from "@/components/ui/Container";

const trustItems = [
  {
    title: "Homemade",
    description: "Traditional recipes",
    icon: ChefHat,
  },
  {
    title: "Premium",
    description: "Fresh ingredients",
    icon: BadgeCheck,
  },
  {
    title: "Trusted",
    description: "Customer service",
    icon: HeartHandshake,
  },
];

export default function AboutCTA() {
  return (
    <section className="relative overflow-hidden bg-[#FFFDF8] py-20 sm:py-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 top-0 h-80 w-80 rounded-full bg-[#FFF4DE]/70 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-[#FFE8BF]/60 blur-3xl"
      />

      <Container className="relative">
        <Card
          padding="none"
          className="overflow-hidden border-[#8B5A1E] bg-gradient-to-br from-[#6D2E00] via-[#8B4513] to-[#C89B3C] text-white shadow-2xl"
        >
          <div className="relative p-8 sm:p-10 md:p-14 lg:p-16">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/10 blur-3xl"
            />

            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-[#FFE4A3]/15 blur-3xl"
            />

            <div className="relative">
              <Badge
                variant="neutral"
                className="gap-2 border border-white/20 bg-white/10 text-white backdrop-blur-md"
              >
                <Sparkles
                  size={16}
                  aria-hidden="true"
                />

                Let&apos;s Serve You
              </Badge>

              <h2 className="mt-8 max-w-4xl text-4xl font-bold leading-tight sm:text-5xl">
                Ready to Experience
                <span className="block text-[#FFE4A3]">
                  Authentic Homemade Taste?
                </span>
              </h2>

              <p className="mt-7 max-w-3xl text-base leading-8 text-white/90 sm:text-lg sm:leading-9">
                Whether you are looking for delicious homemade snacks or
                complete catering services for your next celebration, we are
                here to make every experience memorable with quality food,
                traditional recipes and exceptional service.
              </p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/shop"
                  className="inline-flex h-14 items-center justify-center gap-3 rounded-full bg-white px-8 text-lg font-semibold text-[#6D2E00] shadow-xl transition-all duration-300 hover:-translate-y-1 hover:bg-[#FFF4DE] hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-white/30 active:scale-95"
                >
                  <ShoppingBag
                    size={20}
                    aria-hidden="true"
                  />

                  Shop Products
                </Link>

                <Link
                  href="/contact"
                  className="inline-flex h-14 items-center justify-center gap-3 rounded-full border border-white/25 bg-white/10 px-8 text-lg font-semibold text-white backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:text-[#6D2E00] focus:outline-none focus:ring-4 focus:ring-white/30 active:scale-95"
                >
                  <UtensilsCrossed
                    size={20}
                    aria-hidden="true"
                  />

                  Book Catering
                </Link>
              </div>

              <div className="mt-14 grid gap-5 md:grid-cols-3">
                {trustItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.title}
                      className="group rounded-3xl border border-white/15 bg-white/10 p-6 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:bg-white/15 hover:shadow-xl"
                    >
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 transition-transform duration-300 group-hover:scale-110">
                        <Icon
                          size={30}
                          className="text-[#FFE4A3]"
                          aria-hidden="true"
                        />
                      </div>

                      <h3 className="mt-5 text-xl font-bold sm:text-2xl">
                        {item.title}
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-white/80 sm:text-base">
                        {item.description}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-12 border-t border-white/15 pt-8">
                <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-center text-sm leading-7 text-white/85 sm:text-base">
                  <span>Freshly Prepared</span>

                  <ArrowRight
                    size={16}
                    className="text-[#FFE4A3]"
                    aria-hidden="true"
                  />

                  <span>Quality Assured</span>

                  <ArrowRight
                    size={16}
                    className="text-[#FFE4A3]"
                    aria-hidden="true"
                  />

                  <span>Delivered with Care</span>
                </p>
              </div>
            </div>
          </div>
        </Card>
      </Container>
    </section>
  );
}