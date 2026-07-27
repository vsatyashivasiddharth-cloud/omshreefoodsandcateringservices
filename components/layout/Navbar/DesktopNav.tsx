"use client";

import Container from "@/components/ui/Container";

import Logo from "./Logo";
import NavActions from "./NavActions";
import NavLinks from "./NavLinks";

export default function DesktopNav() {
  return (
    <nav
      aria-label="Primary navigation"
      className="hidden h-24 lg:block"
    >
      <Container className="flex h-full items-center justify-between gap-8">
        <Logo />

        <NavLinks />

        <NavActions />
      </Container>
    </nav>
  );
}