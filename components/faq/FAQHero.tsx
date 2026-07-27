import {
  HelpCircle,
  MessageCircleQuestion,
  Search,
  Sparkles,
} from "lucide-react";

import Badge from "@/components/ui/Badge";
import Container from "@/components/ui/Container";

const highlights = [
  {
    title: "Quick Search",
    description: "Find useful answers instantly.",
    icon: Search,
  },
  {
    title: "Expert Support",
    description: "Our team is always ready to help.",
    icon: MessageCircleQuestion,
  },
  {
    title: "Helpful Answers",
    description: "Everything you need in one place.",
    icon: HelpCircle,
  },
];

export default function FAQHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#6D2E00] via-[#8B4513] to-[#C89B3C] py-20 text-white sm:py-24 lg:py-28">
      {/* Decorative background */}

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
        className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-[#FFE4A3]/20 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10"
      />

      <Container className="relative">
        <div className="mx-auto max-w-5xl text-center">
          {/* Badge */}

          <Badge
            variant="neutral"
            className="gap-2 border border-white/20 bg-white/10 text-white shadow-lg backdrop-blur-md"
          >
            <Sparkles
              size={16}
              aria-hidden="true"
            />

            Help Center
          </Badge>

          {/* Main icon */}

          <div className="mx-auto mt-8 flex h-24 w-24 items-center justify-center rounded-full border border-white/20 bg-white/10 shadow-xl backdrop-blur-md">
            <HelpCircle
              size={42}
              aria-hidden="true"
            />
          </div>

          {/* Heading */}

          <h1 className="mt-8 text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Frequently Asked
            <span className="block text-[#FFE4A3]">
              Questions
            </span>
          </h1>

          <p className="mx-auto mt-7 max-w-3xl text-base leading-8 text-white/90 sm:text-lg md:text-xl md:leading-9">
            Find answers to common questions about our homemade products,
            catering services, ordering process, deliveries, payments and
            everything in between.
          </p>

          {/* Highlights */}

          <div className="mt-14 grid gap-5 sm:mt-16 md:grid-cols-3 md:gap-6">
            {highlights.map((highlight) => {
              const Icon = highlight.icon;

              return (
                <div
                  key={highlight.title}
                  className="group rounded-3xl border border-white/15 bg-white/10 p-6 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:bg-white/15 hover:shadow-xl"
                >
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 transition-transform duration-300 group-hover:scale-110">
                    <Icon
                      size={30}
                      className="text-[#FFE4A3]"
                      aria-hidden="true"
                    />
                  </div>

                  <h2 className="mt-5 text-xl font-bold">
                    {highlight.title}
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-white/80 sm:text-base">
                    {highlight.description}
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