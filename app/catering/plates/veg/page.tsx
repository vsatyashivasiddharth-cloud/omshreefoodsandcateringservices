import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  Leaf,
} from "lucide-react";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/footer";
import Container from "@/components/ui/Container";
import CateringPlateGrid from "@/components/catering/CateringPlateGrid";
import { vegCateringPlates } from "@/lib/catering-plates";

export const metadata: Metadata = {
  title: "Vegetarian Catering Plates",
  description:
    "Explore Basic, Standard, Gold and Diamond vegetarian catering packages from Om Shree Foods & Caterers.",
  alternates: {
    canonical: "/catering/plates/veg",
  },
};

export default function VegPlatesPage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gradient-to-b from-[#FFFDF8] via-[#FFF8EE] to-white pt-28">
        <section className="py-14 sm:py-20">
          <Container>
            <Link
              href="/catering/plates"
              className="inline-flex items-center gap-2 font-semibold text-[#8B4513]"
            >
              <ArrowLeft size={18} />
              All Catering Plates
            </Link>

            <div className="mx-auto mb-14 mt-8 max-w-3xl text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E9F6E9] text-green-700">
                <Leaf size={32} />
              </div>

              <h1 className="mt-6 text-4xl font-bold text-[#6D2E00] sm:text-5xl">
                Vegetarian Catering Plates
              </h1>

              <p className="mt-5 text-lg leading-8 text-gray-600">
                Explore our Basic, Standard, Gold
                and Diamond vegetarian catering
                menus for weddings, parties and
                special occasions.
              </p>
            </div>

            <CateringPlateGrid
              plates={vegCateringPlates}
            />
          </Container>
        </section>
      </main>

      <Footer />
    </>
  );
}