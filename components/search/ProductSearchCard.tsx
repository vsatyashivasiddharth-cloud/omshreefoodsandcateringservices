"use client";

import {
  useEffect,
  useState,
} from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ImageOff,
  PackageX,
  ShoppingBag,
  Tag,
} from "lucide-react";

import {
  Badge,
  Card,
} from "@/components/ui";
import type { SearchProduct } from "./SearchContent";

interface ProductSearchCardProps {
  product: SearchProduct;
}

export default function ProductSearchCard({
  product,
}: ProductSearchCardProps) {
  const imageUrl =
    product.image?.trim() ?? "";

  const [imageFailed, setImageFailed] =
    useState(!imageUrl);

  const inStock = product.stock > 0;
  const showPlaceholder =
    !imageUrl || imageFailed;

  useEffect(() => {
    setImageFailed(!imageUrl);
  }, [imageUrl]);

  return (
    <Card
      padding="none"
      hover
      className="group flex h-full flex-col overflow-hidden"
    >
      {/* Product image */}

      <div className="relative h-72 overflow-hidden bg-gradient-to-br from-[#FFF8EA] via-[#FFF4DE] to-[#FFE8BF]">
        {!showPlaceholder ? (
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            onError={() => {
              setImageFailed(true);
            }}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[#C89B3C]/20 bg-white/70 shadow-sm backdrop-blur-sm">
              <ImageOff
                size={34}
                className="text-[#C89B3C]"
                aria-hidden="true"
              />
            </div>

            <p className="mt-4 text-base font-semibold text-[#6D2E00]">
              Image unavailable
            </p>

            <p className="mt-1 max-w-[220px] text-sm leading-5 text-[#6D2E00]/60">
              A product image has not
              been added yet.
            </p>
          </div>
        )}

        {/* Product badges */}

        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4">
          <Badge
            variant="neutral"
            className="max-w-[70%] bg-white/95 shadow-md backdrop-blur"
          >
            <Tag
              size={16}
              className="shrink-0 text-[#C89B3C]"
              aria-hidden="true"
            />

            <span className="truncate">
              {product.category.name}
            </span>
          </Badge>

          <Badge
            variant={
              inStock
                ? "success"
                : "danger"
            }
            className="shrink-0"
          >
            {inStock
              ? "In Stock"
              : "Out of Stock"}
          </Badge>
        </div>

        {/* Out-of-stock overlay */}

        {!inStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/55 backdrop-blur-sm">
            <Badge
              variant="danger"
              size="lg"
              className="shadow-lg"
            >
              <PackageX
                size={18}
                aria-hidden="true"
              />

              <span>Out of Stock</span>
            </Badge>
          </div>
        )}
      </div>

      {/* Product content */}

      <div className="flex flex-1 flex-col p-6">
        <h3 className="line-clamp-2 min-h-[64px] text-2xl font-bold leading-8 text-[#6D2E00] transition-colors group-hover:text-[#C89B3C]">
          {product.name}
        </h3>

        <div className="mt-auto flex items-end justify-between gap-4 pt-6">
          <div className="min-w-0">
            <p className="text-sm text-gray-500">
              Starting from
            </p>

            <p className="mt-1 text-3xl font-bold text-[#C89B3C]">
              ₹
              {product.price.toLocaleString(
                "en-IN",
              )}
            </p>
          </div>

          <Link
            href={`/shop/${product.slug}`}
            aria-label={`View ${product.name}`}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#6D2E00] px-5 py-3 font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:bg-[#4E1F00] hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C89B3C] focus-visible:ring-offset-2"
          >
            <ShoppingBag
              size={18}
              aria-hidden="true"
            />

            <span>View</span>

            <ArrowRight
              size={18}
              className="transition-transform duration-300 group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Link>
        </div>
      </div>
    </Card>
  );
}