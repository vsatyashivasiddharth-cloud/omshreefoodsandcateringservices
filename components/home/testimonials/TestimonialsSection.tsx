import {
  MessageCircleHeart,
} from "lucide-react";

import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";

import TestimonialCard from "./TestimonialCard";
import {
  testimonials,
} from "./testimonialData";

const stats = [
  {
    value: "500+",
    label: "Happy Customers",
  },
  {
    value: "100+",
    label: "Catering Events",
  },
  {
    value: "4.9★",
    label: "Average Rating",
  },
];

export default function TestimonialsSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#FFF8EE] via-[#FFFDF8] to-white py-20 sm:py-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-0 h-96 w-96 rounded-full bg-[#FFE7B8]/35 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-[#FFE7B8]/35 blur-3xl"
      />

      <Container className="relative">
        <SectionHeader
          badge={
            <Badge
              variant="neutral"
              className="gap-2"
            >
              <MessageCircleHeart
                size={16}
                aria-hidden="true"
              />

              Happy Customers
            </Badge>
          }
          title="Loved by Families Across Hyderabad"
          description="From homemade snacks and traditional pickles to premium catering services, our customers trust us to make every occasion memorable with exceptional food and warm hospitality."
          align="center"
          className="mx-auto max-w-3xl"
        />

        <div className="mt-14 grid gap-6 sm:mt-16 md:grid-cols-2 lg:gap-8 xl:grid-cols-3">
          {testimonials.map(
            (testimonial) => (
              <TestimonialCard
                key={`${testimonial.name}-${testimonial.location}`}
                {...testimonial}
              />
            ),
          )}
        </div>

        <Card
          variant="glass"
          padding="lg"
          className="mt-16 bg-white/90 shadow-xl backdrop-blur-sm sm:mt-20"
        >
          <div className="grid gap-5 text-center md:grid-cols-3 md:gap-8">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-3xl border border-[#F3DFC2] bg-[#FFFDF8] p-6 transition-all duration-300 hover:-translate-y-1 hover:bg-[#FFF4DE] sm:p-8"
              >
                <h3 className="text-4xl font-bold text-[#8A5A00] sm:text-5xl">
                  {stat.value}
                </h3>

                <p className="mt-3 text-gray-600">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </Container>
    </section>
  );
}