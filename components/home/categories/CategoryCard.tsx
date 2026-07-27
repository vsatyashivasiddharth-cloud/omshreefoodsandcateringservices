import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Package,
} from "lucide-react";

import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";

interface CategoryCardProps {
  name: string;
  image: string;
  href: string;
  productCount?: number;
}

export default function CategoryCard({
  name,
  image,
  href,
  productCount = 0,
}: CategoryCardProps) {
  const safeProductCount = Math.max(
    0,
    Math.floor(Number(productCount) || 0),
  );

  const productLabel =
    safeProductCount === 1
      ? "Product"
      : "Products";

  return (
    <Link
      href={href}
      aria-label={`Browse ${name}`}
      className="group block rounded-[32px] focus:outline-none focus:ring-4 focus:ring-[#C89B3C]/25"
    >
      <Card
        padding="none"
        hover
        className="h-full overflow-hidden bg-white"
      >
        <div className="relative h-72 overflow-hidden bg-[#FFF4DE]">
          <Image
            src={image || "/images/no-image.jpg"}
            alt={name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-110"
          />

          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent"
          />

          <div className="absolute left-5 top-5">
            <Badge
              variant="warning"
              rounded
              className="gap-2 shadow-lg"
            >
              <Package
                size={14}
                aria-hidden="true"
              />

              {safeProductCount} {productLabel}
            </Badge>
          </div>

          <div className="absolute inset-x-6 bottom-6">
            <span className="inline-flex rounded-full border border-white/20 bg-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur-md">
              Category
            </span>

            <h3 className="mt-4 text-3xl font-bold text-white">
              {name}
            </h3>
          </div>
        </div>

        <div className="flex items-center justify-between gap-5 p-6">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C89B3C]">
              Browse Collection
            </p>

            <p className="mt-2 line-clamp-2 leading-7 text-gray-600">
              Discover our handcrafted{" "}
              {name.toLocaleLowerCase()}.
            </p>
          </div>

          <span
            aria-hidden="true"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#FFF3DA] text-[#6D2E00] transition-all duration-300 group-hover:translate-x-1 group-hover:bg-[#6D2E00] group-hover:text-white"
          >
            <ArrowRight size={20} />
          </span>
        </div>
      </Card>
    </Link>
  );
}