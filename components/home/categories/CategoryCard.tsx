"use client";

import {
  useEffect,
  useState,
} from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ImageOff,
} from "lucide-react";

import Card from "@/components/ui/Card";

interface CategoryCardProps {
  name: string;
  image:
    | string
    | null
    | undefined;
  href: string;
  productCount?: number;
}

export default function CategoryCard({
  name,
  image,
  href,
}: CategoryCardProps) {
  const rawImage =
    image?.trim() ?? "";

  const [
    imageFailed,
    setImageFailed,
  ] = useState(!rawImage);

  useEffect(() => {
    setImageFailed(
      !rawImage,
    );
  }, [rawImage]);

  const showPlaceholder =
    !rawImage ||
    imageFailed;

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
        {/* Category image */}

        <div className="relative h-72 overflow-hidden bg-gradient-to-br from-[#FFF8EA] via-[#FFF4DE] to-[#FFE8BF]">
          {!showPlaceholder ? (
            <>
              <Image
                src={rawImage}
                alt={name}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                onError={() => {
                  setImageFailed(
                    true,
                  );
                }}
              />

              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent"
              />
            </>
          ) : (
            <>
              <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[#C89B3C]/20 bg-white/75 shadow-sm backdrop-blur-sm">
                  <ImageOff
                    size={34}
                    className="text-[#C89B3C]"
                    aria-hidden="true"
                  />
                </div>

                <p className="mt-4 text-lg font-bold text-[#6D2E00]">
                  Image unavailable
                </p>

                <p className="mt-1 max-w-[220px] text-sm leading-5 text-[#6D2E00]/60">
                  A category image has
                  not been added yet.
                </p>
              </div>

              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-[#6D2E00]/35 via-transparent to-transparent"
              />
            </>
          )}

          {/* Category title */}

          <div className="absolute inset-x-6 bottom-6">
            <span className="inline-flex rounded-full border border-white/20 bg-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur-md">
              Category
            </span>

            <h3
              className={
                showPlaceholder
                  ? "mt-4 text-3xl font-bold text-[#6D2E00]"
                  : "mt-4 text-3xl font-bold text-white"
              }
            >
              {name}
            </h3>
          </div>
        </div>

        {/* Card footer */}

        <div className="flex items-center justify-between gap-5 p-6">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8A5A00]">
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
            <ArrowRight
              size={20}
            />
          </span>
        </div>
      </Card>
    </Link>
  );
}