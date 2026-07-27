import { Grid3X3, Sparkles } from "lucide-react";

import ProductSearchCard from "./ProductSearchCard";
import { SearchProduct } from "./SearchContent";
import {
  Badge,
  Card,
  SectionHeader,
} from "@/components/ui";

interface SearchResultsProps {
  products: SearchProduct[];
}

export default function SearchResults({
  products,
}: SearchResultsProps) {
  return (
    <section className="mt-14">
      {/* Header */}

      <Card
        padding="lg"
        className="mb-10 bg-white/90 backdrop-blur-sm"
      >
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFF4DE] to-[#FFE8BF]">
              <Grid3X3
                size={26}
                className="text-[#C89B3C]"
              />
            </div>

            <SectionHeader
              badge={
                <>
                  <Sparkles size={14} />
                  <span>Search Results</span>
                </>
              }
              title="Matching Products"
              description="Explore products that match your search."
              align="left"
              className="mb-0"
            />
          </div>

          <Badge
            variant="secondary"
            className="self-start px-5 py-3 text-sm md:self-auto"
          >
            {products.length} Product
            {products.length !== 1 ? "s" : ""}
          </Badge>
        </div>
      </Card>

      {/* Products */}

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <ProductSearchCard
            key={product.id}
            product={product}
          />
        ))}
      </div>
    </section>
  );
}