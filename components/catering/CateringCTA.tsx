import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  PhoneCall,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { contact } from "@/lib/constants/contact";

import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Container from "@/components/ui/Container";

const trustItems = [
  {
    title: "On-Time Delivery",
    description:
      "Fresh food delivered exactly when you need it.",
    icon: Clock3,
  },
  {
    title: "Quality Guaranteed",
    description:
      "Fresh ingredients, hygienic preparation and authentic homemade taste.",
    icon: ShieldCheck,
  },
];

export default function CateringCTA() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#6D2E00] via-[#8B4513] to-[#C89B3C] py-20 text-white sm:py-24">
      {/* Decorative background */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-black/10"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-0 h-80 w-80 rounded-full bg-white/10 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-[#FFE3A8]/20 blur-3xl"
      />

      <Container className="relative">
        <Card
          variant="glass"
          padding="lg"
          className="border-white/15 bg-white/10 text-white shadow-2xl backdrop-blur-xl"
        >
          <div className="mx-auto max-w-5xl text-center">
            {/* Badge */}

            <Badge
              variant="neutral"
              className="border border-white/20 bg-white/10 text-white backdrop-blur"
            >
              <Sparkles
                size={16}
                aria-hidden="true"
              />

              Book Your Event Today
            </Badge>

            {/* Icon */}

            <div className="mx-auto mt-8 flex h-24 w-24 items-center justify-center rounded-full border border-white/20 bg-white/10 shadow-xl backdrop-blur">
              <CalendarDays
                size={42}
                aria-hidden="true"
              />
            </div>

            {/* Heading */}

            <h2 className="mt-8 text-4xl font-bold leading-tight sm:text-5xl">
              Ready to Make Your Event Memorable?
            </h2>

            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-white/90 sm:leading-9">
              Whether you are planning a wedding, birthday celebration,
              corporate event, festival or family gathering, we will help
              you create an unforgettable dining experience with delicious
              food and exceptional service.
            </p>

            {/* Trust cards */}

            <div className="mt-12 grid gap-5 md:grid-cols-2 md:gap-6">
              {trustItems.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="rounded-3xl border border-white/15 bg-white/10 p-6 text-left backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:bg-white/15"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                        <Icon
                          size={30}
                          className="text-[#FFE4A3]"
                          aria-hidden="true"
                        />
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold">
                          {item.title}
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-white/80">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Actions */}

            <div className="mt-12 flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/contact"
                className="inline-flex h-14 items-center justify-center gap-3 rounded-full bg-white px-8 text-lg font-semibold text-[#6D2E00] shadow-xl transition-all duration-300 hover:-translate-y-1 hover:bg-[#FFF4DE] hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-white/30 active:scale-95"
              >
                <CalendarDays
                  size={20}
                  aria-hidden="true"
                />

                Book Catering
              </Link>

              <Link
                href={`tel:${contact.phone}`}
                className="inline-flex h-14 items-center justify-center gap-3 rounded-full border border-white/25 bg-white/10 px-8 text-lg font-semibold text-white backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:text-[#6D2E00] focus:outline-none focus:ring-4 focus:ring-white/30 active:scale-95"
              >
                <PhoneCall
                  size={20}
                  aria-hidden="true"
                />

                Call Now

                <ArrowRight
                  size={18}
                  aria-hidden="true"
                />
              </Link>
            </div>

            {/* Event types */}

            <div className="mt-10 border-t border-white/15 pt-8">
              <p className="text-sm leading-7 text-white/80 sm:text-base">
                Weddings
                <span className="mx-2 text-white/40">•</span>
                Birthdays
                <span className="mx-2 text-white/40">•</span>
                Corporate Events
                <span className="mx-2 text-white/40">•</span>
                Festivals
                <span className="mx-2 text-white/40">•</span>
                Family Functions
              </p>
            </div>
          </div>
        </Card>
      </Container>
    </section>
  );
}