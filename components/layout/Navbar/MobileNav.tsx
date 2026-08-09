"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  Drumstick,
  Leaf,
  Menu,
  MessageCircle,
  Search,
  ShoppingCart,
  UtensilsCrossed,
  X,
} from "lucide-react";

import Container from "@/components/ui/Container";
import { useCart } from "@/context/CartContext";
import { siteConfig } from "@/lib/site";

import Logo from "./Logo";

const cateringLinks = [
  {
    title: "Catering Services",
    href: "/catering",
    icon: UtensilsCrossed,
  },
  {
    title: "All Catering Plates",
    href: "/catering/plates",
    icon: UtensilsCrossed,
  },
  {
    title: "Veg Plates",
    href: "/catering/plates/veg",
    icon: Leaf,
  },
  {
    title: "Non-Veg Plates",
    href: "/catering/plates/non-veg",
    icon: Drumstick,
  },
];

function isPathActive(
  pathname: string,
  href: string,
) {
  if (href === "/") {
    return pathname === "/";
  }

  return (
    pathname === href ||
    pathname.startsWith(`${href}/`)
  );
}

export default function MobileNav() {
  const pathname = usePathname();
  const { totalItems } = useCart();

  const [open, setOpen] = useState(false);

  const [cateringOpen, setCateringOpen] =
    useState(
      pathname === "/catering" ||
        pathname.startsWith("/catering/"),
    );

  function closeNavigation() {
    setOpen(false);
  }

  return (
    <div className="lg:hidden">
      <Container className="flex h-20 items-center justify-between">
        <Logo />

        <div className="flex items-center gap-2">
          <Link
            href="/cart"
            onClick={closeNavigation}
            aria-label={
              totalItems > 0
                ? `View cart with ${totalItems} ${
                    totalItems === 1 ? "item" : "items"
                  }`
                : "View cart"
            }
            className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-[#F3DFC2] bg-white text-[#6D2E00] shadow-sm transition-all duration-300 hover:border-[#C89B3C] hover:bg-[#FFF4DE] focus:outline-none focus:ring-4 focus:ring-[#C89B3C]/20"
          >
            <ShoppingCart
              size={22}
              aria-hidden="true"
            />

            {totalItems > 0 && (
              <span
                aria-hidden="true"
                className="absolute -right-1.5 -top-1.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-[#C89B3C] px-1.5 text-xs font-bold leading-none text-white shadow-md"
              >
                {totalItems > 99
                  ? "99+"
                  : totalItems}
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={() =>
              setOpen((current) => !current)
            }
            aria-label={
              open
                ? "Close navigation menu"
                : "Open navigation menu"
            }
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
        </div>
      </Container>

      <div
        id="mobile-navigation"
        className={`overflow-hidden bg-[#FFFDF8] transition-all duration-300 ${
          open
            ? "max-h-[1200px] border-t border-[#F3DFC2] shadow-xl"
            : "max-h-0"
        }`}
      >
        <Container className="py-5">
          <nav
            aria-label="Mobile navigation"
            className="space-y-2"
          >
            {siteConfig.navigation.map(
              (item) => {
                const active = isPathActive(
                  pathname,
                  item.href,
                );

                if (
                  item.href === "/catering"
                ) {
                  return (
                    <div
                      key={item.href}
                      className="overflow-hidden rounded-2xl"
                    >
                      <div
                        className={`flex items-center gap-2 rounded-2xl transition-all duration-300 ${
                          active
                            ? "bg-[#FFF4DE] text-[#C89B3C] shadow-sm"
                            : "text-[#6D2E00] hover:bg-[#FFF4DE]"
                        }`}
                      >
                        <Link
                          href="/catering"
                          onClick={
                            closeNavigation
                          }
                          aria-current={
                            pathname ===
                            "/catering"
                              ? "page"
                              : undefined
                          }
                          className="flex min-w-0 flex-1 items-center px-5 py-4"
                        >
                          <span className="font-semibold">
                            Catering
                          </span>
                        </Link>

                        <button
                          type="button"
                          onClick={() =>
                            setCateringOpen(
                              (current) =>
                                !current,
                            )
                          }
                          aria-label={
                            cateringOpen
                              ? "Collapse catering links"
                              : "Expand catering links"
                          }
                          aria-expanded={
                            cateringOpen
                          }
                          aria-controls="mobile-catering-links"
                          className="mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition hover:bg-white/70 focus:outline-none focus:ring-4 focus:ring-[#C89B3C]/20"
                        >
                          <ChevronDown
                            size={20}
                            aria-hidden="true"
                            className={`transition-transform duration-300 ${
                              cateringOpen
                                ? "rotate-180"
                                : ""
                            }`}
                          />
                        </button>
                      </div>

                      <div
                        id="mobile-catering-links"
                        className={`overflow-hidden transition-all duration-300 ${
                          cateringOpen
                            ? "mt-2 max-h-96 opacity-100"
                            : "max-h-0 opacity-0"
                        }`}
                      >
                        <div className="space-y-2 border-l-2 border-[#E8C784] pl-3">
                          {cateringLinks.map(
                            (
                              cateringItem,
                            ) => {
                              const Icon =
                                cateringItem.icon;

                              const cateringActive =
                                pathname ===
                                  cateringItem.href ||
                                (cateringItem.href !==
                                  "/catering" &&
                                  pathname.startsWith(
                                    `${cateringItem.href}/`,
                                  ));

                              return (
                                <Link
                                  key={
                                    cateringItem.href
                                  }
                                  href={
                                    cateringItem.href
                                  }
                                  onClick={
                                    closeNavigation
                                  }
                                  aria-current={
                                    pathname ===
                                    cateringItem.href
                                      ? "page"
                                      : undefined
                                  }
                                  className={`group flex items-center justify-between rounded-2xl px-4 py-3 transition-all duration-300 ${
                                    cateringActive
                                      ? "bg-white text-[#C89B3C] shadow-sm"
                                      : "text-[#6D2E00] hover:bg-white"
                                  }`}
                                >
                                  <span className="flex items-center gap-3">
                                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFF4DE]">
                                      <Icon
                                        size={
                                          18
                                        }
                                        aria-hidden="true"
                                      />
                                    </span>

                                    <span className="text-sm font-semibold">
                                      {
                                        cateringItem.title
                                      }
                                    </span>
                                  </span>

                                  <ChevronRight
                                    size={
                                      18
                                    }
                                    aria-hidden="true"
                                    className="transition-transform duration-300 group-hover:translate-x-1"
                                  />
                                </Link>
                              );
                            },
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeNavigation}
                    aria-current={
                      active
                        ? "page"
                        : undefined
                    }
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
              },
            )}
          </nav>

          <div className="my-5 border-t border-[#F3DFC2]" />

          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/search"
              onClick={closeNavigation}
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
              onClick={closeNavigation}
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
            onClick={closeNavigation}
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