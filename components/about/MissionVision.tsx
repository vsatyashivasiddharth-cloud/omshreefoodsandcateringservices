import {
  Eye,
  Sparkles,
  Target,
} from "lucide-react";

import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";

const purposeCards = [
  {
    title: "Our Mission",
    description:
      "To deliver fresh, hygienic and authentic homemade food that brings families together. We are committed to preserving traditional recipes while maintaining high standards of quality, taste and customer service.",
    icon: Target,
  },
  {
    title: "Our Vision",
    description:
      "To become one of India’s most trusted brands for homemade snacks, traditional delicacies and premium catering services by combining authentic flavours, thoughtful innovation and outstanding customer experiences.",
    icon: Eye,
  },
];

const values = [
  {
    value: "Fresh",
    label: "Ingredients",
  },
  {
    value: "Authentic",
    label: "Traditional Recipes",
  },
  {
    value: "Trusted",
    label: "Customer Experience",
  },
];

export default function MissionVision() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#FFF8EE] via-[#FFFDF9] to-white py-20 sm:py-24">
      {/* Decorative background */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-20 h-72 w-72 rounded-full bg-[#FFF4DE]/70 blur-3xl"
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

              Our Purpose
            </Badge>
          }
          title={
            <>
              Guided by Quality,
              <span className="block">
                Driven by Tradition
              </span>
            </>
          }
          description="Every meal, snack and catering service reflects our commitment to authentic taste, exceptional quality and customer satisfaction."
          align="center"
          className="mx-auto max-w-3xl"
        />

        {/* Mission and vision */}

        <div className="mt-14 grid gap-6 sm:mt-16 lg:grid-cols-2 lg:gap-8">
          {purposeCards.map((item) => {
            const Icon = item.icon;

            return (
              <Card
                key={item.title}
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
                  {item.title}
                </h3>

                <div
                  aria-hidden="true"
                  className="my-6 h-px bg-gradient-to-r from-[#C89B3C] via-[#F3DFC2] to-transparent"
                />

                <p className="leading-8 text-gray-600">
                  {item.description}
                </p>
              </Card>
            );
          })}
        </div>

        {/* Values */}

        <Card
          padding="none"
          className="mt-16 overflow-hidden border-[#8B5A1E] bg-gradient-to-r from-[#6D2E00] via-[#8B4513] to-[#C89B3C] text-white shadow-2xl sm:mt-20"
        >
          <div className="grid gap-5 p-6 text-center sm:p-8 md:grid-cols-3 lg:gap-8 lg:p-10">
            {values.map((item) => (
              <div
                key={item.label}
                className="rounded-3xl border border-white/15 bg-white/10 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:bg-white/15 sm:p-8"
              >
                <h3 className="text-3xl font-bold sm:text-4xl">
                  {item.value}
                </h3>

                <p className="mt-3 text-sm leading-6 text-white/80 sm:text-base">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </Container>
    </section>
  );
}