import Link from "next/link";
import {
  ArrowRight,
  HelpCircle,
  Sparkles,
} from "lucide-react";

import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";

const faqs = [
  {
    question: "Do you provide catering for weddings and events?",
    answer:
      "Yes, we provide catering services for weddings, birthdays, housewarming ceremonies, corporate events, festivals and family functions.",
  },
  {
    question: "How can I place an order?",
    answer:
      "You can place an order directly through our website or contact our team by phone or WhatsApp for assistance.",
  },
  {
    question: "Do you prepare food fresh?",
    answer:
      "Yes. Every order is freshly prepared using carefully selected ingredients and authentic traditional recipes.",
  },
];

export default function FAQPreview() {
  return (
    <section className="relative overflow-hidden bg-white py-20 sm:py-24">
      {/* Decorative background */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 top-16 h-72 w-72 rounded-full bg-[#FFF4DE]/80 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[#FFE8BF]/70 blur-3xl"
      />

      <Container className="relative">
        {/* Heading */}

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

              Frequently Asked Questions
            </Badge>
          }
          title="Have Questions?"
          description="Here are some of the questions we receive most often. Visit our complete FAQ page for more detailed information."
          align="center"
          className="mx-auto max-w-3xl"
        />

        {/* FAQ cards */}

        <div className="mx-auto mt-14 max-w-6xl space-y-5 sm:mt-16 sm:space-y-6">
          {faqs.map((faq, index) => (
            <Card
              key={faq.question}
              padding="lg"
              hover
              className="group bg-white/90 backdrop-blur-sm"
            >
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFF4DE] to-[#FFE8BF]">
                  <HelpCircle
                    size={26}
                    className="text-[#C89B3C]"
                    aria-hidden="true"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="neutral"
                      size="sm"
                    >
                      FAQ {index + 1}
                    </Badge>

                    <div
                      aria-hidden="true"
                      className="h-px flex-1 bg-[#F3DFC2]"
                    />
                  </div>

                  <h3 className="mt-4 text-xl font-bold leading-8 text-[#6D2E00] transition-colors duration-300 group-hover:text-[#C89B3C] sm:text-2xl">
                    {faq.question}
                  </h3>

                  <p className="mt-4 leading-8 text-gray-600">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}

        <Card
          variant="filled"
          padding="lg"
          className="mx-auto mt-14 max-w-6xl bg-gradient-to-r from-[#FFFDF8] to-[#FFF4DE] shadow-xl sm:mt-16"
        >
          <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
            <div>
              <h3 className="text-2xl font-bold text-[#6D2E00] sm:text-3xl">
                Looking for More Answers?
              </h3>

              <p className="mt-4 max-w-2xl text-base leading-8 text-gray-600 sm:text-lg">
                Browse our complete collection of frequently asked questions
                covering products, catering services, ordering, delivery,
                payments and more.
              </p>
            </div>

            <Link
              href="/faq"
              className="inline-flex h-14 shrink-0 items-center justify-center gap-3 rounded-full bg-[#6D2E00] px-8 text-lg font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:bg-[#4E1F00] hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-[#C89B3C]/20 active:scale-95"
            >
              View All FAQs

              <ArrowRight
                size={18}
                aria-hidden="true"
              />
            </Link>
          </div>
        </Card>
      </Container>
    </section>
  );
}