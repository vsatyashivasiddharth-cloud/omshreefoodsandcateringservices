import {
  BadgeCheck,
  CalendarDays,
  Clock,
  Sparkles,
} from "lucide-react";

import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";

const schedule = [
  {
    day: "Monday - Friday",
    hours: "9:00 AM - 8:00 PM",
  },
  {
    day: "Saturday",
    hours: "9:00 AM - 8:00 PM",
  },
  {
    day: "Sunday",
    hours: "10:00 AM - 6:00 PM",
  },
];

export default function BusinessHours() {
  return (
    <section className="relative overflow-hidden bg-white py-20 sm:py-24">
      {/* Decorative background */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-[#FFF4DE]/80 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[#FFE8BF]/70 blur-3xl"
      />

      <Container className="relative">
        <Card
          variant="glass"
          padding="lg"
          className="mx-auto max-w-6xl bg-white/90 shadow-2xl backdrop-blur-sm"
        >
          {/* Header */}

          <div className="mx-auto max-w-3xl text-center">
            <SectionHeader
              badge={
                <Badge
                  variant="neutral"
                  className="gap-2 border border-[#F3DFC2]"
                >
                  <Sparkles
                    size={16}
                    aria-hidden="true"
                  />

                  Opening Hours
                </Badge>
              }
              title="Business Hours"
              description="Our team is available throughout the week to assist with orders, catering enquiries, customer support and product information."
              align="center"
            />

            <div className="mx-auto mt-8 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#6D2E00] to-[#C89B3C] text-white shadow-xl">
              <Clock
                size={42}
                aria-hidden="true"
              />
            </div>
          </div>

          {/* Schedule */}

          <div className="mt-12 space-y-5 sm:mt-14">
            {schedule.map((item) => (
              <Card
                key={item.day}
                variant="filled"
                padding="md"
                hover
                className="shadow-none"
              >
                <div className="flex flex-col items-start justify-between gap-5 md:flex-row md:items-center">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFF4DE] to-[#FFE8BF]">
                      <CalendarDays
                        size={26}
                        className="text-[#C89B3C]"
                        aria-hidden="true"
                      />
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-[#6D2E00] sm:text-xl">
                        {item.day}
                      </h3>

                      <p className="mt-1 text-sm text-gray-500">
                        Customer support available
                      </p>
                    </div>
                  </div>

                  <Badge
                    variant="neutral"
                    size="lg"
                    className="gap-2"
                  >
                    <BadgeCheck
                      size={18}
                      aria-hidden="true"
                    />

                    {item.hours}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>

          {/* Bottom notice */}

          <Card
            variant="filled"
            padding="lg"
            className="mt-12 bg-gradient-to-r from-[#FFF4DE] to-[#FFE8BF] text-center shadow-none sm:mt-14"
          >
            <h3 className="text-2xl font-bold text-[#6D2E00]">
              Need Assistance Outside Business Hours?
            </h3>

            <p className="mx-auto mt-4 max-w-3xl leading-8 text-gray-700">
              You can still send us a message through the contact form or
              WhatsApp. We will respond as soon as possible during our next
              business hours.
            </p>
          </Card>
        </Card>
      </Container>
    </section>
  );
}