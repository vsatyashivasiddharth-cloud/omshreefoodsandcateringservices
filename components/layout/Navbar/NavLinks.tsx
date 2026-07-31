"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";

import { siteConfig } from "@/lib/site";

const cateringLinks = [
  {
    title: "Catering Services",
    href: "/catering",
  },
  {
    title: "All Catering Plates",
    href: "/catering/plates",
  },
  {
    title: "Veg Plates",
    href: "/catering/plates/veg",
  },
  {
    title: "Non-Veg Plates",
    href: "/catering/plates/non-veg",
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

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main menu"
      className="flex items-center gap-1 xl:gap-2"
    >
      {siteConfig.navigation.map((item) => {
        const active = isPathActive(
          pathname,
          item.href,
        );

        if (item.href === "/catering") {
          return (
            <div
              key={item.href}
              className="group relative"
            >
              <Link
                href={item.href}
                aria-current={
                  pathname === item.href
                    ? "page"
                    : undefined
                }
                className={`relative flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-3 text-sm font-semibold tracking-wide transition-all duration-300 xl:px-4 xl:text-[15px] ${
                  active
                    ? "bg-[#FFF4DE] text-[#C89B3C]"
                    : "text-[#6D2E00] hover:bg-[#FFF4DE]/70 hover:text-[#C89B3C]"
                }`}
              >
                {item.title}

                <ChevronDown
                  size={15}
                  aria-hidden="true"
                  className="transition-transform duration-300 group-hover:rotate-180 group-focus-within:rotate-180"
                />

                <span
                  aria-hidden="true"
                  className={`absolute bottom-2 left-1/2 h-0.5 -translate-x-1/2 rounded-full bg-[#C89B3C] transition-all duration-300 ${
                    active
                      ? "w-8"
                      : "w-0 group-hover:w-8"
                  }`}
                />
              </Link>

              <div
                className="invisible absolute left-1/2 top-full z-50 w-64 -translate-x-1/2 translate-y-2 pt-3 opacity-0 transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100"
              >
                <div className="overflow-hidden rounded-2xl border border-[#F0D9B6] bg-white p-2 shadow-[0_18px_50px_rgba(109,46,0,0.16)]">
                  {cateringLinks.map(
                    (cateringItem) => {
                      const cateringActive =
                        isPathActive(
                          pathname,
                          cateringItem.href,
                        );

                      return (
                        <Link
                          key={
                            cateringItem.href
                          }
                          href={
                            cateringItem.href
                          }
                          aria-current={
                            pathname ===
                            cateringItem.href
                              ? "page"
                              : undefined
                          }
                          className={`block rounded-xl px-4 py-3 text-sm font-semibold transition ${
                            cateringActive
                              ? "bg-[#FFF4DE] text-[#C89B3C]"
                              : "text-[#6D2E00] hover:bg-[#FFF8EE] hover:text-[#C89B3C]"
                          }`}
                        >
                          {
                            cateringItem.title
                          }
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
            aria-current={
              active ? "page" : undefined
            }
            className={`group relative whitespace-nowrap rounded-full px-3 py-3 text-sm font-semibold tracking-wide transition-all duration-300 xl:px-4 xl:text-[15px] ${
              active
                ? "bg-[#FFF4DE] text-[#C89B3C]"
                : "text-[#6D2E00] hover:bg-[#FFF4DE]/70 hover:text-[#C89B3C]"
            }`}
          >
            {item.title}

            <span
              aria-hidden="true"
              className={`absolute bottom-2 left-1/2 h-0.5 -translate-x-1/2 rounded-full bg-[#C89B3C] transition-all duration-300 ${
                active
                  ? "w-8"
                  : "w-0 group-hover:w-8"
              }`}
            />
          </Link>
        );
      })}
    </nav>
  );
}