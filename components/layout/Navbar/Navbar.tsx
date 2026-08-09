"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import AnnouncementBar from "../AnnouncementBar";
import DesktopNav from "./DesktopNav";
import MobileNav from "./MobileNav";

const SCROLL_HIDE_THRESHOLD = 120;

export default function Navbar() {
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
           * close to the top of the page.
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
             * Any upward movement,
             * even by 1px, immediately
             * reveals the navbar.
             */
            setVisible(true);
          } else if (
            currentScrollY >
            previousScrollY
          ) {
            /*
             * Hide while continuing
             * to scroll downward.
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

  return (
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
  );
}