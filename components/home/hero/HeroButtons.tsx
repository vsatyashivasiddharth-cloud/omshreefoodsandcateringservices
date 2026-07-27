import Link from "next/link";
import {
  ArrowRight,
  UtensilsCrossed,
} from "lucide-react";

export default function HeroButtons() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:justify-center lg:justify-start">
      <Link
        href="/shop"
        className="inline-flex h-14 items-center justify-center gap-3 rounded-full bg-[#C89B3C] px-8 text-lg font-semibold text-[#2F1608] shadow-xl transition-all duration-300 hover:-translate-y-1 hover:bg-[#D9AA47] hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-[#C89B3C]/30 active:scale-95"
      >
        Shop Now

        <ArrowRight
          size={20}
          aria-hidden="true"
        />
      </Link>

      <Link
        href="/catering"
        className="inline-flex h-14 items-center justify-center gap-3 rounded-full border border-white/60 bg-white/10 px-8 text-lg font-semibold text-white backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:text-[#2F1608] focus:outline-none focus:ring-4 focus:ring-white/30 active:scale-95"
      >
        <UtensilsCrossed
          size={20}
          aria-hidden="true"
        />

        Catering
      </Link>
    </div>
  );
}