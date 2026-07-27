"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
} from "lucide-react";

import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import IconButton from "@/components/ui/IconButton";
import { useCart } from "@/context/CartContext";
import { formatCurrency } from "@/lib/shop";
import type { CartItem as CartItemType } from "@/types/cart";

interface CartItemProps {
  item: CartItemType;
}

export default function CartItem({
  item,
}: CartItemProps) {
  const {
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
  } = useCart();

  const unitPrice = Number.isFinite(
    Number(item.price),
  )
    ? Math.max(0, Number(item.price))
    : 0;

  const stock = Math.max(
    0,
    Math.floor(Number(item.stock) || 0),
  );

  const quantity = Math.max(
    1,
    Math.min(
      Math.floor(Number(item.quantity) || 1),
      Math.max(1, stock),
    ),
  );

  const subtotal = unitPrice * quantity;
  const isMin = quantity <= 1;
  const isMax = quantity >= stock;
  const productHref = `/shop/${item.slug}`;
  const image =
    item.image || "/images/no-image.jpg";

  return (
    <Card
      padding="none"
      hover
      className="group overflow-hidden"
    >
      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[150px_minmax(0,1fr)_190px] lg:gap-8">
        <Link
          href={productHref}
          aria-label={`View ${item.name}`}
          className="relative h-44 w-full overflow-hidden rounded-3xl bg-[#FFF8EE] focus:outline-none focus:ring-4 focus:ring-[#C89B3C]/20 sm:h-40 sm:w-40"
        >
          <Image
            src={image}
            alt={item.name}
            fill
            sizes="(max-width: 640px) 100vw, 160px"
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
        </Link>

        <div className="flex min-w-0 flex-col justify-between">
          <div>
            <Badge
              variant="neutral"
              size="sm"
              className="uppercase tracking-wider"
            >
              {item.category.name}
            </Badge>

            <Link
              href={productHref}
              className="inline-block rounded-lg focus:outline-none focus:ring-4 focus:ring-[#C89B3C]/20"
            >
              <h3 className="mt-3 text-2xl font-bold text-[#6D2E00] transition-colors hover:text-[#C89B3C]">
                {item.name}
              </h3>
            </Link>

            {item.description && (
              <p className="mt-3 line-clamp-2 leading-7 text-gray-600">
                {item.description}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <ShoppingBag
                  size={15}
                  aria-hidden="true"
                />

                <span>
                  {formatCurrency(unitPrice)} per item
                </span>
              </div>

              <span>
                Stock available:
                <strong className="ml-1 text-[#6D2E00]">
                  {stock}
                </strong>
              </span>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <div className="inline-flex items-center overflow-hidden rounded-2xl border border-[#F3DFC2] bg-white">
              <IconButton
                type="button"
                icon={
                  <Minus
                    size={18}
                    aria-hidden="true"
                  />
                }
                variant="ghost"
                size="sm"
                rounded="xl"
                disabled={isMin}
                onClick={() =>
                  decreaseQuantity(item.id)
                }
                aria-label={`Decrease quantity of ${item.name}`}
                className="rounded-none border-0 shadow-none hover:translate-y-0"
              />

              <div
                className="flex h-10 min-w-[56px] items-center justify-center border-x border-[#F3DFC2] px-4 text-lg font-bold text-[#6D2E00]"
                aria-live="polite"
                aria-label={`Quantity: ${quantity}`}
              >
                {quantity}
              </div>

              <IconButton
                type="button"
                icon={
                  <Plus
                    size={18}
                    aria-hidden="true"
                  />
                }
                variant="ghost"
                size="sm"
                rounded="xl"
                disabled={isMax}
                onClick={() =>
                  increaseQuantity(item.id)
                }
                aria-label={`Increase quantity of ${item.name}`}
                className="rounded-none border-0 shadow-none hover:translate-y-0"
              />
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              leftIcon={
                <Trash2
                  size={16}
                  aria-hidden="true"
                />
              }
              onClick={() =>
                removeFromCart(item.id)
              }
              className="border border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              Remove
            </Button>
          </div>

          {isMax && stock > 0 && (
            <p className="mt-4 text-sm font-medium text-amber-600">
              Maximum available quantity reached.
            </p>
          )}
        </div>

        <Card
          variant="filled"
          padding="md"
          className="flex flex-col justify-between text-left shadow-none lg:text-right"
        >
          <div>
            <p className="text-sm text-gray-500">
              Unit Price
            </p>

            <p className="mt-2 text-2xl font-bold text-[#6D2E00]">
              {formatCurrency(unitPrice)}
            </p>
          </div>

          <div
            aria-hidden="true"
            className="my-6 h-px bg-[#F3DFC2]"
          />

          <div>
            <p className="text-sm text-gray-500">
              Subtotal
            </p>

            <p className="mt-2 text-4xl font-bold text-[#C89B3C]">
              {formatCurrency(subtotal)}
            </p>
          </div>
        </Card>
      </div>
    </Card>
  );
}