import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  PackageX,
  ShoppingBag,
  Tag,
} from "lucide-react";

import { Badge, Card } from "@/components/ui";
import { SearchProduct } from "./SearchContent";

interface ProductSearchCardProps {
  product: SearchProduct;
}

export default function ProductSearchCard({
  product,
}: ProductSearchCardProps) {
  const inStock = product.stock > 0;

  return (
    <Card
      padding="none"
      hover
      className="group overflow-hidden"
    >
      {/* Image */}

      <div className="relative h-72 overflow-hidden bg-[#FFF4DE]">
        <Image
          src={product.image || "/images/no-image.jpg"}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />

        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
          <Badge
            variant="neutral"
            className="bg-white/95 shadow-md backdrop-blur"
          >
            <Tag
              size={16}
              className="text-[#C89B3C]"
            />
            {product.category.name}
          </Badge>

          <Badge
            variant={inStock ? "success" : "danger"}
          >
            {inStock ? "In Stock" : "Out of Stock"}
          </Badge>
        </div>

        {!inStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/55 backdrop-blur-sm">
            <Badge
              variant="danger"
              size="lg"
              className="shadow-lg"
            >
              <PackageX size={18} />
              Out of Stock
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}

      <div className="p-7">
        <h3 className="line-clamp-2 min-h-[64px] text-2xl font-bold text-[#6D2E00] transition-colors group-hover:text-[#C89B3C]">
          {product.name}
        </h3>

        <div className="mt-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">
              Starting from
            </p>

            <p className="text-3xl font-bold text-[#C89B3C]">
              ₹{product.price}
            </p>
          </div>

          <Link
            href={`/shop/${product.slug}`}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#6D2E00] px-6 py-3 font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:bg-[#4E1F00] hover:shadow-xl"
          >
            <ShoppingBag size={18} />

            <span>View</span>

            <ArrowRight
              size={18}
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </Link>
        </div>
      </div>
    </Card>
  );
}