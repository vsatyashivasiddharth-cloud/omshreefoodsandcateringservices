import { PackageSearch } from "lucide-react";

import type { ProductWithCategory } from "@/types/product";

import EmptyState from "@/components/ui/EmptyState";

import ProductCard from "./ProductCard";

interface ProductGridProps {
  products: ProductWithCategory[];
}

export default function ProductGrid({
  products,
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <EmptyState
        icon={
          <PackageSearch
            size={42}
            aria-hidden="true"
          />
        }
        title="No Products Found"
        description="Try changing the search term or selecting another category."
      />
    );
  }

  return (
    <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
        />
      ))}
    </div>
  );
}