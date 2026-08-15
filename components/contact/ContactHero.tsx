import {
  PhoneCall,
  Sparkles,
} from "lucide-react";

import Badge from "@/components/ui/Badge";
import Container from "@/components/ui/Container";

export default function ContactHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#6D2E00] via-[#8B4513] to-[#C89B3C] py-12 text-white sm:py-14 lg:py-16">
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

            Contact Our Team
          </Badge>

          {/* Main icon */}

          <div className="mx-auto mt-8 flex h-24 w-24 items-center justify-center rounded-full border border-white/20 bg-white/10 shadow-xl backdrop-blur-md">
            <PhoneCall
              size={42}
              aria-hidden="true"
            />
          </div>

          {/* Heading */}

          <h1 className="mt-8 text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            We&apos;d Love to
            <span className="block text-[#FFE4A3]">
              Hear From You
            </span>
          </h1>

          <p className="mx-auto mt-7 max-w-3xl text-base leading-8 text-white/90 sm:text-lg md:text-xl md:leading-9">
            Whether you are ordering homemade delicacies, planning a catering
            event or simply have a question, our team is ready to help with
            friendly service and prompt support.
          </p>
        </div>
      </Container>
    </section>
  );
}