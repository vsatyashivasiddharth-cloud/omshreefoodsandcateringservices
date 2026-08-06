import {
  Grid3X3,
  Sparkles,
} from "lucide-react";

import ProductSearchCard from "./ProductSearchCard";
import type { SearchProduct } from "./SearchContent";

import {
  Badge,
  Card,
} from "@/components/ui";

interface SearchResultsProps {
  products: SearchProduct[];
}

export default function SearchResults({
  products,
}: SearchResultsProps) {
  return (
    <section className="pt-2">
      {/* Compact results header */}

      <Card
        padding="md"
        className="mb-7 bg-white/90 shadow-sm backdrop-blur-sm"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFF4DE] to-[#FFE8BF]">
              <Grid3X3
                size={21}
                className="text-[#C89B3C]"
                aria-hidden="true"
              />
            </div>

            <div className="min-w-0">
              <Badge
                variant="secondary"
                className="px-3 py-1.5 text-xs"
              >
                <Sparkles
                  size={13}
                  aria-hidden="true"
                />

                <span>
                  Search Results
                </span>
              </Badge>

              <h2 className="mt-2 text-2xl font-bold text-[#6D2E00] sm:text-3xl">
                Matching Products
              </h2>

              <p className="mt-1 text-sm text-gray-500 sm:text-base">
                Explore products that
                match your search.
              </p>
            </div>
          </div>

          <Badge
            variant="secondary"
            className="w-fit px-4 py-2 text-sm"
          >
            {products.length}{" "}
            {products.length === 1
              ? "Product"
              : "Products"}
          </Badge>
        </div>
      </Card>

      {/* Product grid */}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map(
          (product) => (
            <ProductSearchCard
              key={product.id}
              product={product}
            />
          ),
        )}
      </div>
    </section>
  );
}