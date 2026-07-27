import { Sparkles } from "lucide-react";

import Badge from "@/components/ui/Badge";
import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";

import FeatureCard from "./FeatureCard";
import { features } from "./features";

export default function WhyChooseUs() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-[#FFFDF8] to-[#FFF8EE] py-20 sm:py-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-0 h-96 w-96 rounded-full bg-[#FFE8BD]/40 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-[#FFE8BD]/40 blur-3xl"
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
          title="Crafted with Tradition and Care"
          description="Every snack, sweet, pickle and catering dish is prepared with authentic homemade recipes, carefully selected ingredients and a commitment to exceptional taste."
          align="center"
          className="mx-auto max-w-3xl"
        />

        <div className="mt-14 grid gap-6 sm:mt-16 md:grid-cols-2 lg:gap-8 xl:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard
              key={feature.title}
              {...feature}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}