"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Eye,
  ShoppingCart,
  Star,
} from "lucide-react";
import { toast } from "sonner";

import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import IconButton from "@/components/ui/IconButton";
import { useCart } from "@/context/CartContext";
import { formatCurrency } from "@/lib/shop";
import type { ProductWithCategory } from "@/types/product";

interface ProductCardProps {
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

export default function ProductCard({
  product,
}: ProductCardProps) {
  const { addToCart } = useCart();

  const productUrl =
    `/shop/${product.slug}`;

  const image =
    product.image ||
    "/images/no-image.jpg";

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

  function handleAddToCart() {
    if (!inStock) {
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
      1,
    );

    toast.success("Added to cart", {
      description: `${product.name} was added successfully.`,
    });
  }

  return (
    <Card
      hover
      padding="none"
      className="group flex h-full flex-col overflow-hidden bg-white/90 backdrop-blur-sm"
    >
      <Link
        href={productUrl}
        aria-label={`View ${product.name}`}
        className="relative block h-80 overflow-hidden bg-[#FFF8EE] focus:outline-none focus:ring-4 focus:ring-inset focus:ring-[#C89B3C]/25"
      >
        <Image
          src={image}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />

        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent"
        />

        {product.featured && (
          <div className="absolute left-5 top-5">
            <Badge
              variant="secondary"
              className="gap-1 shadow-lg"
            >
              <Star
                size={12}
                fill="currentColor"
                aria-hidden="true"
              />

              Featured
            </Badge>
          </div>
        )}

        <div className="absolute bottom-5 left-5">
          <Badge className="bg-white/90 text-[#6D2E00] backdrop-blur-md">
            {product.category.name}
          </Badge>
        </div>

        {!inStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/45">
            <span className="rounded-full bg-white px-5 py-2 text-sm font-bold text-[#6D2E00] shadow-lg">
              Out of Stock
            </span>
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-7">
        <Link
          href={productUrl}
          className="rounded-lg focus:outline-none focus:ring-4 focus:ring-[#C89B3C]/20"
        >
          <h3 className="line-clamp-2 text-2xl font-bold text-[#6D2E00] transition-colors duration-300 group-hover:text-[#C89B3C]">
            {product.name}
          </h3>
        </Link>

        <p className="mt-4 line-clamp-3 flex-1 leading-7 text-gray-600">
          {product.description}
        </p>

        <div className="mt-7 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500">
              Starting from
            </p>

            <p className="mt-1 text-3xl font-bold text-[#6D2E00]">
              {formatCurrency(price)}
            </p>
          </div>

          <Badge
            variant={
              inStock
                ? "success"
                : "danger"
            }
          >
            {inStock
              ? `${stock} in stock`
              : "Out of stock"}
          </Badge>
        </div>

        <div className="mt-7 flex gap-3">
          <Button
            type="button"
            fullWidth
            disabled={!inStock}
            leftIcon={
              <ShoppingCart
                size={18}
                aria-hidden="true"
              />
            }
            onClick={handleAddToCart}
          >
            {inStock
              ? "Add to Cart"
              : "Out of Stock"}
          </Button>

          <Link
            href={productUrl}
            aria-label={`View ${product.name}`}
            className="shrink-0"
          >
            <IconButton
              icon={
                <Eye
                  size={18}
                  aria-hidden="true"
                />
              }
              variant="outline"
              aria-label={`View ${product.name}`}
            />
          </Link>
        </div>

        <Link
          href={productUrl}
          className="mt-6 inline-flex items-center gap-2 self-start rounded-lg text-sm font-semibold text-[#6D2E00] transition-colors duration-300 hover:text-[#C89B3C] focus:outline-none focus:ring-4 focus:ring-[#C89B3C]/20"
        >
          View Details

          <ArrowRight
            size={16}
            className="transition-transform duration-300 group-hover:translate-x-1"
            aria-hidden="true"
          />
        </Link>
      </div>
    </Card>
  );
}