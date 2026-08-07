"use client";

import {
  useEffect,
  useState,
} from "react";
import Image from "next/image";
import {
  ImageOff,
} from "lucide-react";

interface ProductDetailImageProps {
  src: string | null | undefined;
  alt: string;
  priority?: boolean;
}

export default function ProductDetailImage({
  src,
  alt,
  priority = false,
}: ProductDetailImageProps) {
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
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#FFF8EA] via-[#FFF4DE] to-[#FFE8BF] px-8 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full border border-[#C89B3C]/20 bg-white/75 shadow-sm backdrop-blur-sm">
          <ImageOff
            size={42}
            className="text-[#C89B3C]"
            aria-hidden="true"
          />
        </div>

        <p className="mt-5 text-xl font-bold text-[#6D2E00]">
          Image unavailable
        </p>

        <p className="mt-2 max-w-sm text-sm leading-6 text-[#6D2E00]/60 sm:text-base">
          A product image has not
          been added yet.
        </p>
      </div>
    );
  }

  return (
    <Image
      src={normalizedSrc}
      alt={alt}
      fill
      priority={priority}
      sizes="(max-width: 1024px) 100vw, 50vw"
      className="object-cover transition-transform duration-700 hover:scale-105"
      onError={() => {
        setImageFailed(true);
      }}
    />
  );
}