"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart } from "lucide-react";

import { useCart } from "@/context/CartContext";

import AnnouncementBar from "../AnnouncementBar";
import DesktopNav from "./DesktopNav";
import MobileNav from "./MobileNav";

const SCROLL_HIDE_THRESHOLD = 120;

export default function Navbar() {
  const pathname = usePathname();

  const { totalItems } = useCart();

  const [visible, setVisible] =
    useState(true);

  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    lastScrollY.current =
      window.scrollY;

    function handleScroll() {
      if (ticking.current) {
        return;
      }

      ticking.current = true;

      window.requestAnimationFrame(
        () => {
          const currentScrollY =
            Math.max(
              0,
              window.scrollY,
            );

          const previousScrollY =
            lastScrollY.current;

          /*
           * Always show the navbar
           * close to the top.
           */
          if (
            currentScrollY <=
            SCROLL_HIDE_THRESHOLD
          ) {
            setVisible(true);
          } else if (
            currentScrollY <
            previousScrollY
          ) {
            /*
             * Even a tiny upward
             * movement reveals it.
             */
            setVisible(true);
          } else if (
            currentScrollY >
            previousScrollY
          ) {
            /*
             * Hide while scrolling
             * downward.
             */
            setVisible(false);
          }

          lastScrollY.current =
            currentScrollY;

          ticking.current = false;
        },
      );
    }

    window.addEventListener(
      "scroll",
      handleScroll,
      {
        passive: true,
      },
    );

    return () => {
      window.removeEventListener(
        "scroll",
        handleScroll,
      );
    };
  }, []);

  const showFloatingCart =
    totalItems > 0 &&
    pathname !== "/cart";

  return (
    <>
      <div
        className={`sticky top-0 z-50 w-full transform-gpu transition-transform duration-300 ease-out ${
          visible
            ? "translate-y-0"
            : "-translate-y-full"
        }`}
      >
        <AnnouncementBar />

        <header className="w-full bg-white shadow-sm">
          <DesktopNav />
          <MobileNav />
        </header>
      </div>

      {showFloatingCart && (
        <Link
          href="/cart"
          aria-label={`View cart with ${totalItems} ${
            totalItems === 1
              ? "item"
              : "items"
          }`}
          className="fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] right-4 z-[60] flex items-center gap-3 rounded-full bg-[#6D2E00] px-5 py-3.5 text-white shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:bg-[#8B4513] focus:outline-none focus:ring-4 focus:ring-[#C89B3C]/30 lg:hidden"
        >
          <span className="relative flex h-8 w-8 items-center justify-center">
            <ShoppingCart
              size={25}
              aria-hidden="true"
            />

            <span
              aria-hidden="true"
              className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#C89B3C] px-1 text-[11px] font-bold leading-none text-white shadow-md"
            >
              {totalItems > 99
                ? "99+"
                : totalItems}
            </span>
          </span>

          <span className="text-sm font-bold">
            View Cart
          </span>
        </Link>
      )}
    </>
  );
}