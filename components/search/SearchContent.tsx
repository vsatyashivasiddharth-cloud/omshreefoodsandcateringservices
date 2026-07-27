"use client";

import { useEffect, useState } from "react";
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
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<SearchProduct[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!query.trim()) {
        setProducts([]);
        return;
      }

      try {
        setLoading(true);

        const data = await searchProducts(query);

        if (Array.isArray(data)) {
          setProducts(data);
        } else {
          setProducts([]);
        }
      } catch (err) {
        console.error(err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <>
      {/* Hero */}

      <section className="relative overflow-hidden bg-gradient-to-br from-[#6D2E00] via-[#8B4513] to-[#C89B3C] py-28 text-white">
        <div className="absolute inset-0 bg-black/15" />

        <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-white/10 blur-3xl" />

        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-[#FFE4A3]/20 blur-3xl" />

        <Container className="relative max-w-5xl text-center">
          <Badge className="border border-white/20 bg-white/10 px-5 py-2 text-white backdrop-blur-md">
            <Sparkles size={16} />
            <span>Product Search</span>
          </Badge>

          <div className="mx-auto mt-8 flex h-24 w-24 items-center justify-center rounded-full border border-white/20 bg-white/10 shadow-xl backdrop-blur-md">
            <PackageSearch size={42} />
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
        </Container>
      </section>

      {/* Content */}

      <section className="relative -mt-12 min-h-screen bg-[#FFFDF8] pb-24">
        <Container>
          {/* Search Card */}

          <Card
            padding="lg"
            className="bg-white/90 shadow-2xl backdrop-blur-sm"
          >
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFF4DE] to-[#FFE8BF]">
                <Search
                  size={22}
                  className="text-[#C89B3C]"
                />
              </div>

              <div>
                <h2 className="text-xl font-bold text-[#6D2E00]">
                  Search Products
                </h2>

                <p className="text-sm text-gray-500">
                  Find exactly what you're looking for
                </p>
              </div>
            </div>

            <SearchBar
              value={query}
              onChange={setQuery}
            />
          </Card>

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

          {!loading && products.length > 0 && (
            <>
              <div className="mt-12 flex justify-center">
                <Badge
                  variant="secondary"
                  className="px-6 py-3"
                >
                  Found {products.length} product
                  {products.length !== 1 ? "s" : ""}
                </Badge>
              </div>

              <SearchResults products={products} />
            </>
          )}

          {/* Empty */}

          {!loading &&
            query.trim() !== "" &&
            products.length === 0 && (
              <SearchEmpty query={query} />
            )}
        </Container>
      </section>
    </>
  );
}