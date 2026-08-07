import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  PackageSearch,
  Scale,
} from "lucide-react";

import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";

export interface LowStockProduct {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  stock: number;
  price: number;

  variantId: string | null;
  variantLabel: string | null;
  variantWeightGrams: number | null;
  shippingWeightGrams: number | null;

  activeVariantCount: number;
  lowStockVariantCount: number;
}

interface LowStockProductsProps {
  products: LowStockProduct[];
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

function formatWeight(
  weightGrams:
    | number
    | null,
) {
  if (
    weightGrams === null ||
    !Number.isFinite(
      weightGrams,
    ) ||
    weightGrams <= 0
  ) {
    return null;
  }

  if (
    weightGrams >= 1000
  ) {
    const kilograms =
      weightGrams / 1000;

    return `${kilograms.toLocaleString(
      "en-IN",
      {
        maximumFractionDigits:
          2,
      },
    )} kg`;
  }

  return `${weightGrams.toLocaleString(
    "en-IN",
  )} g`;
}

export default function LowStockProducts({
  products,
}: LowStockProductsProps) {
  if (
    products.length === 0
  ) {
    return (
      <Card
        padding="lg"
        className="bg-white/95 shadow-xl backdrop-blur-sm"
      >
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-green-600">
            <PackageSearch
              size={26}
              aria-hidden="true"
            />
          </div>

          <h2 className="mt-4 text-xl font-bold text-[#6D2E00]">
            Stock Levels Look Good
          </h2>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            No active product
            variants currently have
            5 or fewer units in
            stock.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card
      padding="lg"
      className="bg-white/95 shadow-xl backdrop-blur-sm"
    >
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
              <AlertTriangle
                size={22}
                aria-hidden="true"
              />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-[#6D2E00]">
                Low Stock
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Active variants with
                5 or fewer units
                remaining.
              </p>
            </div>
          </div>
        </div>

        <Badge
          variant="warning"
          rounded
        >
          {products.length}{" "}
          {products.length === 1
            ? "Product"
            : "Products"}
        </Badge>
      </div>

      <div className="space-y-3">
        {products.map(
          (product) => {
            const weightLabel =
              formatWeight(
                product.variantWeightGrams,
              );

            const packedWeight =
              formatWeight(
                product.shippingWeightGrams,
              );

            const outOfStock =
              product.stock <= 0;

            return (
              <Link
                key={`${product.id}-${product.variantId ?? "legacy"}`}
                href={`/shop/${product.slug}`}
                className="group block rounded-2xl border border-[#F3DFC2] bg-[#FFFDF8] p-4 transition hover:border-[#C89B3C] hover:bg-white hover:shadow-sm focus:outline-none focus:ring-4 focus:ring-[#C89B3C]/20"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-[#6D2E00]">
                        {product.name}
                      </h3>

                      {product.variantLabel && (
                        <Badge
                          variant="secondary"
                          size="sm"
                        >
                          {
                            product.variantLabel
                          }
                        </Badge>
                      )}

                      {weightLabel &&
                        product.variantLabel !==
                          weightLabel && (
                          <Badge
                            variant="neutral"
                            size="sm"
                          >
                            <Scale
                              size={13}
                              aria-hidden="true"
                            />

                            {
                              weightLabel
                            }
                          </Badge>
                        )}
                    </div>

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-500">
                      <span>
                        {formatCurrency(
                          product.price,
                        )}
                      </span>

                      {packedWeight && (
                        <span>
                          Packed weight:{" "}
                          <strong className="text-[#6D2E00]">
                            {
                              packedWeight
                            }
                          </strong>
                        </span>
                      )}

                      {product.lowStockVariantCount >
                        1 && (
                        <span>
                          {
                            product.lowStockVariantCount
                          }{" "}
                          low-stock
                          variants
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <Badge
                      variant={
                        outOfStock
                          ? "danger"
                          : "warning"
                      }
                      rounded
                    >
                      {outOfStock
                        ? "Out of stock"
                        : `${product.stock} left`}
                    </Badge>

                    <span
                      aria-hidden="true"
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FFF4DE] text-[#6D2E00] transition group-hover:translate-x-1 group-hover:bg-[#6D2E00] group-hover:text-white"
                    >
                      <ArrowRight
                        size={17}
                      />
                    </span>
                  </div>
                </div>
              </Link>
            );
          },
        )}
      </div>
    </Card>
  );
}