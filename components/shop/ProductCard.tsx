"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Eye,
  ImageOff,
  ShoppingCart,
  Star,
  X,
} from "lucide-react";
import { toast } from "sonner";

import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import IconButton from "@/components/ui/IconButton";
import { useCart } from "@/context/CartContext";
import { formatCurrency } from "@/lib/shop";
import type {
  ProductVariant,
  ProductWithCategory,
} from "@/types/product";

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
  return (
    variants ?? []
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

function getPriceLabel(
  variants: ProductVariant[],
  fallbackPrice: number,
) {
  const prices =
    variants
      .map(
        (variant) =>
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
  const cardRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  const {
    addToCart,
  } = useCart();

  const [
    pickerOpen,
    setPickerOpen,
  ] = useState(false);

  const productUrl =
    `/shop/${product.slug}`;

  const rawImage =
    product.image?.trim() ?? "";

  const cartImage =
    rawImage ||
    "/images/no-image.jpg";

  const [
    imageFailed,
    setImageFailed,
  ] = useState(!rawImage);

  useEffect(() => {
    setImageFailed(!rawImage);
  }, [rawImage]);

  const showImagePlaceholder =
    !rawImage || imageFailed;

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
    normalizeNonNegativeInteger(
      product.stock,
    );

  const legacyShippingWeight =
    normalizeNonNegativeInteger(
      product
        .shippingWeightGrams,
    );

  const displayPrice =
    selectedVariant
      ? normalizePrice(
          selectedVariant.price,
        )
      : legacyPrice;

  const displayStock =
    selectedVariant
      ? normalizeNonNegativeInteger(
          selectedVariant.stock,
        )
      : legacyStock;

  const inStock =
    hasMultipleVariants
      ? activeVariants.some(
          (variant) =>
            normalizeNonNegativeInteger(
              variant.stock,
            ) > 0,
        )
      : displayStock > 0;

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
        ? normalizeNonNegativeInteger(
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
        ? normalizeNonNegativeInteger(
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
        image: cartImage,
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

      window.requestAnimationFrame(
        () => {
          const card =
            cardRef.current;

          if (!card) {
            return;
          }

          const rect =
            card.getBoundingClientRect();

          const topOffset = 120;

          window.scrollTo({
            top:
              window.scrollY +
              rect.top -
              topOffset,
            behavior: "smooth",
          });
        },
      );

      return;
    }

    addSelectedVariant();
  }

  return (
    <Card
      hover
      padding="none"
      className="group flex h-full flex-col overflow-hidden bg-white/90 backdrop-blur-sm"
    >
      <div
        ref={cardRef}
        className="relative h-64 overflow-hidden bg-gradient-to-br from-[#FFF8EA] via-[#FFF4DE] to-[#FFE8BF] sm:h-68"
      >
        <Link
          href={productUrl}
          aria-label={`View ${product.name}`}
          className="absolute inset-0 focus:outline-none focus:ring-4 focus:ring-inset focus:ring-[#C89B3C]/25"
        >
          {!showImagePlaceholder ? (
            <>
              <Image
                src={rawImage}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                onError={() => {
                  setImageFailed(true);
                }}
              />

              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent"
              />
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[#C89B3C]/20 bg-white/75 shadow-sm backdrop-blur-sm">
                <ImageOff
                  size={34}
                  className="text-[#C89B3C]"
                  aria-hidden="true"
                />
              </div>

              <p className="mt-4 text-base font-bold text-[#6D2E00]">
                Image unavailable
              </p>

              <p className="mt-1 max-w-[220px] text-sm leading-5 text-[#6D2E00]/60">
                A product image has not
                been added yet.
              </p>
            </div>
          )}

          {product.featured && (
            <div className="absolute left-4 top-4">
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

          <div className="absolute bottom-4 left-4">
            <Badge className="bg-white/90 text-[#6D2E00] shadow-sm backdrop-blur-md">
              {
                product.category
                  .name
              }
            </Badge>
          </div>

          {!inStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/45 backdrop-blur-sm">
              <span className="rounded-full bg-white px-5 py-2 text-sm font-bold text-[#6D2E00] shadow-lg">
                Out of Stock
              </span>
            </div>
          )}
        </Link>

        {pickerOpen && (
          <div className="absolute inset-0 z-20 flex flex-col bg-white/95 p-4 backdrop-blur-md">
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

              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {activeVariants.map(
                  (variant) => {
                    const selected =
                      variant.id ===
                      selectedVariant
                        ?.id;

                    const available =
                      normalizeNonNegativeInteger(
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

              {selectedVariant && (
                <div className="mt-4">
                  <p className="text-2xl font-bold text-[#6D2E00]">
                    {formatCurrency(
                      displayPrice,
                    )}
                  </p>

                  <p
                    className={
                      displayStock > 0
                        ? "mt-1 text-xs font-semibold text-green-700"
                        : "mt-1 text-xs font-semibold text-red-600"
                    }
                  >
                    {displayStock >
                    0
                      ? `${displayStock} in stock`
                      : "Out of stock"}
                  </p>
                </div>
              )}
            </div>

            <Button
              type="button"
              fullWidth
              disabled={
                displayStock < 1
              }
              leftIcon={
                <ShoppingCart
                  size={17}
                  aria-hidden="true"
                />
              }
              onClick={
                addSelectedVariant
              }
            >
              Add to Cart
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <Link
          href={productUrl}
          className="rounded-lg focus:outline-none focus:ring-4 focus:ring-[#C89B3C]/20"
        >
          <h3 className="line-clamp-2 text-xl font-bold leading-snug text-[#6D2E00] transition-colors duration-300 group-hover:text-[#C89B3C]">
            {product.name}
          </h3>
        </Link>

        <p className="mt-3 line-clamp-2 flex-1 text-sm leading-6 text-gray-600">
          {product.description}
        </p>

        <div className="mt-5 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-gray-500">
              {hasMultipleVariants
                ? "Available sizes"
                : hasOneVariant
                  ? activeVariants[0]
                      .label
                  : "Price"}
            </p>

            <p className="mt-1 truncate text-xl font-bold text-[#6D2E00]">
              {priceLabel}
            </p>
          </div>

          <Badge
            variant={
              inStock
                ? "success"
                : "danger"
            }
            size="sm"
          >
            {inStock
              ? "In stock"
              : "Out of stock"}
          </Badge>
        </div>

        <div className="mt-5 flex gap-3">
          <Button
            type="button"
            fullWidth
            disabled={!inStock}
            leftIcon={
              hasMultipleVariants
                ? undefined
                : (
                  <ShoppingCart
                    size={18}
                    aria-hidden="true"
                  />
                )
            }
            onClick={
              handlePrimaryAction
            }
          >
            {!inStock
              ? "Out of Stock"
              : hasMultipleVariants
                ? "Select Options"
                : "Add to Cart"}
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
          className="mt-4 inline-flex items-center gap-2 self-start rounded-lg text-sm font-semibold text-[#6D2E00] transition-colors duration-300 hover:text-[#C89B3C] focus:outline-none focus:ring-4 focus:ring-[#C89B3C]/20"
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