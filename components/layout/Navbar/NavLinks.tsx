"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { siteConfig } from "@/lib/site";

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main menu"
      className="flex items-center gap-1 xl:gap-2"
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
            aria-current={active ? "page" : undefined}
            className={`group relative rounded-full px-4 py-3 text-sm font-semibold tracking-wide transition-all duration-300 xl:px-5 xl:text-[15px] ${
              active
                ? "bg-[#FFF4DE] text-[#C89B3C]"
                : "text-[#6D2E00] hover:bg-[#FFF4DE]/70 hover:text-[#C89B3C]"
            }`}
          >
            {item.title}

            <span
              aria-hidden="true"
              className={`absolute bottom-2 left-1/2 h-0.5 -translate-x-1/2 rounded-full bg-[#C89B3C] transition-all duration-300 ${
                active ? "w-8" : "w-0 group-hover:w-8"
              }`}
            />
          </Link>
        );
      })}
    </nav>
  );
}