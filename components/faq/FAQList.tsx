"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  HelpCircle,
  SearchX,
  Sparkles,
} from "lucide-react";

import { faqs } from "@/lib/constants/faq";

import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Container from "@/components/ui/Container";

interface FAQListProps {
  search: string;
}

const categoryTitles = {
  general: "General Questions",
  products: "Products",
  catering: "Catering",
} as const;

export default function FAQList({
  search,
}: FAQListProps) {
  const [openId, setOpenId] =
    useState<number | null>(1);

  const filteredFaqs = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return faqs;
    }

    return faqs.filter(
      (faq) =>
        faq.question
          .toLowerCase()
          .includes(query) ||
        faq.answer
          .toLowerCase()
          .includes(query)
    );
  }, [search]);

  const groupedFaqs = {
    general: filteredFaqs.filter(
      (faq) => faq.category === "general"
    ),
    products: filteredFaqs.filter(
      (faq) => faq.category === "products"
    ),
    catering: filteredFaqs.filter(
      (faq) => faq.category === "catering"
    ),
  };

  if (filteredFaqs.length === 0) {
    return (
      <section className="relative overflow-hidden bg-[#FFFDF8] py-20 sm:py-24">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-20 top-20 h-72 w-72 rounded-full bg-[#FFF4DE]/70 blur-3xl"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[#FFE8BF]/60 blur-3xl"
        />

        <Container className="relative">
          <Card
            padding="lg"
            className="mx-auto max-w-4xl text-center shadow-xl"
          >
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#FFF4DE]">
              <SearchX
                size={42}
                className="text-[#C89B3C]"
                aria-hidden="true"
              />
            </div>

            <Badge
              variant="neutral"
              className="mt-8"
            >
              No Matching Questions
            </Badge>

            <h2 className="mt-6 text-3xl font-bold text-[#6D2E00] sm:text-4xl">
              No FAQs Found
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-gray-600 sm:text-lg">
              We could not find any frequently asked
              questions matching your search. Try a
              different keyword such as delivery,
              catering, products or payment.
            </p>
          </Card>
        </Container>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#FFFDF8] via-white to-[#FFF8EE] pb-20 sm:pb-24">
      {/* Decorative background */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 top-20 h-72 w-72 rounded-full bg-[#FFF4DE]/70 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[#FFE8BF]/60 blur-3xl"
      />

      <Container className="relative">
        <div className="mx-auto max-w-5xl">
          {Object.entries(groupedFaqs).map(
            ([category, items]) => {
              if (items.length === 0) {
                return null;
              }

              const categoryTitle =
                categoryTitles[
                  category as keyof typeof categoryTitles
                ];

              return (
                <div
                  key={category}
                  className="mb-14 last:mb-0 sm:mb-16"
                >
                  {/* Category header */}

                  <div className="mb-7 flex items-center gap-4 sm:mb-8">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFF4DE] to-[#FFE8BF]">
                      <Sparkles
                        size={24}
                        className="text-[#C89B3C]"
                        aria-hidden="true"
                      />
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold text-[#6D2E00] sm:text-3xl">
                        {categoryTitle}
                      </h2>

                      <div
                        aria-hidden="true"
                        className="mt-2 h-1 w-20 rounded-full bg-gradient-to-r from-[#C89B3C] to-[#F3DFC2]"
                      />
                    </div>
                  </div>

                  {/* FAQ items */}

                  <div className="space-y-5">
                    {items.map((faq) => {
                      const isOpen =
                        openId === faq.id;

                      const panelId =
                        `faq-panel-${faq.id}`;

                      const buttonId =
                        `faq-button-${faq.id}`;

                      return (
                        <Card
                          key={faq.id}
                          padding="none"
                          className={`overflow-hidden transition-all duration-300 ${
                            isOpen
                              ? "border-[#C89B3C] shadow-xl"
                              : "shadow-md hover:border-[#C89B3C]/60 hover:shadow-xl"
                          }`}
                        >
                          <button
                            id={buttonId}
                            type="button"
                            onClick={() =>
                              setOpenId(
                                isOpen
                                  ? null
                                  : faq.id
                              )
                            }
                            aria-expanded={isOpen}
                            aria-controls={panelId}
                            className="flex w-full items-center justify-between gap-4 p-5 text-left transition-colors duration-300 hover:bg-[#FFFDF8] sm:gap-6 sm:px-8 sm:py-6"
                          >
                            <div className="flex min-w-0 items-center gap-4">
                              <div
                                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all duration-300 sm:h-12 sm:w-12 ${
                                  isOpen
                                    ? "bg-gradient-to-br from-[#6D2E00] to-[#C89B3C] text-white"
                                    : "bg-[#FFF4DE] text-[#C89B3C]"
                                }`}
                              >
                                <HelpCircle
                                  size={20}
                                  aria-hidden="true"
                                />
                              </div>

                              <span className="text-base font-semibold leading-7 text-[#6D2E00] sm:text-lg">
                                {faq.question}
                              </span>
                            </div>

                            <span
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FFF4DE] text-[#C89B3C] transition-transform duration-300 ${
                                isOpen
                                  ? "rotate-180"
                                  : ""
                              }`}
                            >
                              <ChevronDown
                                size={20}
                                aria-hidden="true"
                              />
                            </span>
                          </button>

                          <div
                            id={panelId}
                            role="region"
                            aria-labelledby={buttonId}
                            className={`grid transition-all duration-300 ease-in-out ${
                              isOpen
                                ? "grid-rows-[1fr]"
                                : "grid-rows-[0fr]"
                            }`}
                          >
                            <div className="overflow-hidden">
                              <div className="border-t border-[#F3DFC2] bg-[#FFFDF8] px-5 py-6 sm:px-8">
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
                </div>
              );
            }
          )}

          {/* Bottom card */}

          <Card
            variant="glass"
            padding="lg"
            className="mt-16 bg-white/90 text-center shadow-xl backdrop-blur-sm sm:mt-20"
          >
            <h3 className="text-2xl font-bold text-[#6D2E00] sm:text-3xl">
              Didn&apos;t Find Your Answer?
            </h3>

            <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-gray-600 sm:text-lg">
              Our team is always happy to answer
              questions about products, catering,
              orders, deliveries and special requests.
            </p>
          </Card>
        </div>
      </Container>
    </section>
  );
}