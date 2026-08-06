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
  SectionHeader,
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
    const timer = window.setTimeout(
      async () => {
        const normalizedQuery =
          query.trim();

        if (!normalizedQuery) {
          setProducts([]);
          setLoading(false);
          return;
        }

        try {
          setLoading(true);

          const data =
            await searchProducts(
              normalizedQuery,
            );

          setProducts(
            Array.isArray(data)
              ? data
              : [],
          );
        } catch (error) {
          console.error(
            "Product search error:",
            error,
          );

          setProducts([]);
        } finally {
          setLoading(false);
        }
      },
      300,
    );

    return () => {
      window.clearTimeout(timer);
    };
  }, [query]);

  return (
    <>
      {/* Hero and search */}

      <section className="relative overflow-hidden bg-gradient-to-br from-[#6D2E00] via-[#8B4513] to-[#C89B3C] pb-20 pt-20 text-white sm:pb-24 sm:pt-24 lg:pb-28 lg:pt-28">
        <div className="absolute inset-0 bg-black/15" />

        <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-white/10 blur-3xl" />

        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-[#FFE4A3]/20 blur-3xl" />

        <Container className="relative max-w-5xl text-center">
          <Badge className="border border-white/20 bg-white/10 px-5 py-2 text-white backdrop-blur-md">
            <Sparkles
              size={16}
              aria-hidden="true"
            />

            <span>
              Product Search
            </span>
          </Badge>

          <div className="mx-auto mt-8 flex h-24 w-24 items-center justify-center rounded-full border border-white/20 bg-white/10 shadow-xl backdrop-blur-md">
            <PackageSearch
              size={42}
              aria-hidden="true"
            />
          </div>

          <SectionHeader
            title={
              <>
                Find Your
                <br />
                Favorite Foods
              </>
            }
            description="Search our collection of homemade snacks, sweets, pickles, spice powders, millet products, and traditional specialties."
            align="center"
            className="mt-8 text-white [&_h2]:text-white [&_p]:text-white/90"
          />

          {/* Search card inside brown section */}

          <Card
            padding="lg"
            className="mx-auto mt-10 max-w-4xl border border-white/20 bg-white/95 text-left shadow-2xl backdrop-blur-xl sm:mt-12"
          >
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFF4DE] to-[#FFE8BF]">
                <Search
                  size={22}
                  className="text-[#C89B3C]"
                  aria-hidden="true"
                />
              </div>

              <div>
                <h2 className="text-xl font-bold text-[#6D2E00]">
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

      {/* Results section */}

      <section className="min-h-[45vh] bg-[#FFFDF8] pb-24 pt-10 sm:pt-12">
        <Container>
          {/* Initial message */}

          {!loading &&
            !query.trim() && (
              <div className="py-10 text-center">
                <PackageSearch
                  size={44}
                  className="mx-auto text-[#C89B3C]"
                  aria-hidden="true"
                />

                <h2 className="mt-5 text-2xl font-bold text-[#6D2E00]">
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

          {/* Loading */}

          {loading && (
            <div className="flex justify-center py-24">
              <Spinner
                size="lg"
                text="Searching products..."
              />
            </div>
          )}

          {/* Results */}

          {!loading &&
            products.length > 0 && (
              <>
                <div className="flex justify-center">
                  <Badge
                    variant="secondary"
                    className="px-6 py-3"
                  >
                    Found{" "}
                    {products.length}{" "}
                    product
                    {products.length !==
                    1
                      ? "s"
                      : ""}
                  </Badge>
                </div>

                <SearchResults
                  products={products}
                />
              </>
            )}

          {/* Empty */}

          {!loading &&
            query.trim() !== "" &&
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