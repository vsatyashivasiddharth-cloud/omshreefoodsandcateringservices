"use client";

import {
  useEffect,
  useState,
} from "react";
import {
  PackageSearch,
  Search,
  Sparkles,
} from "lucide-react";

import SearchBar from "./SearchBar";
import SearchEmpty from "./SearchEmpty";
import SearchResults from "./SearchResults";

import {
  Badge,
  Card,
  Container,
  Spinner,
} from "@/components/ui";

import { searchProducts } from "@/lib/services/search";

export interface SearchProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  image: string;
  stock: number;

  category: {
    id: string;
    name: string;
    slug: string;
  };
}

export default function SearchContent() {
  const [query, setQuery] =
    useState("");

  const [products, setProducts] =
    useState<SearchProduct[]>([]);

  const [loading, setLoading] =
    useState(false);

  useEffect(() => {
    const normalizedQuery =
      query.trim();

    if (!normalizedQuery) {
      setProducts([]);
      setLoading(false);
      return;
    }

    const controller =
      new AbortController();

    const timer = window.setTimeout(
      async () => {
        try {
          setLoading(true);

          const data =
            await searchProducts(
              normalizedQuery,
            );

          if (
            controller.signal.aborted
          ) {
            return;
          }

          setProducts(
            Array.isArray(data)
              ? data
              : [],
          );
        } catch (error) {
          if (
            controller.signal.aborted
          ) {
            return;
          }

          console.error(
            "Product search error:",
            error,
          );

          setProducts([]);
        } finally {
          if (
            !controller.signal.aborted
          ) {
            setLoading(false);
          }
        }
      },
      300,
    );

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const hasQuery =
    query.trim().length > 0;

  return (
    <>
      {/* Compact search hero */}

      <section className="relative isolate overflow-hidden bg-gradient-to-br from-[#6D2E00] via-[#8B4513] to-[#C89B3C] pb-10 pt-8 text-white sm:pb-12 sm:pt-10 lg:pb-14">
        <div className="absolute inset-0 bg-black/15" />

        <div className="absolute -left-24 top-0 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[#FFE4A3]/20 blur-3xl" />

        <Container className="relative max-w-5xl">
          <div className="text-center">
            <Badge className="border border-white/20 bg-white/10 px-4 py-2 text-white backdrop-blur-md">
              <Sparkles
                size={15}
                aria-hidden="true"
              />

              <span>
                Product Search
              </span>
            </Badge>

            <div className="mx-auto mt-5 flex max-w-3xl items-center justify-center gap-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 shadow-lg backdrop-blur-md">
                <PackageSearch
                  size={29}
                  aria-hidden="true"
                />
              </div>

              <h1 className="text-left text-3xl font-bold leading-tight text-white sm:text-4xl">
                Find Your
                <br />
                Favorite Foods
              </h1>
            </div>

            <p className="mx-auto mt-4 max-w-3xl text-center text-base leading-7 text-white/90 sm:text-lg">
              Search our collection
              of homemade snacks,
              sweets, pickles, spice
              powders, millet
              products, and
              traditional
              specialties.
            </p>
          </div>

          {/* Search card */}

          <Card
            padding="lg"
            className="mx-auto mt-7 max-w-3xl border border-white/20 bg-white/95 text-left shadow-xl backdrop-blur-xl"
          >
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFF4DE] to-[#FFE8BF]">
                <Search
                  size={21}
                  className="text-[#C89B3C]"
                  aria-hidden="true"
                />
              </div>

              <div className="min-w-0">
                <h2 className="text-lg font-bold text-[#6D2E00] sm:text-xl">
                  Search Products
                </h2>

                <p className="text-sm text-gray-500">
                  Find exactly what
                  you&apos;re looking
                  for
                </p>
              </div>
            </div>

            <SearchBar
              value={query}
              onChange={setQuery}
            />
          </Card>
        </Container>
      </section>

      {/* Search results */}

      <section className="bg-[#FFFDF8] pb-16 pt-8 sm:pt-10">
        <Container>
          {!loading && !hasQuery && (
            <div className="py-9 text-center sm:py-10">
              <PackageSearch
                size={40}
                className="mx-auto text-[#C89B3C]"
                aria-hidden="true"
              />

              <h2 className="mt-4 text-2xl font-bold text-[#6D2E00]">
                Start Your Search
              </h2>

              <p className="mx-auto mt-2 max-w-xl leading-7 text-gray-500">
                Enter a product name
                or category above to
                explore our homemade
                foods.
              </p>
            </div>
          )}

          {loading && (
            <div className="flex justify-center py-16">
              <Spinner
                size="lg"
                text="Searching products..."
              />
            </div>
          )}

          {!loading &&
            products.length > 0 && (
              <SearchResults
                products={products}
              />
            )}

          {!loading &&
            hasQuery &&
            products.length ===
              0 && (
              <SearchEmpty
                query={query}
              />
            )}
        </Container>
      </section>
    </>
  );
}