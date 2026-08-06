"use client";

import {
  useMemo,
  useState,
} from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Eye,
  ShoppingCart,
  X,
} from "lucide-react";
import { toast } from "sonner";

import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { useCart } from "@/context/CartContext";
import type { Product } from "@/types/cart";
import type { ProductVariant } from "@/types/product";

interface FeaturedProduct extends Product {
  variants?: ProductVariant[];
}

interface ProductCardProps {
  product: FeaturedProduct;
}

function formatCurrency(
  value: number,
) {
  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    },
  ).format(value);
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

function normalizePrice(
  value: unknown,
) {
  const number = Number(value);

  if (
    !Number.isFinite(number) ||
    number < 0
  ) {
    return 0;
  }

  return number;
}

function getActiveVariants(
  variants:
    | ProductVariant[]
    | undefined,
) {
  return (variants ?? [])
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

function getPriceLabel(
  variants: ProductVariant[],
  fallbackPrice: number,
) {
  const prices = variants
    .map((variant) =>
      normalizePrice(
        variant.price,
      ),
    )
    .filter(
      (price) =>
        Number.isFinite(price) &&
        price >= 0,
    );

  if (prices.length === 0) {
    return formatCurrency(
      fallbackPrice,
    );
  }

  const minimum =
    Math.min(...prices);

  const maximum =
    Math.max(...prices);

  if (minimum === maximum) {
    return formatCurrency(
      minimum,
    );
  }

  return `${formatCurrency(
    minimum,
  )} – ${formatCurrency(
    maximum,
  )}`;
}

export default function ProductCard({
  product,
}: ProductCardProps) {
  const { addToCart } =
    useCart();

  const [
    pickerOpen,
    setPickerOpen,
  ] = useState(false);

  const productHref =
    `/shop/${product.slug}`;

  const activeVariants =
    useMemo(
      () =>
        getActiveVariants(
          product.variants,
        ),
      [product.variants],
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
    initialVariant?.id ??
      null,
  );

  const selectedVariant =
    activeVariants.find(
      (variant) =>
        variant.id ===
        selectedVariantId,
    ) ??
    initialVariant;

  const hasMultipleVariants =
    activeVariants.length > 1;

  const hasOneVariant =
    activeVariants.length === 1;

  const legacyPrice =
    normalizePrice(
      product.price,
    );

  const legacyStock =
    normalizeInteger(
      product.stock,
    );

  const legacyShippingWeight =
    normalizeInteger(
      product
        .shippingWeightGrams,
    );

  const selectedPrice =
    selectedVariant
      ? normalizePrice(
          selectedVariant.price,
        )
      : legacyPrice;

  const selectedStock =
    selectedVariant
      ? normalizeInteger(
          selectedVariant.stock,
        )
      : legacyStock;

  const inStock =
    hasMultipleVariants
      ? activeVariants.some(
          (variant) =>
            normalizeInteger(
              variant.stock,
            ) > 0,
        )
      : selectedStock > 0;

  const priceLabel =
    getPriceLabel(
      activeVariants,
      legacyPrice,
    );

  function addSelectedVariant() {
    const variant =
      selectedVariant;

    const stock =
      variant
        ? normalizeInteger(
            variant.stock,
          )
        : legacyStock;

    if (stock < 1) {
      toast.error(
        "This package size is currently out of stock.",
      );

      return;
    }

    const price =
      variant
        ? normalizePrice(
            variant.price,
          )
        : legacyPrice;

    const shippingWeightGrams =
      variant
        ? normalizeInteger(
            variant
              .shippingWeightGrams,
          )
        : legacyShippingWeight;

    addToCart(
      {
        id: product.id,
        name: product.name,
        slug: product.slug,

        description:
          product.description,

        price,

        image:
          product.image ||
          "/images/no-image.jpg",

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
          variant?.id ??
          null,

        variantLabel:
          variant?.label ??
          null,

        variantSku:
          variant?.sku ??
          null,

        variantWeightGrams:
          variant?.weightGrams ??
          null,
      },
      1,
    );

    toast.success(
      "Added to cart",
      {
        description:
          variant?.label
            ? `${product.name} (${variant.label}) was added successfully.`
            : `${product.name} was added successfully.`,
      },
    );

    setPickerOpen(false);
  }

  function handlePrimaryAction() {
    if (hasMultipleVariants) {
      setSelectedVariantId(
        initialVariant?.id ??
          null,
      );

      setPickerOpen(true);

      return;
    }

    addSelectedVariant();
  }

  return (
    <Card
      padding="none"
      hover
      className="group flex h-full flex-col overflow-hidden bg-white"
    >
      <div className="relative h-60 overflow-hidden bg-[#FFF8EE] sm:h-64">
        <Link
          href={productHref}
          className="absolute inset-0 focus:outline-none focus:ring-4 focus:ring-inset focus:ring-[#C89B3C]/25"
        >
          <Image
            src={
              product.image ||
              "/images/no-image.jpg"
            }
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            className="object-cover transition-transform duration-700 group-hover:scale-110"
          />

          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent"
          />

          <Badge
            variant="secondary"
            className="absolute left-4 top-4 bg-[#C89B3C] text-white shadow-md"
          >
            {
              product.category
                .name
            }
          </Badge>

          {!inStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/45">
              <span className="rounded-full bg-white px-5 py-2 text-sm font-bold text-[#6D2E00] shadow-lg">
                Out of Stock
              </span>
            </div>
          )}
        </Link>

        {pickerOpen && (
          <div className="absolute inset-0 z-20 flex flex-col bg-white/95 p-3 backdrop-blur-md">
            <button
              type="button"
              onClick={() =>
                setPickerOpen(
                  false,
                )
              }
              aria-label="Close package selector"
              className="ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-gray-600 transition hover:bg-[#FFF4DE] hover:text-[#6D2E00]"
            >
              <X
                size={15}
                aria-hidden="true"
              />

              Close
            </button>

            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#C89B3C]">
                Select Package
              </p>

              <h4 className="mt-1 line-clamp-1 text-lg font-bold text-[#6D2E00]">
                {product.name}
              </h4>

              <div className="mt-3 flex flex-wrap justify-center gap-2">
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
                        disabled={
                          !available
                        }
                        onClick={() =>
                          setSelectedVariantId(
                            variant.id,
                          )
                        }
                        className={
                          selected
                            ? "relative min-w-18 rounded-full border-2 border-[#6D2E00] bg-[#FFF4DE] px-3 py-2 text-sm font-bold text-[#6D2E00]"
                            : "min-w-18 rounded-full border border-[#E8D9BF] bg-white px-3 py-2 text-sm font-semibold text-[#6D2E00] transition hover:border-[#C89B3C] disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                        }
                      >
                        {selected && (
                          <Check
                            size={12}
                            className="absolute -right-1 -top-1 rounded-full bg-[#6D2E00] p-0.5 text-white"
                            aria-hidden="true"
                          />
                        )}

                        {
                          variant.label
                        }
                      </button>
                    );
                  },
                )}
              </div>

              <p className="mt-4 text-xl font-bold text-[#6D2E00]">
                {formatCurrency(
                  selectedPrice,
                )}
              </p>

              <p
                className={
                  selectedStock > 0
                    ? "mt-1 text-xs font-semibold text-green-700"
                    : "mt-1 text-xs font-semibold text-red-600"
                }
              >
                {selectedStock > 0
                  ? `${selectedStock} in stock`
                  : "Out of stock"}
              </p>
            </div>

            <button
              type="button"
              disabled={
                selectedStock < 1
              }
              onClick={
                addSelectedVariant
              }
              className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#6D2E00] px-5 text-sm font-semibold text-white transition hover:bg-[#4E1F00] focus:outline-none focus:ring-4 focus:ring-[#6D2E00]/20 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              <ShoppingCart
                size={16}
                aria-hidden="true"
              />

              Add to Cart
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <Link
          href={productHref}
          className="rounded-lg focus:outline-none focus:ring-4 focus:ring-[#C89B3C]/20"
        >
          <h3 className="line-clamp-2 text-lg font-bold leading-snug text-[#6D2E00] transition-colors duration-300 group-hover:text-[#C89B3C]">
            {product.name}
          </h3>
        </Link>

        {product.description && (
          <p className="mt-2 line-clamp-2 text-sm leading-5 text-gray-500">
            {
              product.description
            }
          </p>
        )}

        <div className="mt-4">
          <p className="text-xs text-gray-500">
            {hasMultipleVariants
              ? "Available sizes"
              : hasOneVariant
                ? activeVariants[0]
                    .label
                : "Price"}
          </p>

          <p className="mt-1 text-xl font-bold text-[#C89B3C]">
            {priceLabel}
          </p>
        </div>

        <p
          className={
            inStock
              ? "mt-2 text-sm font-medium text-green-700"
              : "mt-2 text-sm font-medium text-red-600"
          }
        >
          {inStock
            ? "In stock"
            : "Currently unavailable"}
        </p>

        <div className="mt-auto flex gap-3 pt-4">
          <button
            type="button"
            onClick={
              handlePrimaryAction
            }
            disabled={!inStock}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-[#6D2E00] px-5 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#4E1F00] focus:outline-none focus:ring-4 focus:ring-[#6D2E00]/20 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:hover:translate-y-0"
          >
            {!inStock
              ? "Out of Stock"
              : hasMultipleVariants
                ? "Select Options"
                : (
                  <>
                    <ShoppingCart
                      size={16}
                      aria-hidden="true"
                    />

                    Add to Cart
                  </>
                )}
          </button>

          <Link
            href={productHref}
            aria-label={`View ${product.name}`}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#E6D7BE] text-[#6D2E00] transition-all duration-300 hover:border-[#C89B3C] hover:bg-[#FFF4DE] focus:outline-none focus:ring-4 focus:ring-[#C89B3C]/20"
          >
            <Eye
              size={17}
              aria-hidden="true"
            />
          </Link>
        </div>

        <Link
          href={productHref}
          className="mt-4 inline-flex items-center gap-2 self-start rounded-lg text-sm font-semibold text-[#6D2E00] transition-colors hover:text-[#C89B3C] focus:outline-none focus:ring-4 focus:ring-[#C89B3C]/20"
        >
          View Details

          <ArrowRight
            size={15}
            aria-hidden="true"
          />
        </Link>
      </div>
    </Card>
  );
}