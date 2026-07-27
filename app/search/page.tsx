import type { Metadata } from "next";
import SearchContent from "@/components/search/SearchContent";

export const metadata: Metadata = {
  title: "Search Products",
  description:
    "Search homemade snacks, sweets, pickles, spice powders and more.",
};

export default function SearchPage() {
  return <SearchContent />;
}