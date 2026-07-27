"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";

import Card from "@/components/ui/Card";

interface FAQItemProps {
  question: string;
  answer: string;
}

export default function FAQItem({
  question,
  answer,
}: FAQItemProps) {
  const [open, setOpen] = useState(false);
  const answerId = useId();

  return (
    <Card
      padding="none"
      className={`group overflow-hidden bg-white/90 backdrop-blur-sm transition-all duration-300 ${
        open
          ? "border-[#C89B3C]/50 shadow-xl"
          : "hover:border-[#C89B3C]/40 hover:shadow-xl"
      }`}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={answerId}
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-5 px-6 py-6 text-left focus:outline-none focus:ring-4 focus:ring-inset focus:ring-[#C89B3C]/20 sm:px-7"
      >
        <span className="text-base font-semibold leading-7 text-[#6D2E00] transition-colors duration-300 group-hover:text-[#C89B3C] sm:text-lg">
          {question}
        </span>

        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
            open
              ? "rotate-180 bg-[#C89B3C] text-white"
              : "bg-[#FFF3DA] text-[#6D2E00]"
          }`}
        >
          <ChevronDown
            size={20}
            aria-hidden="true"
          />
        </span>
      </button>

      <div
        id={answerId}
        className={`grid transition-all duration-300 ease-in-out ${
          open
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="mx-6 border-t border-[#F3DFC2] sm:mx-7" />

          <p className="px-6 pb-7 pt-5 leading-8 text-gray-600 sm:px-7">
            {answer}
          </p>
        </div>
      </div>
    </Card>
  );
}