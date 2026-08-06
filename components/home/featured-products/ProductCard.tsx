"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Eye,
  ShoppingCart,
} from "lucide-react";
import { toast } from "sonner";

import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { useCart } from "@/context/CartContext";
import type {
  Product,
} from "@/types/cart";
import type {
  ProductVariant,
} from "@/types/product";

interface FeaturedProduct
  extends Product {
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

function getDefaultVariant(
  variants:
    | ProductVariant[]
    | undefined,
) {
  const activeVariants =
    (variants ?? []).filter(
      (variant) =>
        variant.isActive,
    );

  return (
    activeVariants.find(
      (variant) =>
        variant.isDefault,
    ) ??
    activeVariants[0] ??
    null
  );
}

export default function ProductCard({
  product,
}: ProductCardProps) {
  const { addToCart } =
    useCart();

  const productHref =
    `/shop/${product.slug}`;

  const defaultVariant =
    getDefaultVariant(
      product.variants,
    );

  const price =
    defaultVariant
      ? normalizePrice(
          defaultVariant.price,
        )
      : normalizePrice(
          product.price,
        );

  const stock =
    defaultVariant
      ? normalizeInteger(
          defaultVariant.stock,
        )
      : normalizeInteger(
          product.stock,
        );

  const shippingWeightGrams =
    defaultVariant
      ? normalizeInteger(
          defaultVariant
            .shippingWeightGrams,
        )
      : normalizeInteger(
          product
            .shippingWeightGrams,
        );

  const isOutOfStock =
    stock <= 0;

  function handleAddToCart() {
    if (isOutOfStock) {
      toast.error(
        "This product is currently out of stock.",
      );

      return;
    }

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
          defaultVariant?.id ??
          null,

        variantLabel:
          defaultVariant?.label ??
          null,

        variantSku:
          defaultVariant?.sku ??
          null,

        variantWeightGrams:
          defaultVariant
            ?.weightGrams ??
          null,
      },
      1,
    );

    const variantText =
      defaultVariant?.label
        ? ` (${defaultVariant.label})`
        : "";

    toast.success(
      "Added to cart",
      {
        description:
          `${product.name}${variantText} was added successfully.`,
      },
    );
  }

  return (
    <Card
      padding="none"
      hover
      className="group flex h-full flex-col overflow-hidden bg-white"
    >
      <Link
        href={productHref}
        className="relative block h-72 overflow-hidden bg-[#FFF8EE] focus:outline-none focus:ring-4 focus:ring-inset focus:ring-[#C89B3C]/25"
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
          className="absolute left-5 top-5 bg-[#C89B3C] text-white shadow-md"
        >
          {
            product.category
              .name
          }
        </Badge>

        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/45">
            <span className="rounded-full bg-white px-5 py-2 text-sm font-bold text-[#6D2E00] shadow-lg">
              Out of Stock
            </span>
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-6">
        <Link
          href={productHref}
          className="rounded-lg focus:outline-none focus:ring-4 focus:ring-[#C89B3C]/20"
        >
          <h3 className="line-clamp-2 text-xl font-bold text-[#6D2E00] transition-colors duration-300 group-hover:text-[#C89B3C]">
            {product.name}
          </h3>
        </Link>

        {product.description && (
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-gray-500">
            {
              product.description
            }
          </p>
        )}

        <div className="mt-5">
          <p className="text-sm text-gray-500">
            {defaultVariant
              ? `Default: ${defaultVariant.label}`
              : "Starting from"}
          </p>

          <p className="mt-1 text-3xl font-bold text-[#C89B3C]">
            {formatCurrency(
              price,
            )}
          </p>
        </div>

        <p
          className={
            isOutOfStock
              ? "mt-3 text-sm font-medium text-red-600"
              : "mt-3 text-sm font-medium text-green-700"
          }
        >
          {isOutOfStock
            ? "Currently unavailable"
            : `${stock} available`}
        </p>

        <div className="mt-auto flex gap-3 pt-6">
          <button
            type="button"
            onClick={
              handleAddToCart
            }
            disabled={
              isOutOfStock
            }
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[#6D2E00] px-5 font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#4E1F00] focus:outline-none focus:ring-4 focus:ring-[#6D2E00]/20 active:scale-95 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 disabled:hover:translate-y-0"
          >
            <ShoppingCart
              size={18}
              aria-hidden="true"
            />

            {isOutOfStock
              ? "Out of Stock"
              : defaultVariant
                ? `Add ${defaultVariant.label}`
                : "Add to Cart"}
          </button>

          <Link
            href={
              productHref
            }
            aria-label={`View ${product.name}`}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#E6D7BE] text-[#6D2E00] transition-all duration-300 hover:border-[#C89B3C] hover:bg-[#FFF4DE] focus:outline-none focus:ring-4 focus:ring-[#C89B3C]/20"
          >
            <Eye
              size={18}
              aria-hidden="true"
            />
          </Link>
        </div>

        <Link
          href={productHref}
          className="mt-5 inline-flex items-center gap-2 self-start rounded-lg text-sm font-semibold text-[#6D2E00] transition-colors hover:text-[#C89B3C] focus:outline-none focus:ring-4 focus:ring-[#C89B3C]/20"
        >
          Choose Package Size

          <ArrowRight
            size={16}
            aria-hidden="true"
          />
        </Link>
      </div>
    </Card>
  );
}