import {
  ChefHat,
  HeartHandshake,
  Leaf,
  PartyPopper,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";

import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";

const features = [
  {
    icon: ChefHat,
    title: "Authentic Homemade Recipes",
    description:
      "Prepared using traditional family recipes that preserve the rich taste and comfort of homemade food.",
  },
  {
    icon: Leaf,
    title: "Fresh Premium Ingredients",
    description:
      "We carefully select quality ingredients to ensure freshness, nutrition and exceptional flavour.",
  },
  {
    icon: ShieldCheck,
    title: "Hygienic Preparation",
    description:
      "Every product is prepared in a clean and safe kitchen while following dependable quality standards.",
  },
  {
    icon: Truck,
    title: "Reliable Delivery",
    description:
      "From individual orders to large catering events, we focus on timely and dependable delivery.",
  },
  {
    icon: HeartHandshake,
    title: "Customer First",
    description:
      "We build lasting relationships by delivering quality food, thoughtful service and consistent care.",
  },
  {
    icon: PartyPopper,
    title: "Expert Catering",
    description:
      "From weddings and birthdays to corporate events and festivals, we help make every celebration memorable.",
  },
];

const stats = [
  {
    value: "100%",
    label: "Fresh Preparation",
  },
  {
    value: "Premium",
    label: "Ingredients",
  },
  {
    value: "Trusted",
    label: "Service",
  },
  {
    value: "Customer",
    label: "First",
  },
];

export default function WhyChooseUs() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-[#FFFDF8] to-[#FFF8EE] py-20 sm:py-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 top-16 h-72 w-72 rounded-full bg-[#FFF4DE]/70 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[#FFE8BF]/60 blur-3xl"
      />

      <Container className="relative">
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

              Why Choose Us
            </Badge>
          }
          title="Experience the Difference"
          description="We combine authentic recipes, premium ingredients and dedicated service to create food that brings people together."
          align="center"
          className="mx-auto max-w-3xl"
        />

        <div className="mt-14 grid gap-6 sm:mt-16 md:grid-cols-2 xl:grid-cols-3 lg:gap-8">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <Card
                key={feature.title}
                padding="lg"
                hover
                className="group h-full bg-white/90 backdrop-blur-sm"
              >
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[#FFF4DE] to-[#FFE8BF] transition-transform duration-300 group-hover:scale-110">
                  <Icon
                    size={34}
                    className="text-[#C89B3C]"
                    aria-hidden="true"
                  />
                </div>

                <h3 className="mt-8 text-2xl font-bold text-[#6D2E00]">
                  {feature.title}
                </h3>

                <p className="mt-4 leading-8 text-gray-600">
                  {feature.description}
                </p>

                <div
                  aria-hidden="true"
                  className="mt-6 h-px bg-gradient-to-r from-[#C89B3C] via-[#F3DFC2] to-transparent"
                />
              </Card>
            );
          })}
        </div>

        <Card
          padding="none"
          className="mt-16 overflow-hidden border-[#8B5A1E] bg-gradient-to-r from-[#6D2E00] via-[#8B4513] to-[#C89B3C] text-white shadow-2xl sm:mt-20"
        >
          <div className="grid gap-5 p-6 sm:grid-cols-2 sm:p-8 md:grid-cols-4 lg:gap-8 lg:p-10">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-3xl border border-white/15 bg-white/10 p-6 text-center backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:bg-white/15 sm:p-8"
              >
                <h3 className="text-3xl font-bold sm:text-4xl">
                  {stat.value}
                </h3>

                <p className="mt-3 text-sm leading-6 text-white/80 sm:text-base">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </Container>
    </section>
  );
}