"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ShoppingBag,
} from "lucide-react";

import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import SectionHeader from "@/components/ui/SectionHeader";
import { useCart } from "@/context/CartContext";

import CartItem from "./CartItem";
import CartSummary from "./CartSummary";
import EmptyCart from "./EmptyCart";

export default function CartPage() {
  const {
    cart,
    totalItems,
  } = useCart();

  const productCount =
    cart.length;

  const itemLabel =
    totalItems === 1
      ? "item"
      : "items";

  const productLabel =
    productCount === 1
      ? "cart line"
      : "cart lines";

  if (productCount === 0) {
    return <EmptyCart />;
  }

  return (
    <section className="space-y-10 md:space-y-12">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <SectionHeader
          badge={
            <Badge
              variant="neutral"
              className="gap-2"
            >
              <ShoppingBag
                size={18}
                aria-hidden="true"
              />

              Shopping Cart
            </Badge>
          }
          title="Review Your Order"
          description="Check your selected products and package sizes, adjust quantities and proceed securely to checkout."
          align="left"
          className="max-w-3xl"
        />

        <Link
          href="/shop"
          className="inline-flex h-12 items-center justify-center gap-2 self-start rounded-full border-2 border-[#6D2E00] bg-transparent px-6 text-base font-semibold text-[#6D2E00] transition-all duration-300 hover:-translate-y-1 hover:bg-[#6D2E00] hover:text-white focus:outline-none focus:ring-4 focus:ring-[#C89B3C]/20"
        >
          <ArrowLeft
            size={18}
            aria-hidden="true"
          />

          Continue Shopping
        </Link>
      </div>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_380px] xl:gap-10">
        <Card
          padding="md"
          className="min-w-0"
        >
          <div className="mb-6 flex flex-col gap-3 border-b border-[#F3DFC2] pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#6D2E00]">
                Cart Items
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {productCount}{" "}
                {productLabel} in
                your cart
              </p>
            </div>

            <Badge
              variant="secondary"
              size="sm"
            >
              {totalItems}{" "}
              {itemLabel}
            </Badge>
          </div>

          <div className="space-y-6">
            {cart.map(
              (item) => (
                <CartItem
                  key={
                    item.lineId
                  }
                  item={item}
                />
              ),
            )}
          </div>
        </Card>

        <aside className="xl:sticky xl:top-28 xl:self-start">
          <CartSummary />
        </aside>
      </div>
    </section>
  );
}