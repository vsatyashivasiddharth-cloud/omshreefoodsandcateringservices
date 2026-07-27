"use client";

import {
  Search,
  Sparkles,
  X,
} from "lucide-react";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Container from "@/components/ui/Container";

interface FAQSearchProps {
  search: string;
  onSearchChange: (value: string) => void;
}

export default function FAQSearch({
  search,
  onSearchChange,
}: FAQSearchProps) {
  return (
    <section className="relative z-10 -mt-10 pb-14 sm:-mt-12">
      <Container>
        <Card
          variant="glass"
          padding="lg"
          className="mx-auto max-w-4xl bg-white/95 shadow-2xl backdrop-blur-xl"
        >
          {/* Header */}

          <div className="mb-6 flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFF4DE] to-[#FFE8BF]">
              <Sparkles
                size={22}
                className="text-[#C89B3C]"
                aria-hidden="true"
              />
            </div>

            <div>
              <h2 className="text-xl font-bold text-[#6D2E00]">
                Search FAQs
              </h2>

              <p className="mt-1 text-sm leading-6 text-gray-500">
                Quickly find answers about products, catering, delivery and
                payments.
              </p>
            </div>
          </div>

          {/* Search input */}

          <div className="relative">
            <Search
              size={22}
              className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-[#C89B3C]"
              aria-hidden="true"
            />

            <label
              htmlFor="faq-search"
              className="sr-only"
            >
              Search frequently asked questions
            </label>

            <input
              id="faq-search"
              type="search"
              value={search}
              onChange={(event) =>
                onSearchChange(event.target.value)
              }
              placeholder="Search products, catering, delivery, payments..."
              autoComplete="off"
              className="h-16 w-full rounded-2xl border border-[#F3DFC2] bg-[#FFFDF8] py-4 pl-14 pr-5 text-base text-[#6D2E00] outline-none transition-all duration-300 placeholder:text-gray-400 hover:border-[#C89B3C]/60 focus:border-[#C89B3C] focus:bg-white focus:ring-4 focus:ring-[#FFF4DE] sm:text-lg"
            />
          </div>

          {/* Footer */}

          <div className="mt-6 flex flex-col gap-4 border-t border-[#F3DFC2] pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-6 text-gray-500">
              Try keywords such as{" "}
              <span className="font-medium text-[#6D2E00]">
                delivery
              </span>
              ,{" "}
              <span className="font-medium text-[#6D2E00]">
                catering
              </span>
              ,{" "}
              <span className="font-medium text-[#6D2E00]">
                snacks
              </span>{" "}
              or{" "}
              <span className="font-medium text-[#6D2E00]">
                payment
              </span>
              .
            </p>

            {search && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                leftIcon={
                  <X
                    size={16}
                    aria-hidden="true"
                  />
                }
                onClick={() => onSearchChange("")}
                className="self-start border border-[#F3DFC2] sm:self-auto"
              >
                Clear Search
              </Button>
            )}
          </div>
        </Card>
      </Container>
    </section>
  );
}