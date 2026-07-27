import Image from "next/image";
import {
  BadgeCheck,
  ChefHat,
  HeartHandshake,
  Sparkles,
} from "lucide-react";

import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";

const highlights = [
  {
    title: "Traditional",
    description: "Time-honoured recipes",
    icon: ChefHat,
  },
  {
    title: "Premium",
    description: "Carefully selected quality",
    icon: BadgeCheck,
  },
  {
    title: "Customer First",
    description: "Prepared with care",
    icon: HeartHandshake,
  },
];

export default function OurStory() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#FFFDF8] via-white to-[#FFF8EE] py-20 sm:py-24">
      {/* Decorative background */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 top-24 h-72 w-72 rounded-full bg-[#FFF4DE]/70 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[#FFE8BF]/60 blur-3xl"
      />

      <Container className="relative">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
          {/* Story image */}

          <div className="relative">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-4 rounded-[40px] bg-gradient-to-br from-[#C89B3C]/20 to-transparent blur-xl"
            />

            <Card
              padding="sm"
              className="relative overflow-hidden shadow-2xl"
            >
              <div className="relative h-[380px] overflow-hidden rounded-[24px] sm:h-[460px] lg:h-[520px]">
                <Image
                  src="/images/about/our-story.jpg"
                  alt="Traditional food preparation at Om Shree Foods and Caterers"
                  fill
                  priority={false}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover transition-transform duration-700 hover:scale-105"
                />

                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent"
                />

                <Badge
                  variant="neutral"
                  className="absolute bottom-5 left-5 gap-2 bg-white/90 shadow-lg backdrop-blur-md"
                >
                  <HeartHandshake
                    size={17}
                    aria-hidden="true"
                  />

                  Made with Care
                </Badge>
              </div>
            </Card>
          </div>

          {/* Story content */}

          <div>
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

                  Our Story
                </Badge>
              }
              title="Bringing Authentic Homemade Taste to Every Celebration"
              description="Om Shree Foods & Caterers was founded with a simple vision: to preserve the rich flavours of traditional homemade recipes while delivering dependable catering services for every occasion."
              align="left"
            />

            <div className="mt-7 space-y-5 text-base leading-8 text-gray-600 sm:text-lg">
              <p>
                Every snack, pickle, sweet and meal is prepared using carefully
                selected ingredients, time-honoured recipes and strict hygiene
                standards. We believe great food creates lasting memories,
                whether it is a family gathering, wedding or festive
                celebration.
              </p>

              <p>
                Our commitment to quality, freshness and customer satisfaction
                has earned the trust of families and businesses alike. Every
                order receives the same care and attention that we would give
                to food prepared for our own family.
              </p>
            </div>

            {/* Highlights */}

            <div className="mt-10 grid gap-4 sm:grid-cols-3 sm:gap-5">
              {highlights.map((highlight) => {
                const Icon = highlight.icon;

                return (
                  <Card
                    key={highlight.title}
                    variant="filled"
                    padding="sm"
                    hover
                    className="group text-center shadow-sm"
                  >
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF4DE] transition-transform duration-300 group-hover:scale-110">
                      <Icon
                        size={24}
                        className="text-[#C89B3C]"
                        aria-hidden="true"
                      />
                    </div>

                    <h3 className="mt-4 font-bold text-[#6D2E00]">
                      {highlight.title}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-gray-600">
                      {highlight.description}
                    </p>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}