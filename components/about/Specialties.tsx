import {
  CheckCircle2,
  ShoppingBag,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";

import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";

const homemadeProducts = [
  "Murukulu",
  "Janthikalu",
  "Chekkalu",
  "Traditional Pickles",
  "Homemade Sweets",
  "Spice Powders",
];

const cateringServices = [
  "Wedding Catering",
  "Birthday Parties",
  "Housewarming Functions",
  "Corporate Events",
  "Festival Catering",
  "Outdoor Catering",
];

const specialtyGroups = [
  {
    title: "Homemade Products",
    description:
      "Freshly prepared using traditional recipes and carefully selected ingredients.",
    items: homemadeProducts,
    icon: ShoppingBag,
  },
  {
    title: "Catering Services",
    description:
      "Professional catering solutions tailored for celebrations, gatherings and corporate events.",
    items: cateringServices,
    icon: UtensilsCrossed,
  },
];

export default function Specialties() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#FFF8EE] via-[#FFFDF8] to-white py-20 sm:py-24">
      {/* Decorative background */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#FFF4DE]/70 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[#FFE8BF]/60 blur-3xl"
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

              What We Offer
            </Badge>
          }
          title="Our Specialties"
          description="From authentic homemade delicacies to complete catering solutions, we serve every occasion with freshness, quality and care."
          align="center"
          className="mx-auto max-w-3xl"
        />

        {/* Specialty cards */}

        <div className="mt-14 grid gap-6 sm:mt-16 lg:grid-cols-2 lg:gap-8">
          {specialtyGroups.map((group) => {
            const Icon = group.icon;

            return (
              <Card
                key={group.title}
                padding="lg"
                hover
                className="group h-full bg-white/90 backdrop-blur-sm"
              >
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[#FFF4DE] to-[#FFE8BF] transition-transform duration-300 group-hover:scale-110">
                  <Icon
                    size={36}
                    className="text-[#C89B3C]"
                    aria-hidden="true"
                  />
                </div>

                <h3 className="mt-8 text-3xl font-bold text-[#6D2E00]">
                  {group.title}
                </h3>

                <p className="mt-4 leading-8 text-gray-600">
                  {group.description}
                </p>

                <div
                  aria-hidden="true"
                  className="my-8 h-px bg-gradient-to-r from-[#C89B3C] via-[#F3DFC2] to-transparent"
                />

                <ul className="space-y-4">
                  {group.items.map((item) => (
                    <li key={item}>
                      <Card
                        variant="filled"
                        padding="sm"
                        className="shadow-none transition-all duration-300 hover:border-[#C89B3C]/60 hover:bg-[#FFF4DE]"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
                            <CheckCircle2
                              size={21}
                              className="text-[#C89B3C]"
                              aria-hidden="true"
                            />
                          </div>

                          <span className="font-medium text-gray-700">
                            {item}
                          </span>
                        </div>
                      </Card>
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>

        {/* Bottom message */}

        <Card
          variant="glass"
          padding="lg"
          className="mt-16 bg-white/90 text-center shadow-xl backdrop-blur-sm sm:mt-20"
        >
          <h3 className="text-2xl font-bold text-[#6D2E00] sm:text-3xl">
            Crafted with Tradition. Served with Care.
          </h3>

          <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-gray-600 sm:text-lg">
            Whether you are ordering homemade delicacies for your family or
            planning catering for a grand celebration, every dish reflects our
            commitment to authentic flavours, premium ingredients and
            dependable service.
          </p>
        </Card>
      </Container>
    </section>
  );
}