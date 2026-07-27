"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronRight,
  Menu,
  MessageCircle,
  Search,
  ShoppingCart,
  X,
} from "lucide-react";

import Container from "@/components/ui/Container";
import { siteConfig } from "@/lib/site";

import Logo from "./Logo";

export default function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <Container className="flex h-20 items-center justify-between">
        <Logo />

        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={open}
          aria-controls="mobile-navigation"
          className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#F3DFC2] bg-[#FFF4DE] text-[#6D2E00] transition-all duration-300 hover:bg-[#C89B3C] hover:text-white focus:outline-none focus:ring-4 focus:ring-[#C89B3C]/20"
        >
          {open ? (
            <X
              size={24}
              aria-hidden="true"
            />
          ) : (
            <Menu
              size={24}
              aria-hidden="true"
            />
          )}
        </button>
      </Container>

      <div
        id="mobile-navigation"
        className={`overflow-hidden bg-[#FFFDF8] transition-all duration-300 ${
          open
            ? "max-h-[900px] border-t border-[#F3DFC2] shadow-xl"
            : "max-h-0"
        }`}
      >
        <Container className="py-5">
          <nav
            aria-label="Mobile navigation"
            className="space-y-2"
          >
            {siteConfig.navigation.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={`group flex items-center justify-between rounded-2xl px-5 py-4 transition-all duration-300 ${
                    active
                      ? "bg-[#FFF4DE] text-[#C89B3C] shadow-sm"
                      : "text-[#6D2E00] hover:bg-[#FFF4DE]"
                  }`}
                >
                  <span className="font-semibold">
                    {item.title}
                  </span>

                  <ChevronRight
                    size={20}
                    className="transition-transform duration-300 group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </Link>
              );
            })}
          </nav>

          <div className="my-5 border-t border-[#F3DFC2]" />

          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/search"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-2 rounded-2xl border border-[#F3DFC2] bg-white px-4 py-4 font-semibold text-[#6D2E00] shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#C89B3C] hover:bg-[#FFF4DE] focus:outline-none focus:ring-4 focus:ring-[#C89B3C]/20"
            >
              <Search
                size={19}
                aria-hidden="true"
              />

              Search
            </Link>

            <Link
              href="/cart"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-2 rounded-2xl border border-[#F3DFC2] bg-white px-4 py-4 font-semibold text-[#6D2E00] shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#C89B3C] hover:bg-[#FFF4DE] focus:outline-none focus:ring-4 focus:ring-[#C89B3C]/20"
            >
              <ShoppingCart
                size={19}
                aria-hidden="true"
              />

              Cart
            </Link>
          </div>

          <a
            href={`https://wa.me/${siteConfig.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="mt-4 flex items-center justify-center gap-3 rounded-2xl bg-[#25D366] px-6 py-4 font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:bg-[#20BD5A] hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-[#25D366]/25"
          >
            <MessageCircle
              size={20}
              aria-hidden="true"
            />

            Chat on WhatsApp
          </a>
        </Container>
      </div>
    </div>
  );
}