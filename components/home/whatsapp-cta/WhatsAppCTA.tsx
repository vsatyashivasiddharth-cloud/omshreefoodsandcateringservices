import Link from "next/link";
import {
  ArrowRight,
  Check,
  MessageCircle,
  Phone,
  Sparkles,
} from "lucide-react";

import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Container from "@/components/ui/Container";
import { siteConfig } from "@/lib/site";
import { whatsappUrl } from "@/lib/whatsapp";

const trustPoints = [
  "Freshly Prepared",
  "Hygienic Kitchen",
  "Bulk Orders",
  "Fast Delivery",
];

export default function WhatsAppCTA() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#5B2400] via-[#6D2E00] to-[#8A3A00] py-20 sm:py-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-[#C89B3C]/20 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-[#C89B3C]/20 blur-3xl"
      />

      <Container className="relative">
        <Card
          padding="none"
          className="overflow-hidden border-white/10 bg-white/5 text-white shadow-2xl backdrop-blur-sm"
        >
          <div className="relative px-6 py-14 text-center sm:px-10 sm:py-16 md:px-16">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-white/5 blur-3xl"
            />

            <div className="relative">
              <Badge
                variant="neutral"
                className="gap-2 border border-[#C89B3C]/30 bg-[#C89B3C]/10 text-[#FFE3A8]"
              >
                <Sparkles
                  size={16}
                  aria-hidden="true"
                />

                Order Today
              </Badge>

              <h2 className="mx-auto mt-7 max-w-4xl text-4xl font-bold leading-tight sm:text-5xl md:text-6xl">
                Fresh Homemade Snacks
                <span className="block text-[#FFE3A8]">
                  and Premium Catering
                </span>
              </h2>

              <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-white/80 sm:text-lg">
                From authentic snacks, sweets and pickles to complete catering
                for special occasions, we prepare every order with care,
                quality ingredients and traditional flavour.
              </p>

              <div className="mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-4">
                {trustPoints.map((point) => (
                  <div
                    key={point}
                    className="inline-flex items-center gap-2 text-sm font-medium text-[#FFE3A8]"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10">
                      <Check
                        size={15}
                        aria-hidden="true"
                      />
                    </span>

                    {point}
                  </div>
                ))}
              </div>

              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-14 w-full items-center justify-center gap-3 rounded-full bg-[#25D366] px-8 text-lg font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:bg-[#20BD5A] hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-[#25D366]/30 active:scale-95 sm:w-auto"
                >
                  <MessageCircle
                    size={22}
                    aria-hidden="true"
                  />

                  Chat on WhatsApp

                  <ArrowRight
                    size={18}
                    aria-hidden="true"
                  />
                </Link>

                <Link
                  href={`tel:${siteConfig.phone}`}
                  className="inline-flex h-14 w-full items-center justify-center gap-3 rounded-full border border-white/30 bg-white/10 px-8 text-lg font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:text-[#6D2E00] focus:outline-none focus:ring-4 focus:ring-white/25 active:scale-95 sm:w-auto"
                >
                  <Phone
                    size={20}
                    aria-hidden="true"
                  />

                  Call Now
                </Link>
              </div>
            </div>
          </div>
        </Card>
      </Container>
    </section>
  );
}