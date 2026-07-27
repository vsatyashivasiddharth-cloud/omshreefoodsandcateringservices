"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  AlertCircle,
  RefreshCw,
  Sparkles,
} from "lucide-react";

import type { ProductWithCategory } from "@/types/product";

import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import SectionHeader from "@/components/ui/SectionHeader";
import Spinner from "@/components/ui/Spinner";

import ProductCard from "./ProductCard";

interface RelatedProductsProps {
  productId: string;
}

interface ApiError {
  error?: string;
  message?: string;
}

interface RawRelatedProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: unknown;
  image: string | null;
  stock: unknown;
  featured: boolean;
  shippingWeightGrams: unknown;
  categoryId: string;
  category: {
    id: string;
    name: string;
    slug: string;
    image?: string | null;
  };
  createdAt?: string;
  updatedAt?: string;
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function isRawRelatedProduct(
  value: unknown,
): value is RawRelatedProduct {
  if (!isRecord(value)) {
    return false;
  }

  const category = value.category;

  if (!isRecord(category)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.slug === "string" &&
    typeof value.description === "string" &&
    typeof value.featured === "boolean" &&
    typeof value.categoryId === "string" &&
    typeof category.id === "string" &&
    typeof category.name === "string" &&
    typeof category.slug === "string"
  );
}

function normalizeNonNegativeNumber(
  value: unknown,
) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.max(0, number);
}

function normalizeNonNegativeInteger(
  value: unknown,
) {
  return Math.floor(
    normalizeNonNegativeNumber(value),
  );
}

function normalizeProduct(
  product: RawRelatedProduct,
): ProductWithCategory {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: normalizeNonNegativeNumber(
      product.price,
    ),
    image:
      product.image ||
      "/images/no-image.jpg",
    stock: normalizeNonNegativeInteger(
      product.stock,
    ),
    featured: product.featured,
    shippingWeightGrams:
      normalizeNonNegativeInteger(
        product.shippingWeightGrams,
      ),
    categoryId: product.categoryId,
    category: {
      id: product.category.id,
      name: product.category.name,
      slug: product.category.slug,
      image: product.category.image,
    },
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

export default function RelatedProducts({
  productId,
}: RelatedProductsProps) {
  const [products, setProducts] = useState<
    ProductWithCategory[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const loadProducts = useCallback(
    async (signal?: AbortSignal) => {
      const normalizedProductId =
        productId.trim();

      if (!normalizedProductId) {
        setProducts([]);
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/products/${encodeURIComponent(
            normalizedProductId,
          )}/related`,
          {
            method: "GET",
            cache: "no-store",
            signal,
          },
        );

        const data: unknown = await response
          .json()
          .catch(() => null);

        if (!response.ok) {
          const apiError =
            isRecord(data)
              ? (data as ApiError)
              : null;

          throw new Error(
            apiError?.error ||
              apiError?.message ||
              "Failed to fetch related products.",
          );
        }

        if (!Array.isArray(data)) {
          throw new Error(
            "The related products response was invalid.",
          );
        }

        setProducts(
          data
            .filter(isRawRelatedProduct)
            .map(normalizeProduct),
        );
      } catch (loadError) {
        if (
          loadError instanceof DOMException &&
          loadError.name === "AbortError"
        ) {
          return;
        }

        console.error(
          "Failed to load related products:",
          loadError,
        );

        setProducts([]);

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load related products.",
        );
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [productId],
  );

  useEffect(() => {
    const controller =
      new AbortController();

    void loadProducts(controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadProducts]);

  if (loading) {
    return (
      <section className="mt-24">
        <div className="mb-12 text-center">
          <Badge
            variant="secondary"
            className="inline-flex items-center gap-2 px-5 py-2"
          >
            <Sparkles
              size={16}
              aria-hidden="true"
            />

            Recommended For You
          </Badge>

          <div className="mt-5">
            <SectionHeader
              title="You May Also Like"
              description="Finding similar homemade favourites..."
              align="center"
            />
          </div>
        </div>

        <div className="flex justify-center py-20">
          <Spinner
            size="lg"
            text="Loading products..."
          />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mt-24">
        <Card
          variant="outlined"
          padding="lg"
          className="mx-auto max-w-xl text-center"
        >
          <AlertCircle
            size={42}
            className="mx-auto text-[#C89B3C]"
            aria-hidden="true"
          />

          <h2 className="mt-4 text-2xl font-bold text-[#6D2E00]">
            Recommendations Unavailable
          </h2>

          <p className="mt-2 text-gray-600">
            {error}
          </p>

          <Button
            type="button"
            variant="outline"
            leftIcon={
              <RefreshCw
                size={17}
                aria-hidden="true"
              />
            }
            className="mt-6"
            onClick={() =>
              void loadProducts()
            }
          >
            Try Again
          </Button>
        </Card>
      </section>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="relative mt-28">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-10 h-56 w-56 rounded-full bg-[#FFF4DE]/60 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 h-56 w-56 rounded-full bg-[#F8E7C5]/50 blur-3xl"
      />

      <div className="relative mb-14 text-center">
        <Badge
          variant="secondary"
          className="inline-flex items-center gap-2 px-5 py-2"
        >
          <Sparkles
            size={16}
            aria-hidden="true"
          />

          Handpicked Selection
        </Badge>

        <div className="mt-5">
          <SectionHeader
            title="You May Also Like"
            description="Explore more authentic homemade snacks, sweets and delicacies carefully selected for you."
            align="center"
          />
        </div>
      </div>

      <div className="relative grid gap-8 md:grid-cols-2 xl:grid-cols-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
          />
        ))}
      </div>
    </section>
  );
}