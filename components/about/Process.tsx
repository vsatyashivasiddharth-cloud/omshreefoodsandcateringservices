import {
  BadgeCheck,
  ChefHat,
  ShoppingCart,
  Sparkles,
  Truck,
} from "lucide-react";

import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";

const steps = [
  {
    icon: ShoppingCart,
    title: "Choose Your Order",
    description:
      "Browse our homemade products or book catering services based on your requirements.",
  },
  {
    icon: ChefHat,
    title: "Fresh Preparation",
    description:
      "Every order is freshly prepared using premium ingredients and traditional recipes.",
  },
  {
    icon: BadgeCheck,
    title: "Quality Assurance",
    description:
      "We carefully inspect every product to ensure freshness, hygiene and consistent quality.",
  },
  {
    icon: Truck,
    title: "Delivery & Celebration",
    description:
      "Your order is packed with care and delivered on time, ready to make every occasion special.",
  },
];

const processSummary = [
  {
    value: "1",
    label: "Order",
  },
  {
    value: "2",
    label: "Prepare",
  },
  {
    value: "3",
    label: "Inspect",
  },
  {
    value: "4",
    label: "Deliver",
  },
];

export default function Process() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-[#FFFDF8] to-[#FFF8EE] py-20 sm:py-24">
      {/* Decorative background */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 top-16 h-72 w-72 rounded-full bg-[#FFF4DE]/70 blur-3xl"
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

              Our Process
            </Badge>
          }
          title="From Kitchen to Your Table"
          description="Every order follows a carefully managed process to ensure freshness, quality and complete customer satisfaction."
          align="center"
          className="mx-auto max-w-3xl"
        />

        {/* Process steps */}

        <div className="relative mt-14 grid gap-10 sm:mt-16 md:grid-cols-2 xl:grid-cols-4">
          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <div
                key={step.title}
                className="relative pt-6"
              >
                {index < steps.length - 1 && (
                  <div
                    aria-hidden="true"
                    className="absolute left-[calc(100%-4px)] top-[92px] hidden h-[3px] w-10 bg-gradient-to-r from-[#C89B3C] to-[#F3DFC2] xl:block"
                  />
                )}

                <Card
                  padding="lg"
                  hover
                  className="group relative h-full bg-white/90 pt-12 text-center backdrop-blur-sm"
                >
                  {/* Step number */}

                  <div className="absolute -top-6 left-1/2 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full bg-gradient-to-r from-[#6D2E00] to-[#C89B3C] text-lg font-bold text-white shadow-xl ring-4 ring-[#FFFDF8]">
                    {index + 1}
                  </div>

                  {/* Icon */}

                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[#FFF4DE] to-[#FFE8BF] transition-transform duration-300 group-hover:scale-110">
                    <Icon
                      size={36}
                      className="text-[#C89B3C]"
                      aria-hidden="true"
                    />
                  </div>

                  <h3 className="mt-8 text-2xl font-bold text-[#6D2E00]">
                    {step.title}
                  </h3>

                  <div
                    aria-hidden="true"
                    className="mx-auto my-6 h-px w-20 bg-gradient-to-r from-[#C89B3C] to-[#F3DFC2]"
                  />

                  <p className="leading-8 text-gray-600">
                    {step.description}
                  </p>
                </Card>
              </div>
            );
          })}
        </div>

        {/* Process summary */}

        <Card
          padding="none"
          className="mt-16 overflow-hidden border-[#8B5A1E] bg-gradient-to-r from-[#6D2E00] via-[#8B4513] to-[#C89B3C] text-white shadow-2xl sm:mt-20"
        >
          <div className="grid gap-5 p-6 text-center sm:grid-cols-2 sm:p-8 md:grid-cols-4 lg:gap-8 lg:p-10">
            {processSummary.map((item) => (
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