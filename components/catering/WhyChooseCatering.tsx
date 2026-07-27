import {
  BadgeCheck,
  ChefHat,
  Clock3,
  ShieldCheck,
  Sparkles,
  Users,
  UtensilsCrossed,
} from "lucide-react";

import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";

const features = [
  {
    icon: ChefHat,
    title: "Authentic Homemade Taste",
    description:
      "Traditional recipes prepared with the same care, warmth and flavour as home-cooked meals.",
  },
  {
    icon: ShieldCheck,
    title: "Fresh & Hygienic",
    description:
      "Every dish is prepared using fresh ingredients in a clean and hygienic kitchen environment.",
  },
  {
    icon: Clock3,
    title: "On-Time Service",
    description:
      "We understand the importance of timing and ensure food is prepared and served on schedule.",
  },
  {
    icon: Users,
    title: "Experienced Team",
    description:
      "Our dedicated team manages preparation, delivery and service so you can enjoy your event.",
  },
  {
    icon: UtensilsCrossed,
    title: "Customized Menus",
    description:
      "Menus can be tailored to your event, guest count, dietary preferences and budget.",
  },
  {
    icon: BadgeCheck,
    title: "Trusted Quality",
    description:
      "Every order reflects our commitment to dependable service, authentic taste and customer satisfaction.",
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
    value: "Custom",
    label: "Menu Planning",
  },
  {
    value: "On-Time",
    label: "Service",
  },
];

export default function WhyChooseCatering() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#FFF8EE] via-[#FFFDF9] to-white py-20 sm:py-24">
      {/* Decorative background */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-16 h-72 w-72 rounded-full bg-[#FFF4DE]/70 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[#FFE7BD]/60 blur-3xl"
      />

      <Container className="relative">
        {/* Heading */}

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
          title="Catering You Can Trust"
          description="We believe every celebration deserves exceptional food, professional service and unforgettable memories."
          align="center"
          className="mx-auto max-w-3xl"
        />

        {/* Feature cards */}

        <div className="mt-14 grid gap-6 sm:mt-16 md:grid-cols-2 lg:gap-8 xl:grid-cols-3">
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

        {/* Statistics */}

        <div className="mt-16 overflow-hidden rounded-[40px] border border-[#8B5A1E] bg-gradient-to-r from-[#6D2E00] via-[#8B4513] to-[#C89B3C] p-6 shadow-2xl sm:mt-20 sm:p-8 lg:mt-24 lg:p-10">
          <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-4 lg:gap-8">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-3xl border border-white/15 bg-white/10 p-6 text-center text-white backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:bg-white/15 sm:p-8"
              >
                <h3 className="text-3xl font-bold sm:text-4xl">
                  {stat.value}
                </h3>

                <p className="mt-3 text-sm leading-6 text-white/90 sm:text-base">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}