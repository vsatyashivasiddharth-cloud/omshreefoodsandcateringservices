import Link from "next/link";
import { ChevronRight } from "lucide-react";

const links = [
  { name: "Home", href: "/" },
  { name: "Shop", href: "/shop" },
  { name: "Categories", href: "/categories" },
  { name: "Catering", href: "/catering" },
  { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" },
];

export default function FooterLinks() {
  return (
    <div>
      <h3 className="text-xl font-bold text-white sm:text-2xl">
        Quick Links
      </h3>

      <ul className="mt-6 space-y-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="group inline-flex items-center gap-3 rounded-lg py-1 text-white/70 transition-all duration-300 hover:translate-x-1 hover:text-[#FFE4A3] focus:outline-none focus:ring-4 focus:ring-[#C89B3C]/20"
            >
              <ChevronRight
                size={16}
                className="shrink-0 transition-transform duration-300 group-hover:translate-x-1"
                aria-hidden="true"
              />

              {link.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}