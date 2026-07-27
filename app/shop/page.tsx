import type { Metadata } from "next";
import { Sparkles } from "lucide-react";

import Footer from "@/components/layout/footer";
import Navbar from "@/components/layout/Navbar";
import ShopContent from "@/components/shop/ShopContent";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shop Homemade Products",
  description:
    "Explore freshly prepared homemade snacks, sweets, pickles, spice powders and traditional delicacies made with authentic recipes.",
};

export default function ShopPage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gradient-to-b from-[#FFFDF8] via-[#FFF8EE] to-white pt-28">
        <section className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-40 top-0 h-96 w-96 rounded-full bg-[#FFE7B8]/35 blur-3xl"
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-[#FFE7B8]/35 blur-3xl"
          />

          <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
            <div className="mx-auto mb-14 max-w-3xl text-center lg:mb-16">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#F3D9A4] bg-[#FFF3DA] px-5 py-2 text-sm font-semibold text-[#A66A00] shadow-sm">
                <Sparkles
                  size={16}
                  aria-hidden="true"
                />

                Our Collection
              </div>

              <h1 className="mt-6 text-4xl font-bold leading-tight text-[#6D2E00] sm:text-5xl md:text-6xl">
                Shop Homemade Products
              </h1>

              <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-gray-600">
                Discover freshly prepared homemade snacks,
                sweets, pickles, spice powders and traditional
                delicacies made with authentic recipes and
                premium ingredients.
              </p>
            </div>

            <ShopContent />
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}