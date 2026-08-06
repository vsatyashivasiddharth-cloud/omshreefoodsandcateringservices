import type { Metadata } from "next";

import Footer from "@/components/layout/footer";
import Navbar from "@/components/layout/Navbar";
import SearchContent from "@/components/search/SearchContent";

export const metadata: Metadata = {
  title: "Search Products",
  description:
    "Search homemade snacks, sweets, pickles, spice powders and more.",
};

export default function SearchPage() {
  return (
    <>
      <Navbar />

      <main>
        <SearchContent />
      </main>

      <Footer />
    </>
  );
}