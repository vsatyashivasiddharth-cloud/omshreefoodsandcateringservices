"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
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
import type {
  ProductVariant,
  ProductWithCategory,
} from "@/types/product";

interface ProductActionsProps {
  product: ProductWithCategory;
}

function normalizeInteger(
  value: unknown,
) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.max(
    0,
    Math.floor(number),
  );
}

function getActiveVariants(
  product: ProductWithCategory,
) {
  return (
    product.variants ?? []
  )
    .filter(
      (variant) =>
        variant.isActive,
    )
    .sort(
      (first, second) =>
        first.sortOrder -
          second.sortOrder ||
        first.weightGrams -
          second.weightGrams,
    );
}

function getInitialVariant(
  variants: ProductVariant[],
) {
  return (
    variants.find(
      (variant) =>
        variant.isDefault,
    ) ??
    variants[0] ??
    null
  );
}

export default function ProductActions({
  product,
}: ProductActionsProps) {
  const router = useRouter();
  const { addToCart } =
    useCart();

  const activeVariants =
    useMemo(
      () =>
        getActiveVariants(
          product,
        ),
      [product],
    );

  const initialVariant =
    useMemo(
      () =>
        getInitialVariant(
          activeVariants,
        ),
      [activeVariants],
    );

  const [
    selectedVariantId,
    setSelectedVariantId,
  ] = useState<string | null>(
    initialVariant?.id ?? null,
  );

  const [quantity, setQuantity] =
    useState(1);

  useEffect(() => {
    setSelectedVariantId(
      initialVariant?.id ?? null,
    );

    setQuantity(1);
  }, [
    initialVariant?.id,
  ]);

  const selectedVariant =
    activeVariants.find(
      (variant) =>
        variant.id ===
        selectedVariantId,
    ) ??
    initialVariant;

  const price =
    selectedVariant
      ? Number(
          selectedVariant.price,
        )
      : Number(product.price);

  const normalizedPrice =
    Number.isFinite(price) &&
    price >= 0
      ? price
      : 0;

  const stock =
    selectedVariant
      ? normalizeInteger(
          selectedVariant.stock,
        )
      : normalizeInteger(
          product.stock,
        );

  const shippingWeightGrams =
    selectedVariant
      ? normalizeInteger(
          selectedVariant
            .shippingWeightGrams,
        )
      : normalizeInteger(
          product
            .shippingWeightGrams,
        );

  const inStock =
    stock > 0;

  const isMinimumQuantity =
    quantity <= 1;

  const isMaximumQuantity =
    quantity >= stock;

  const image =
    product.image ||
    "/images/no-image.jpg";

  const subtotal =
    normalizedPrice * quantity;

  function handleVariantChange(
    variantId: string,
  ) {
    setSelectedVariantId(
      variantId,
    );

    setQuantity(1);
  }

  function decreaseQuantity() {
    setQuantity(
      (currentQuantity) =>
        Math.max(
          1,
          currentQuantity - 1,
        ),
    );
  }

  function increaseQuantity() {
    setQuantity(
      (currentQuantity) =>
        Math.min(
          stock,
          currentQuantity + 1,
        ),
    );
  }

  function addProductToCart() {
    if (!inStock) {
      toast.error(
        "This package size is currently out of stock.",
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

        price:
          normalizedPrice,

        image,
        stock,

        featured:
          product.featured,

        shippingWeightGrams,

        categoryId:
          product.categoryId,

        category: {
          id:
            product.category.id,

          name:
            product.category.name,

          slug:
            product.category.slug,

          image:
            product.category.image,
        },

        variantId:
          selectedVariant?.id ??
          null,

        variantLabel:
          selectedVariant?.label ??
          null,

        variantSku:
          selectedVariant?.sku ??
          null,

        variantWeightGrams:
          selectedVariant
            ?.weightGrams ??
          null,
      },
      quantity,
    );

    const variantDescription =
      selectedVariant?.label
        ? ` (${selectedVariant.label})`
        : "";

    toast.success(
      "Added to cart",
      {
        description:
          `${quantity} × ${product.name}${variantDescription} added successfully.`,
      },
    );

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
    <div className="mt-8 space-y-8">
      <div className="flex flex-wrap items-end gap-4">
        <span className="text-4xl font-extrabold tracking-tight text-[#6D2E00] sm:text-5xl">
          {formatCurrency(
            normalizedPrice,
          )}
        </span>

        <span className="pb-2 text-sm text-gray-500">
          Inclusive of applicable
          taxes
        </span>
      </div>

      {activeVariants.length >
        0 && (
        <fieldset>
          <legend className="text-lg font-semibold text-[#6D2E00]">
            Select Weight
          </legend>

          <div className="mt-4 flex flex-wrap gap-3">
            {activeVariants.map(
              (variant) => {
                const selected =
                  variant.id ===
                  selectedVariant
                    ?.id;

                const available =
                  normalizeInteger(
                    variant.stock,
                  ) > 0;

                return (
                  <button
                    key={
                      variant.id
                    }
                    type="button"
                    onClick={() =>
                      handleVariantChange(
                        variant.id,
                      )
                    }
                    aria-pressed={
                      selected
                    }
                    className={
                      selected
                        ? "rounded-2xl border-2 border-[#6D2E00] bg-[#FFF4DE] px-5 py-3 font-bold text-[#6D2E00] shadow-sm"
                        : "rounded-2xl border border-[#E8D9BF] bg-white px-5 py-3 font-semibold text-[#6D2E00] transition hover:border-[#C89B3C]"
                    }
                  >
                    <span className="block">
                      {
                        variant.label
                      }
                    </span>

                    <span
                      className={
                        available
                          ? "mt-1 block text-xs font-normal text-green-700"
                          : "mt-1 block text-xs font-normal text-red-600"
                      }
                    >
                      {available
                        ? formatCurrency(
                            Number(
                              variant.price,
                            ),
                          )
                        : "Out of stock"}
                    </span>
                  </button>
                );
              },
            )}
          </div>
        </fieldset>
      )}

      <div>
        <span
          className={`inline-flex items-center gap-2 rounded-full px-5 py-2 font-semibold ${
            inStock
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          <span
            aria-hidden="true"
            className={`h-2.5 w-2.5 rounded-full ${
              inStock
                ? "bg-green-500"
                : "bg-red-500"
            }`}
          />

          {inStock
            ? `${stock} in stock`
            : "Out of stock"}
        </span>
      </div>

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
              onClick={
                decreaseQuantity
              }
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
              onClick={
                increaseQuantity
              }
              disabled={
                !inStock ||
                isMaximumQuantity
              }
              className="rounded-none border-0 shadow-none hover:translate-y-0"
              aria-label={`Increase quantity of ${product.name}`}
            />
          </div>

          <p className="mt-3 text-sm text-gray-500">
            Packed weight per unit:{" "}
            <span className="font-semibold text-[#6D2E00]">
              {
                shippingWeightGrams
              }{" "}
              g
            </span>
          </p>
        </div>

        {inStock && (
          <div className="rounded-2xl bg-[#FFF8EE] px-5 py-4 sm:text-right">
            <p className="text-sm text-gray-500">
              Selected subtotal
            </p>

            <p className="mt-1 text-2xl font-bold text-[#C89B3C]">
              {formatCurrency(
                subtotal,
              )}
            </p>
          </div>
        )}
      </div>

      {isMaximumQuantity &&
        inStock && (
          <p className="text-sm font-medium text-amber-600">
            Maximum available
            quantity reached.
          </p>
        )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Button
          type="button"
          onClick={
            addProductToCart
          }
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
                Freshly packed and
                dispatched quickly.
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
                Safe and reliable
                ordering experience.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}