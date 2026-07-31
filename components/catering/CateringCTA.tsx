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
    <section className="relative overflow-hidden bg-gradient-to-br from-[#6D2E00] via-[#8B4513] to-[#C89B3C] py-20 sm:py-24">
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
        className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-[#FFE3A8]/20 blur-3xl"
      />

      <Container className="relative">
        <div className="mx-auto max-w-6xl rounded-[36px] border border-white/20 bg-[#FFF9EF] px-5 py-12 text-[#6D2E00] shadow-2xl sm:px-10 sm:py-16 lg:px-16">
          <div className="mx-auto max-w-5xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E8C784] bg-[#FFF1D5] px-5 py-2 text-sm font-semibold text-[#8B4513]">
              <Sparkles
                size={16}
                aria-hidden="true"
              />
              Book Your Event Today
            </div>

            <div className="mx-auto mt-8 flex h-24 w-24 items-center justify-center rounded-full bg-[#6D2E00] text-white shadow-xl">
              <CalendarDays
                size={42}
                aria-hidden="true"
              />
            </div>

            <h2 className="mt-8 text-4xl font-bold leading-tight sm:text-5xl">
              Ready to Make Your Event Memorable?
            </h2>

            <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-gray-700 sm:text-lg sm:leading-9">
              Whether you are planning a wedding,
              birthday celebration, corporate
              event, festival or family gathering,
              we will help you create an
              unforgettable dining experience with
              delicious food and exceptional
              service.
            </p>

            <div className="mt-12 grid gap-5 md:grid-cols-2 md:gap-6">
              {trustItems.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="rounded-3xl border border-[#EFD8AE] bg-white p-6 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#FFF1D5]">
                        <Icon
                          size={30}
                          className="text-[#C89B3C]"
                          aria-hidden="true"
                        />
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-[#6D2E00]">
                          {item.title}
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-gray-600">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-12 flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/contact"
                className="inline-flex h-14 items-center justify-center gap-3 rounded-full bg-[#6D2E00] px-8 text-lg font-semibold text-white shadow-xl transition-all duration-300 hover:-translate-y-1 hover:bg-[#8B4513] hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-[#C89B3C]/30 active:scale-95"
              >
                <CalendarDays
                  size={20}
                  aria-hidden="true"
                />
                Book Catering
              </Link>

              <Link
                href={`tel:${contact.phone}`}
                className="inline-flex h-14 items-center justify-center gap-3 rounded-full border border-[#D7B36A] bg-white px-8 text-lg font-semibold text-[#6D2E00] transition-all duration-300 hover:-translate-y-1 hover:bg-[#FFF1D5] focus:outline-none focus:ring-4 focus:ring-[#C89B3C]/30 active:scale-95"
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

            <div className="mt-10 border-t border-[#EFD8AE] pt-8">
              <p className="text-sm leading-7 text-gray-600 sm:text-base">
                Weddings
                <span className="mx-2 text-[#C89B3C]">
                  •
                </span>
                Birthdays
                <span className="mx-2 text-[#C89B3C]">
                  •
                </span>
                Corporate Events
                <span className="mx-2 text-[#C89B3C]">
                  •
                </span>
                Festivals
                <span className="mx-2 text-[#C89B3C]">
                  •
                </span>
                Family Functions
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}