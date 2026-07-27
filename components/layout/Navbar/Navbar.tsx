"use client";

import DesktopNav from "./DesktopNav";
import MobileNav from "./MobileNav";

export default function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[#F3DFC2]/70 bg-white/85 shadow-[0_10px_40px_rgba(109,46,0,0.08)] backdrop-blur-2xl">
      <DesktopNav />

      <MobileNav />
    </header>
  );
}