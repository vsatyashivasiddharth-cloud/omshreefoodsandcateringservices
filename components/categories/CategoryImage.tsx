"use client";

import {
  useEffect,
  useState,
} from "react";
import Image from "next/image";
import {
  PackageSearch,
} from "lucide-react";

interface CategoryImageProps {
  src: string | null | undefined;
  alt: string;
}

export default function CategoryImage({
  src,
  alt,
}: CategoryImageProps) {
  const normalizedSrc =
    src?.trim() ?? "";

  const [
    imageFailed,
    setImageFailed,
  ] = useState(!normalizedSrc);

  useEffect(() => {
    setImageFailed(
      !normalizedSrc,
    );
  }, [normalizedSrc]);

  const showPlaceholder =
    !normalizedSrc ||
    imageFailed;

  if (showPlaceholder) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#FFF8EA] via-[#FFF4DE] to-[#E7DFC9] px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/70 shadow-sm">
          <PackageSearch
            size={34}
            className="text-[#C89B3C]"
            aria-hidden="true"
          />
        </div>

        <p className="mt-3 text-sm font-semibold text-[#6D2E00]">
          Image unavailable
        </p>
      </div>
    );
  }

  return (
    <Image
      src={normalizedSrc}
      alt={alt}
      fill
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
      className="object-cover transition duration-500 group-hover:scale-105"
      onError={() => {
        setImageFailed(true);
      }}
    />
  );
}