"use client";

import { useState } from "react";
import {
  ChevronDown,
  HelpCircle,
  Sparkles,
} from "lucide-react";

import { faqs } from "@/lib/constants/faq";

import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";

export default function CateringFAQ() {
  const cateringFaqs = faqs.filter(
    (faq) => faq.category === "catering"
  );

  const [openIndex, setOpenIndex] =
    useState<number | null>(0);

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#FFF4DE] via-[#FFFDF8] to-white py-20 sm:py-24">
      {/* Decorative background */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full bg-[#FFE8BF]/60 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[#FFF4DE]/80 blur-3xl"
      />

      <Container className="relative">
        {/* Heading */}

        <SectionHeader
          badge={
            <Badge
              variant="neutral"
              className="gap-2 bg-white shadow-sm"
            >
              <Sparkles
                size={16}
                aria-hidden="true"
              />

              Frequently Asked Questions
            </Badge>
          }
          title="Catering FAQs"
          description="Everything you need to know about our catering services, bookings, menus and event planning."
          align="center"
          className="mx-auto max-w-3xl"
        />

        {/* FAQ list */}

        <div className="mx-auto mt-14 max-w-5xl space-y-5 sm:mt-16 sm:space-y-6">
          {cateringFaqs.map((faq, index) => {
            const isOpen = openIndex === index;
            const contentId = `catering-faq-${index}`;

            return (
              <Card
                key={faq.question}
                padding="none"
                className="overflow-hidden bg-white/90 shadow-lg backdrop-blur-sm"
              >
                <button
                  type="button"
                  onClick={() =>
                    setOpenIndex(
                      isOpen ? null : index
                    )
                  }
                  aria-expanded={isOpen}
                  aria-controls={contentId}
                  className="flex w-full items-center justify-between gap-4 p-5 text-left transition-colors duration-300 hover:bg-[#FFFDF8] sm:gap-5 sm:p-7"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFF4DE] to-[#FFE8BF] sm:h-12 sm:w-12">
                      <HelpCircle
                        size={22}
                        className="text-[#C89B3C]"
                        aria-hidden="true"
                      />
                    </div>

                    <span className="text-base font-semibold leading-7 text-[#6D2E00] sm:text-lg">
                      {faq.question}
                    </span>
                  </div>

                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FFF4DE] text-[#C89B3C] transition-transform duration-300 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  >
                    <ChevronDown
                      size={20}
                      aria-hidden="true"
                    />
                  </span>
                </button>

                <div
                  id={contentId}
                  className={`grid transition-all duration-300 ease-in-out ${
                    isOpen
                      ? "grid-rows-[1fr]"
                      : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="border-t border-[#F3DFC2] px-5 pb-6 pt-5 sm:px-7 sm:pb-7 sm:pt-6">
                      <p className="leading-8 text-gray-600">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Bottom card */}

        <Card
          variant="filled"
          padding="lg"
          className="mx-auto mt-14 max-w-5xl bg-gradient-to-r from-[#FFFDF8] to-[#FFF4DE] text-center shadow-lg sm:mt-16"
        >
          <h3 className="text-2xl font-bold text-[#6D2E00]">
            Still Have Questions?
          </h3>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-gray-600 sm:text-lg">
            Our team is happy to help you choose the
            right catering package, customize your
            menu and answer questions about your
            upcoming event.
          </p>
        </Card>
      </Container>
    </section>
  );
}