import {
  BadgeCheck,
  ChefHat,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";

const promises = [
  {
    title: "Fresh Every Time",
    description:
      "We prepare every order with freshly sourced ingredients to deliver exceptional taste and dependable quality.",
    icon: ChefHat,
  },
  {
    title: "Quality You Can Trust",
    description:
      "Every product is carefully prepared and checked before it reaches your table.",
    icon: BadgeCheck,
  },
  {
    title: "Customer Happiness",
    description:
      "Your satisfaction matters to us, and we work to exceed expectations with every order.",
    icon: ShieldCheck,
  },
];

export default function CustomerPromise() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#6D2E00] via-[#8B4513] to-[#C89B3C] py-20 text-white sm:py-24">
      {/* Decorative background */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-black/10"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-white/10 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-[#FFE4A3]/20 blur-3xl"
      />

      <Container className="relative">
        {/* Heading */}

        <div className="mx-auto max-w-4xl text-center">
          <Badge
            variant="neutral"
            className="gap-2 border border-white/20 bg-white/10 text-white backdrop-blur-md"
          >
            <Sparkles
              size={16}
              aria-hidden="true"
            />

            Our Commitment
          </Badge>

          <div className="mx-auto mt-8 flex h-24 w-24 items-center justify-center rounded-full border border-white/20 bg-white/10 shadow-xl backdrop-blur-md">
            <HeartHandshake
              size={42}
              aria-hidden="true"
            />
          </div>

          <SectionHeader
            title="Our Promise to Every Customer"
            description="Every snack, meal and catering order is prepared with the same love, care and attention we would give to our own family. Freshness, hygiene, authentic taste and customer satisfaction remain at the heart of everything we do."
            align="center"
            className="mt-8 text-white [&_h2]:text-white [&_p]:text-white/90"
          />
        </div>

        {/* Promise cards */}

        <div className="mt-14 grid gap-6 md:grid-cols-3 lg:gap-8">
          {promises.map((promise) => {
            const Icon = promise.icon;

            return (
              <Card
                key={promise.title}
                padding="lg"
                className="group border-white/15 bg-white/10 text-white shadow-none backdrop-blur-md transition-all duration-300 hover:-translate-y-2 hover:bg-white/15 hover:shadow-2xl"
              >
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/10 transition-transform duration-300 group-hover:scale-110">
                  <Icon
                    size={36}
                    className="text-[#FFE4A3]"
                    aria-hidden="true"
                  />
                </div>

                <h3 className="mt-8 text-2xl font-bold">
                  {promise.title}
                </h3>

                <div
                  aria-hidden="true"
                  className="my-6 h-px bg-gradient-to-r from-[#FFE4A3] to-transparent"
                />

                <p className="leading-8 text-white/80">
                  {promise.description}
                </p>
              </Card>
            );
          })}
        </div>

        {/* Quote */}

        <Card
          padding="lg"
          className="mt-16 border-white/15 bg-white/10 text-center text-white shadow-none backdrop-blur-md sm:mt-20"
        >
          <p className="mx-auto max-w-4xl text-lg font-medium leading-9 text-white/90 sm:text-xl">
            “Great food is more than ingredients. It is the love, care and
            dedication that go into every meal we prepare.”
          </p>
        </Card>
      </Container>
    </section>
  );
}