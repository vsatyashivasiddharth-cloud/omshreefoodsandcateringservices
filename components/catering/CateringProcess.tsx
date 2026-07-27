import {
  ChefHat,
  ClipboardList,
  MessageSquareMore,
  PartyPopper,
  Sparkles,
} from "lucide-react";

import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";

const steps = [
  {
    icon: MessageSquareMore,
    title: "Send an Inquiry",
    description:
      "Contact us through our website, WhatsApp or phone and tell us about your event, guest count, date and preferences.",
  },
  {
    icon: ClipboardList,
    title: "Consultation & Menu Planning",
    description:
      "We discuss your requirements and recommend a customized menu that suits your event and budget.",
  },
  {
    icon: ChefHat,
    title: "Fresh Preparation",
    description:
      "Our experienced team prepares every dish using fresh ingredients while maintaining strict hygiene standards.",
  },
  {
    icon: PartyPopper,
    title: "Event Service",
    description:
      "We deliver and serve your food on time so you can focus on enjoying the celebration with your guests.",
  },
];

export default function CateringProcess() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-[#FFFDF9] to-[#FFF8EE] py-20 sm:py-24">
      {/* Decorative background */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 top-16 h-72 w-72 rounded-full bg-[#FFF4DE]/70 blur-3xl"
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

              Simple Booking Process
            </Badge>
          }
          title="How Our Catering Works"
          description="From your first inquiry to serving delicious food at your event, we make the complete catering journey simple, transparent and stress-free."
          align="center"
          className="mx-auto max-w-3xl"
        />

        {/* Process timeline */}

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

                  <div className="absolute -top-6 left-1/2 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full bg-[#6D2E00] text-lg font-bold text-white shadow-xl ring-4 ring-[#FFFDF8]">
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
                    className="mx-auto my-6 h-px w-20 bg-gradient-to-r from-transparent via-[#C89B3C] to-transparent"
                  />

                  <p className="leading-8 text-gray-600">
                    {step.description}
                  </p>
                </Card>
              </div>
            );
          })}
        </div>

        {/* Bottom notice */}

        <Card
          variant="filled"
          padding="lg"
          className="mt-16 bg-gradient-to-r from-[#FFFDF8] to-[#FFF4DE] text-center shadow-lg sm:mt-20"
        >
          <h3 className="text-2xl font-bold text-[#6D2E00]">
            Every Event Is Unique
          </h3>

          <p className="mx-auto mt-4 max-w-3xl text-base leading-8 text-gray-600 sm:text-lg">
            Whether you are planning a small family gathering or a large
            wedding, we tailor every menu and service package to suit your
            event, preferences and budget.
          </p>
        </Card>
      </Container>
    </section>
  );
}