"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Minus,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Truck,
} from "lucide-react";
import { toast } from "sonner";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import IconButton from "@/components/ui/IconButton";
import { useCart } from "@/context/CartContext";
import { formatCurrency } from "@/lib/shop";
import type { ProductWithCategory } from "@/types/product";

interface ProductActionsProps {
  product: ProductWithCategory;
}

function normalizeNonNegativeInteger(
  value: unknown,
) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.max(0, Math.floor(number));
}

export default function ProductActions({
  product,
}: ProductActionsProps) {
  const router = useRouter();
  const { addToCart } = useCart();

  const [quantity, setQuantity] =
    useState(1);

  const rawPrice = Number(product.price);

  const price =
    Number.isFinite(rawPrice) &&
    rawPrice >= 0
      ? rawPrice
      : 0;

  const stock =
    normalizeNonNegativeInteger(
      product.stock,
    );

  const shippingWeightGrams =
    normalizeNonNegativeInteger(
      product.shippingWeightGrams,
    );

  const inStock = stock > 0;
  const isMinimumQuantity =
    quantity <= 1;
  const isMaximumQuantity =
    quantity >= stock;

  const image =
    product.image ||
    "/images/no-image.jpg";

  const subtotal = price * quantity;

  function decreaseQuantity() {
    setQuantity((currentQuantity) =>
      Math.max(
        1,
        currentQuantity - 1,
      ),
    );
  }

  function increaseQuantity() {
    setQuantity((currentQuantity) =>
      Math.min(
        stock,
        currentQuantity + 1,
      ),
    );
  }

  function addProductToCart() {
    if (!inStock) {
      toast.error(
        "This product is currently out of stock.",
      );

      return false;
    }

    addToCart(
      {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description:
          product.description,
        price,
        image,
        stock,
        featured: product.featured,
        shippingWeightGrams,
        categoryId:
          product.categoryId,
        category: {
          id: product.category.id,
          name: product.category.name,
          slug:
            product.category.slug,
          image:
            product.category.image,
        },
      },
      quantity,
    );

    toast.success("Added to cart", {
      description: `${quantity} × ${product.name} added successfully.`,
    });

    return true;
  }

  function handleBuyNow() {
    const added =
      addProductToCart();

    if (added) {
      router.push("/cart");
    }
  }

  return (
    <div className="mt-10 space-y-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-4 text-lg font-semibold text-[#6D2E00]">
            Select Quantity
          </p>

          <div className="inline-flex items-center overflow-hidden rounded-2xl border border-[#E8D9BF] bg-white shadow-sm">
            <IconButton
              type="button"
              icon={
                <Minus
                  size={18}
                  aria-hidden="true"
                />
              }
              variant="ghost"
              rounded="xl"
              size="md"
              onClick={decreaseQuantity}
              disabled={
                !inStock ||
                isMinimumQuantity
              }
              className="rounded-none border-0 shadow-none hover:translate-y-0"
              aria-label={`Decrease quantity of ${product.name}`}
            />

            <div
              className="flex h-12 min-w-[70px] items-center justify-center border-x border-[#E8D9BF] px-4 text-xl font-bold text-[#6D2E00]"
              aria-live="polite"
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
              rounded="xl"
              size="md"
              onClick={increaseQuantity}
              disabled={
                !inStock ||
                isMaximumQuantity
              }
              className="rounded-none border-0 shadow-none hover:translate-y-0"
              aria-label={`Increase quantity of ${product.name}`}
            />
          </div>

          <p className="mt-3 text-sm text-gray-500">
            Available stock{" "}
            <span
              className={
                inStock
                  ? "font-semibold text-[#6D2E00]"
                  : "font-semibold text-red-600"
              }
            >
              {stock}
            </span>
          </p>
        </div>

        {inStock && (
          <div className="rounded-2xl bg-[#FFF8EE] px-5 py-4 sm:text-right">
            <p className="text-sm text-gray-500">
              Selected subtotal
            </p>

            <p className="mt-1 text-2xl font-bold text-[#C89B3C]">
              {formatCurrency(subtotal)}
            </p>
          </div>
        )}
      </div>

      {isMaximumQuantity &&
        inStock && (
          <p className="text-sm font-medium text-amber-600">
            Maximum available quantity
            reached.
          </p>
        )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Button
          type="button"
          onClick={addProductToCart}
          disabled={!inStock}
          leftIcon={
            <ShoppingCart
              size={20}
              aria-hidden="true"
            />
          }
          fullWidth
        >
          {inStock
            ? "Add to Cart"
            : "Out of Stock"}
        </Button>

        <Button
          type="button"
          variant="outline"
          disabled={!inStock}
          onClick={handleBuyNow}
          fullWidth
        >
          Buy Now
        </Button>
      </div>

      <Card padding="md">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FFF4DE]">
              <Truck
                size={22}
                className="text-[#C89B3C]"
                aria-hidden="true"
              />
            </div>

            <div>
              <p className="font-semibold text-[#6D2E00]">
                Fast Delivery
              </p>

              <p className="text-sm leading-6 text-gray-500">
                Freshly packed and dispatched
                quickly.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EEF9F0]">
              <ShieldCheck
                size={22}
                className="text-green-600"
                aria-hidden="true"
              />
            </div>

            <div>
              <p className="font-semibold text-[#6D2E00]">
                Secure Checkout
              </p>

              <p className="text-sm leading-6 text-gray-500">
                Safe and reliable ordering
                experience.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}