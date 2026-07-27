"use client";

import {
  Search,
  SearchX,
  Sparkles,
} from "lucide-react";

import {
  Badge,
  Card,
  SectionHeader,
} from "@/components/ui";

interface SearchEmptyProps {
  query: string;
}

const suggestions = [
  "Pickles",
  "Sweets",
  "Snacks",
  "Spices",
  "Millets",
  "Healthy",
];

export default function SearchEmpty({
  query,
}: SearchEmptyProps) {
  return (
    <Card
      padding="lg"
      className="relative mt-20 overflow-hidden shadow-2xl"
    >
      {/* Background */}

      <div className="absolute -left-16 top-0 h-64 w-64 rounded-full bg-[#FFF4DE] opacity-70 blur-3xl" />

      <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[#FFE8BF] opacity-60 blur-3xl" />

      <div className="relative text-center">
        {/* Icon */}

        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#FFF4DE] to-[#FFE8BF] shadow-lg">
          <SearchX
            size={42}
            className="text-[#C89B3C]"
          />
        </div>

        {/* Header */}

        <div className="mt-8">
          <SectionHeader
            badge={
              <>
                <Sparkles size={16} />
                <span>No Matching Products</span>
              </>
            }
            title="Nothing Found"
            description="We couldn't find any products matching your search. Try different keywords or browse one of our popular categories."
            align="center"
            className="mb-0"
          />
        </div>

        {/* Search Query */}

        <Badge
          variant="neutral"
          size="lg"
          className="mt-8 bg-white shadow-md"
        >
          <Search
            size={18}
            className="text-[#C89B3C]"
          />

          <span>"{query}"</span>
        </Badge>

        {/* Suggestions */}

        <div className="mt-12">
          <h3 className="text-lg font-semibold text-[#6D2E00]">
            Popular Searches
          </h3>

          <div className="mt-6 flex flex-wrap justify-center gap-4">
            {suggestions.map((item) => (
              <Badge
                key={item}
                variant="neutral"
                className="cursor-default border border-[#F3DFC2] bg-[#FFFDF8] px-5 py-3 transition-all duration-300 hover:-translate-y-1 hover:border-[#C89B3C] hover:bg-[#FFF4DE] hover:shadow-lg"
              >
                {item}
              </Badge>
            ))}
          </div>
        </div>

        {/* Bottom Note */}

        <Card
          variant="filled"
          padding="md"
          className="mt-12 shadow-none"
        >
          <p className="text-[#6D2E00]">
            Looking for something specific? Try searching by product
            name, category, or a broader keyword like{" "}
            <strong>"Snacks"</strong>,{" "}
            <strong>"Pickles"</strong>, or{" "}
            <strong>"Sweets"</strong>.
          </p>
        </Card>
      </div>
    </Card>
  );
}