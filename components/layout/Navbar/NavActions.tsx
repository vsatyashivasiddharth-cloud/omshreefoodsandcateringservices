"use client";

import Link from "next/link";
import {
  MessageCircle,
  Search,
  ShoppingCart,
} from "lucide-react";

import IconButton from "@/components/ui/IconButton";
import { useCart } from "@/context/CartContext";
import { whatsappUrl } from "@/lib/whatsapp";

export default function NavActions() {
  const { totalItems } = useCart();

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/search"
        aria-label="Search products"
        className="rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#C89B3C]/20"
      >
        <IconButton
          icon={
            <Search
              size={20}
              aria-hidden="true"
            />
          }
          variant="ghost"
          size="md"
          rounded="xl"
          aria-label="Search products"
        />
      </Link>

      <Link
        href="/cart"
        aria-label={`Shopping cart with ${totalItems} ${
          totalItems === 1 ? "item" : "items"
        }`}
        className="relative rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#C89B3C]/20"
      >
        <IconButton
          icon={
            <ShoppingCart
              size={20}
              aria-hidden="true"
            />
          }
          variant="ghost"
          size="md"
          rounded="xl"
          aria-label="Shopping cart"
        />

        {totalItems > 0 && (
          <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">
            {totalItems > 99 ? "99+" : totalItems}
          </span>
        )}
      </Link>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="hidden h-12 items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:bg-[#20BD5A] hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-[#25D366]/25 xl:inline-flex"
      >
        <MessageCircle
          size={19}
          aria-hidden="true"
        />

        WhatsApp
      </a>
    </div>
  );
}