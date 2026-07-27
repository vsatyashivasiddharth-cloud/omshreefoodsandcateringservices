import { HelpCircle } from "lucide-react";

import Badge from "@/components/ui/Badge";
import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";

import FAQItem from "./FAQItem";
import { faqs } from "./faqs";

export default function FAQ() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-[#FFFDF8] to-[#FFF8EE] py-20 sm:py-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-0 h-96 w-96 rounded-full bg-[#FFE7B8]/35 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-[#FFE7B8]/35 blur-3xl"
      />

      <Container className="relative">
        <div className="mx-auto max-w-4xl">
          <SectionHeader
            badge={
              <Badge
                variant="neutral"
                className="gap-2"
              >
                <HelpCircle
                  size={16}
                  aria-hidden="true"
                />

                Frequently Asked Questions
              </Badge>
            }
            title="Have Questions?"
            description="Find answers to common questions about our homemade products, catering services, delivery and bulk orders."
            align="center"
            className="mx-auto max-w-3xl"
          />

          <div className="mt-14 space-y-5 sm:mt-16">
            {faqs.map((faq) => (
              <FAQItem
                key={faq.question}
                question={faq.question}
                answer={faq.answer}
              />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}