import {
  Building2,
  Cake,
  Heart,
  Home,
  PartyPopper,
  Sparkles,
} from "lucide-react";

import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";

const services = [
  {
    icon: Heart,
    title: "Wedding Catering",
    description:
      "Elegant catering services with customized menus to make your wedding celebrations unforgettable.",
  },
  {
    icon: Cake,
    title: "Birthday Parties",
    description:
      "Delicious food and snacks for birthdays of all sizes, from intimate gatherings to grand celebrations.",
  },
  {
    icon: Home,
    title: "Housewarming",
    description:
      "Celebrate your new beginning with authentic homemade food prepared with love and tradition.",
  },
  {
    icon: Building2,
    title: "Corporate Events",
    description:
      "Professional catering solutions for meetings, conferences, office celebrations and corporate gatherings.",
  },
  {
    icon: PartyPopper,
    title: "Festivals & Functions",
    description:
      "Traditional festive menus designed for cultural celebrations, religious occasions and family functions.",
  },
  {
    icon: Sparkles,
    title: "Custom Catering",
    description:
      "Need something unique? We customize menus based on your event, guest count, preferences and budget.",
  },
];

export default function CateringServices() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#FFFDF8] via-white to-[#FFF8EE] py-20 sm:py-24">
      {/* Decorative background */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-24 h-64 w-64 rounded-full bg-[#FFF4DE]/80 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[#FFE8BF]/60 blur-3xl"
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

              Catering Services
            </Badge>
          }
          title="Catering for Every Occasion"
          description="Whether it is an intimate family gathering or a grand celebration, we provide freshly prepared food, exceptional service and memorable dining experiences tailored to your event."
          align="center"
          className="mx-auto max-w-3xl"
        />

        {/* Service cards */}

        <div className="mt-14 grid gap-6 sm:mt-16 md:grid-cols-2 lg:gap-8 xl:grid-cols-3">
          {services.map((service) => {
            const Icon = service.icon;

            return (
              <Card
                key={service.title}
                padding="lg"
                className="flex h-full flex-col bg-white/90 backdrop-blur-sm"
              >
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[#FFF4DE] to-[#FFE8BF]">
                  <Icon
                    size={34}
                    className="text-[#C89B3C]"
                    aria-hidden="true"
                  />
                </div>

                <h3 className="mt-8 text-2xl font-bold text-[#6D2E00]">
                  {service.title}
                </h3>

                <p className="mt-4 leading-8 text-gray-600">
                  {service.description}
                </p>
              </Card>
            );
          })}
        </div>
      </Container>
    </section>
  );
}