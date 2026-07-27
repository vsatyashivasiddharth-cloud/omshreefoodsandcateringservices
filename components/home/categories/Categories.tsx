"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  PackageSearch,
  RefreshCw,
  Sparkles,
} from "lucide-react";

import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";
import Spinner from "@/components/ui/Spinner";

import CategoryCard from "./CategoryCard";

interface Category {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  _count: {
    products: number;
  };
}

interface ApiError {
  error?: string;
  message?: string;
}

function isCategory(value: unknown): value is Category {
  if (!value || typeof value !== "object") {
    return false;
  }

  const category = value as Partial<Category>;

  return (
    typeof category.id === "string" &&
    typeof category.name === "string" &&
    typeof category.slug === "string" &&
    (typeof category.image === "string" ||
      category.image === null) &&
    Boolean(category._count) &&
    typeof category._count?.products === "number"
  );
}

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/home/categories", {
        method: "GET",
        cache: "no-store",
      });

      const data: unknown = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        const apiError =
          data && typeof data === "object"
            ? (data as ApiError)
            : null;

        throw new Error(
          apiError?.error ||
            apiError?.message ||
            "Unable to load categories.",
        );
      }

      if (!Array.isArray(data)) {
        throw new Error(
          "The categories response was invalid.",
        );
      }

      setCategories(data.filter(isCategory));
    } catch (loadError) {
      console.error(
        "Failed to load home categories:",
        loadError,
      );

      setCategories([]);

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Something went wrong while loading categories.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#FFF8EE] via-[#FFFDF8] to-white py-20 sm:py-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-0 h-96 w-96 rounded-full bg-[#FFE8BD]/40 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-[#FFE8BD]/40 blur-3xl"
      />

      <Container className="relative">
        <SectionHeader
          badge={
            <Badge
              variant="neutral"
              className="gap-2"
            >
              <Sparkles
                size={16}
                aria-hidden="true"
              />

              Shop by Category
            </Badge>
          }
          title="Discover Our Delicious Collection"
          description="Explore homemade snacks, sweets, pickles, catering specialties and traditional delicacies prepared with authentic taste and carefully selected ingredients."
          align="center"
          className="mx-auto max-w-3xl"
        />

        {loading && (
          <div className="flex min-h-72 items-center justify-center">
            <Spinner
              size="lg"
              text="Loading categories..."
            />
          </div>
        )}

        {!loading && error && (
          <Card
            variant="outlined"
            padding="lg"
            className="mx-auto mt-12 max-w-xl border-red-200 bg-red-50 text-center"
          >
            <PackageSearch
              size={44}
              className="mx-auto text-red-500"
              aria-hidden="true"
            />

            <h3 className="mt-4 text-xl font-bold text-red-700">
              Categories could not be loaded
            </h3>

            <p className="mt-3 leading-7 text-red-600">
              {error}
            </p>

            <Button
              type="button"
              variant="primary"
              leftIcon={
                <RefreshCw
                  size={17}
                  aria-hidden="true"
                />
              }
              className="mt-6"
              onClick={() => void loadCategories()}
            >
              Try Again
            </Button>
          </Card>
        )}

        {!loading &&
          !error &&
          categories.length === 0 && (
            <Card
              variant="outlined"
              padding="lg"
              className="mx-auto mt-12 max-w-xl text-center"
            >
              <PackageSearch
                size={44}
                className="mx-auto text-[#C89B3C]"
                aria-hidden="true"
              />

              <h3 className="mt-4 text-xl font-bold text-[#6D2E00]">
                Categories are coming soon
              </h3>

              <p className="mt-3 leading-7 text-gray-600">
                Our collection is being prepared. Please
                check back shortly.
              </p>
            </Card>
          )}

        {!loading &&
          !error &&
          categories.length > 0 && (
            <div className="mt-14 grid gap-6 sm:mt-16 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
              {categories.map((category) => (
                <CategoryCard
                  key={category.id}
                  name={category.name}
                  image={
                    category.image ||
                    "/images/no-image.jpg"
                  }
                  href={`/shop?category=${encodeURIComponent(
                    category.slug,
                  )}`}
                  productCount={
                    category._count.products
                  }
                />
              ))}
            </div>
          )}
      </Container>
    </section>
  );
}