"use client";

import AnnouncementBar from "../AnnouncementBar";

import DesktopNav from "./DesktopNav";
import MobileNav from "./MobileNav";

export default function Navbar() {
  return (
    <>
      <AnnouncementBar />

      <header className="relative z-50 w-full bg-white">
        <DesktopNav />

        <MobileNav />
      </header>
    </>
  );
}