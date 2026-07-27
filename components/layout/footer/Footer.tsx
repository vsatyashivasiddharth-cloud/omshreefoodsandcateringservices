import Link from "next/link";
import {
  Mail,
  MapPin,
  Phone,
  Sparkles,
} from "lucide-react";

import Card from "@/components/ui/Card";
import Container from "@/components/ui/Container";
import { siteConfig } from "@/lib/site";

import FooterLinks from "./FooterLinks";
import SocialLinks from "./SocialLinks";

const popularProducts = [
  "Murukulu",
  "Janthikalu",
  "Chekkalu",
  "Sweets",
  "Pickles",
  "Masala Powders",
];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-[#3B1800] text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 top-0 h-80 w-80 rounded-full bg-[#6D2E00]/50 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-[#C89B3C]/10 blur-3xl"
      />

      <Container className="relative py-16 sm:py-20">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4 lg:gap-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-[#FFE4A3] backdrop-blur-md">
              <Sparkles
                size={15}
                aria-hidden="true"
              />

              Homemade Since Tradition
            </div>

            <h2 className="mt-6 text-3xl font-bold text-[#FFE4A3] sm:text-4xl">
              Om Shree Foods
            </h2>

            <p className="mt-5 leading-8 text-white/70">
              Authentic homemade snacks, sweets, pickles, spice powders and
              premium catering services crafted with care, tradition and
              quality ingredients.
            </p>

            <div className="mt-7">
              <SocialLinks />
            </div>
          </div>

          <FooterLinks />

          <div>
            <h3 className="text-xl font-bold text-white sm:text-2xl">
              Popular Products
            </h3>

            <ul className="mt-6 space-y-4 text-white/70">
              {popularProducts.map((item) => (
                <li
                  key={item}
                  className="transition-colors duration-300 hover:text-[#FFE4A3]"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-bold text-white sm:text-2xl">
              Contact Us
            </h3>

            <div className="mt-6 space-y-4">
              <Card
                padding="sm"
                className="border-white/10 bg-white/5 shadow-none"
              >
                <Link
                  href={`tel:${siteConfig.phone}`}
                  className="group flex items-start gap-4 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#C89B3C]/20"
                >
                  <Phone
                    size={18}
                    className="mt-1 shrink-0 text-[#FFE4A3]"
                    aria-hidden="true"
                  />

                  <span className="break-words text-white/70 transition-colors group-hover:text-white">
                    {siteConfig.phone}
                  </span>
                </Link>
              </Card>

              <Card
                padding="sm"
                className="border-white/10 bg-white/5 shadow-none"
              >
                <Link
                  href={`mailto:${siteConfig.email}`}
                  className="group flex items-start gap-4 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#C89B3C]/20"
                >
                  <Mail
                    size={18}
                    className="mt-1 shrink-0 text-[#FFE4A3]"
                    aria-hidden="true"
                  />

                  <span className="break-all text-white/70 transition-colors group-hover:text-white">
                    {siteConfig.email}
                  </span>
                </Link>
              </Card>

              <Card
                padding="sm"
                className="border-white/10 bg-white/5 shadow-none"
              >
                <div className="flex items-start gap-4">
                  <MapPin
                    size={18}
                    className="mt-1 shrink-0 text-[#FFE4A3]"
                    aria-hidden="true"
                  />

                  <span className="leading-7 text-white/70">
                    {siteConfig.address}
                  </span>
                </div>
              </Card>
            </div>
          </div>
        </div>

        <div className="mt-14 border-t border-white/10 pt-8">
          <div className="flex flex-col items-center justify-between gap-4 text-center text-sm text-white/50 md:flex-row md:text-left">
            <p>
              © {new Date().getFullYear()} Om Shree Foods &amp; Caterers. All
              rights reserved.
            </p>

            <p>
              Made with ❤️ for authentic homemade food lovers.
            </p>
          </div>
        </div>
      </Container>
    </footer>
  );
}