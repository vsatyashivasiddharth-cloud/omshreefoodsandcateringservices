import {
  cache,
  type ReactNode,
} from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronRight,
  Leaf,
  Package,
  ShieldCheck,
  Truck,
} from "lucide-react";

import Footer from "@/components/layout/footer";
import Navbar from "@/components/layout/Navbar";
import ProductActions from "@/components/shop/ProductActions";
import ProductDetailImage from "@/components/shop/ProductDetailImage";
import RelatedProducts from "@/components/shop/RelatedProducts";
import prisma from "@/lib/prisma";
import type { ProductWithCategory } from "@/types/product";

const siteUrl =
  "https://www.omshreefoodsandcaterers.com";

const brandName =
  "Om Shree Foods & Caterers";

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
}

function getAbsoluteUrl(
  value: string | null,
) {
  if (!value) {
    return `${siteUrl}/images/no-image.jpg`;
  }

  try {
    return new URL(
      value,
      siteUrl,
    ).toString();
  } catch {
    return `${siteUrl}/images/no-image.jpg`;
  }
}

function serializeStructuredData(
  value: Record<
    string,
    unknown
  >,
) {
  return JSON.stringify(
    value,
  ).replace(
    /</g,
    "\\u003c",
  );
}

function normalizeNonNegativeInteger(
  value: unknown,
) {
  const number =
    Number(value);

  if (
    !Number.isFinite(
      number,
    )
  ) {
    return 0;
  }

  return Math.max(
    0,
    Math.floor(number),
  );
}

function normalizePrice(
  value: unknown,
) {
  const number =
    Number(value);

  if (
    !Number.isFinite(
      number,
    ) ||
    number < 0
  ) {
    return 0;
  }

  return number;
}

const getProduct = cache(
  async (
    slug: string,
  ) => {
    const normalizedSlug =
      slug.trim();

    if (!normalizedSlug) {
      return null;
    }

    return prisma.product.findUnique({
      where: {
        slug:
          normalizedSlug,
      },

      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        price: true,
        image: true,
        stock: true,
        featured: true,
        shippingWeightGrams:
          true,
        categoryId: true,
        createdAt: true,
        updatedAt: true,

        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            image: true,
          },
        },

        variants: {
          where: {
            isActive: true,
          },

          orderBy: [
            {
              sortOrder:
                "asc",
            },
            {
              weightGrams:
                "asc",
            },
          ],

          select: {
            id: true,
            label: true,
            weightGrams:
              true,
            shippingWeightGrams:
              true,
            price: true,
            stock: true,
            sku: true,
            isActive: true,
            isDefault:
              true,
            sortOrder: true,
          },
        },
      },
    });
  },
);

function getDefaultVariant<
  T extends {
    isDefault: boolean;
    isActive: boolean;
  },
>(
  variants: T[],
) {
  return (
    variants.find(
      (variant) =>
        variant.isActive &&
        variant.isDefault,
    ) ??
    variants.find(
      (variant) =>
        variant.isActive,
    ) ??
    null
  );
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const {
    slug,
  } = await params;

  const product =
    await getProduct(slug);

  if (!product) {
    return {
      title:
        "Product Not Found",

      description:
        "The requested product could not be found.",

      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const defaultVariant =
    getDefaultVariant(
      product.variants,
    );

  const metadataPrice =
    defaultVariant
      ? normalizePrice(
          defaultVariant.price,
        )
      : normalizePrice(
          product.price,
        );

  const inStock =
    product.variants.length >
    0
      ? product.variants.some(
          (variant) =>
            normalizeNonNegativeInteger(
              variant.stock,
            ) > 0,
        )
      : normalizeNonNegativeInteger(
          product.stock,
        ) > 0;

  const productPath =
    `/shop/${encodeURIComponent(
      product.slug,
    )}`;

  const imageUrl =
    getAbsoluteUrl(
      product.image,
    );

  const description =
    product.description?.trim() ||
    `Buy ${product.name} online from ${brandName}. Freshly prepared, hygienically packed and delivered across India.`;

  return {
    title: product.name,
    description,

    alternates: {
      canonical:
        productPath,
    },

    openGraph: {
      type: "website",
      url: productPath,
      siteName:
        brandName,
      locale: "en_IN",

      title:
        `${product.name} | ${brandName}`,

      description,

      images: [
        {
          url:
            imageUrl,
          alt:
            product.name,
        },
      ],
    },

    twitter: {
      card:
        "summary_large_image",

      title:
        `${product.name} | ${brandName}`,

      description,

      images: [
        imageUrl,
      ],
    },

    robots: {
      index: true,
      follow: true,

      googleBot: {
        index: true,
        follow: true,

        "max-image-preview":
          "large",

        "max-snippet":
          -1,

        "max-video-preview":
          -1,
      },
    },

    other: {
      "product:price:amount":
        metadataPrice.toFixed(
          2,
        ),

      "product:price:currency":
        "INR",

      "product:availability":
        inStock
          ? "in stock"
          : "out of stock",

      "product:category":
        product.category
          .name,
    },
  };
}

export default async function ProductPage({
  params,
}: ProductPageProps) {
  const {
    slug,
  } = await params;

  const product =
    await getProduct(slug);

  if (!product) {
    notFound();
  }

  const normalizedVariants =
    product.variants.map(
      (variant) => ({
        id:
          variant.id,

        label:
          variant.label,

        weightGrams:
          normalizeNonNegativeInteger(
            variant.weightGrams,
          ),

        shippingWeightGrams:
          normalizeNonNegativeInteger(
            variant
              .shippingWeightGrams,
          ),

        price:
          normalizePrice(
            variant.price,
          ),

        stock:
          normalizeNonNegativeInteger(
            variant.stock,
          ),

        sku:
          variant.sku,

        isActive:
          variant.isActive,

        isDefault:
          variant.isDefault,

        sortOrder:
          variant.sortOrder,
      }),
    );

  const normalizedProduct: ProductWithCategory =
    {
      id:
        product.id,

      name:
        product.name,

      slug:
        product.slug,

      description:
        product.description,

      price:
        normalizePrice(
          product.price,
        ),

      image:
        product.image ||
        "/images/no-image.jpg",

      stock:
        normalizeNonNegativeInteger(
          product.stock,
        ),

      featured:
        product.featured,

      shippingWeightGrams:
        normalizeNonNegativeInteger(
          product
            .shippingWeightGrams,
        ),

      categoryId:
        product.categoryId,

      category: {
        id:
          product.category.id,

        name:
          product.category.name,

        slug:
          product.category.slug,

        image:
          product.category.image,
      },

      variants:
        normalizedVariants,

      createdAt:
        product.createdAt,

      updatedAt:
        product.updatedAt,
    };

  const defaultVariant =
    getDefaultVariant(
      normalizedVariants,
    );

  const structuredDataPrice =
    defaultVariant
      ? defaultVariant.price
      : normalizedProduct.price;

  const inStock =
    normalizedVariants.length >
    0
      ? normalizedVariants.some(
          (variant) =>
            variant.stock > 0,
        )
      : normalizedProduct.stock >
        0;

  const productUrl =
    `${siteUrl}/shop/${encodeURIComponent(
      product.slug,
    )}`;

  const productImage =
    getAbsoluteUrl(
      product.image,
    );

  const structuredDataDescription =
    product.description?.trim() ||
    `Buy ${product.name} online from ${brandName}. Freshly prepared, hygienically packed and delivered across India.`;

  const activeVariantPrices =
    normalizedVariants
      .filter(
        (variant) =>
          variant.isActive,
      )
      .map(
        (variant) =>
          variant.price,
      )
      .filter(
        (price) =>
          Number.isFinite(
            price,
          ) &&
          price >= 0,
      );

  const lowestPrice =
    activeVariantPrices.length >
    0
      ? Math.min(
          ...activeVariantPrices,
        )
      : structuredDataPrice;

  const highestPrice =
    activeVariantPrices.length >
    0
      ? Math.max(
          ...activeVariantPrices,
        )
      : structuredDataPrice;

  const productStructuredData: Record<
    string,
    unknown
  > = {
    "@context":
      "https://schema.org",

    "@type":
      "Product",

    "@id":
      `${productUrl}#product`,

    name:
      product.name,

    description:
      structuredDataDescription,

    url:
      productUrl,

    image: [
      productImage,
    ],

    sku:
      defaultVariant?.sku ||
      product.id,

    category:
      product.category.name,

    brand: {
      "@type":
        "Brand",

      name:
        brandName,
    },

    offers:
      normalizedVariants.length >
      1
        ? {
            "@type":
              "AggregateOffer",

            url:
              productUrl,

            priceCurrency:
              "INR",

            lowPrice:
              lowestPrice.toFixed(
                2,
              ),

            highPrice:
              highestPrice.toFixed(
                2,
              ),

            offerCount:
              normalizedVariants.length,

            availability:
              inStock
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",

            seller: {
              "@type":
                "Organization",

              "@id":
                `${siteUrl}/#organization`,

              name:
                brandName,

              url:
                siteUrl,
            },
          }
        : {
            "@type":
              "Offer",

            url:
              productUrl,

            priceCurrency:
              "INR",

            price:
              structuredDataPrice.toFixed(
                2,
              ),

            availability:
              inStock
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",

            itemCondition:
              "https://schema.org/NewCondition",

            seller: {
              "@type":
                "Organization",

              "@id":
                `${siteUrl}/#organization`,

              name:
                brandName,

              url:
                siteUrl,
            },
          },
  };

  const breadcrumbStructuredData: Record<
    string,
    unknown
  > = {
    "@context":
      "https://schema.org",

    "@type":
      "BreadcrumbList",

    "@id":
      `${productUrl}#breadcrumb`,

    itemListElement: [
      {
        "@type":
          "ListItem",

        position: 1,

        name:
          "Home",

        item:
          siteUrl,
      },

      {
        "@type":
          "ListItem",

        position: 2,

        name:
          "Shop",

        item:
          `${siteUrl}/shop`,
      },

      {
        "@type":
          "ListItem",

        position: 3,

        name:
          product.category
            .name,

        item:
          `${siteUrl}/shop?category=${encodeURIComponent(
            product.category
              .slug,
          )}`,
      },

      {
        "@type":
          "ListItem",

        position: 4,

        name:
          product.name,

        item:
          productUrl,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html:
            serializeStructuredData(
              productStructuredData,
            ),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html:
            serializeStructuredData(
              breadcrumbStructuredData,
            ),
        }}
      />

      <Navbar />

      <main className="min-h-screen bg-gradient-to-b from-[#FFFDF8] via-[#FFFBF4] to-[#FFF8EE] pt-28">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <nav
            aria-label="Breadcrumb"
            className="mb-12 inline-flex max-w-full flex-wrap items-center gap-2 rounded-full border border-[#F3DFC2] bg-white/80 px-6 py-3 text-sm text-gray-500 shadow-sm backdrop-blur-sm"
          >
            <Link
              href="/"
              className="rounded transition-colors hover:text-[#C89B3C] focus:outline-none focus:ring-2 focus:ring-[#C89B3C]/30"
            >
              Home
            </Link>

            <ChevronRight
              size={15}
              aria-hidden="true"
            />

            <Link
              href="/shop"
              className="rounded transition-colors hover:text-[#C89B3C] focus:outline-none focus:ring-2 focus:ring-[#C89B3C]/30"
            >
              Shop
            </Link>

            <ChevronRight
              size={15}
              aria-hidden="true"
            />

            <Link
              href={`/shop?category=${encodeURIComponent(
                product.category
                  .slug,
              )}`}
              className="rounded transition-colors hover:text-[#C89B3C] focus:outline-none focus:ring-2 focus:ring-[#C89B3C]/30"
            >
              {
                product.category
                  .name
              }
            </Link>

            <ChevronRight
              size={15}
              aria-hidden="true"
            />

            <span
              aria-current="page"
              className="max-w-full truncate font-semibold text-[#6D2E00]"
            >
              {product.name}
            </span>
          </nav>

          <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Product image */}

            <div className="overflow-hidden rounded-[36px] border border-[#F3DFC2] bg-white p-4 shadow-2xl">
              <div className="relative aspect-square overflow-hidden rounded-[28px] bg-[#FFF8EE] lg:aspect-auto lg:h-[560px]">
                <ProductDetailImage
                  src={product.image}
                  alt={product.name}
                  priority
                />

                {product.featured && (
                  <div className="absolute left-5 top-5 z-10 rounded-full bg-[#C89B3C] px-4 py-2 text-sm font-bold text-white shadow-lg">
                    Featured
                  </div>
                )}

                {!inStock && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/45">
                    <span className="rounded-full bg-white px-6 py-3 font-bold text-[#6D2E00] shadow-xl">
                      Currently Out
                      of Stock
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Product information */}

            <div className="flex flex-col self-start lg:sticky lg:top-28">
              <Link
                href={`/shop?category=${encodeURIComponent(
                  product.category
                    .slug,
                )}`}
                className="inline-flex w-fit rounded-full bg-[#FFF3DA] px-4 py-2 text-sm font-semibold uppercase tracking-wider text-[#C89B3C] transition-colors hover:bg-[#F8E7C5] focus:outline-none focus:ring-4 focus:ring-[#C89B3C]/20"
              >
                {
                  product.category
                    .name
                }
              </Link>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                <Leaf
                  size={16}
                  className="text-[#C89B3C]"
                  aria-hidden="true"
                />

                <span>
                  Freshly Prepared
                </span>

                <span aria-hidden="true">
                  •
                </span>

                <span>
                  Premium Ingredients
                </span>
              </div>

              <h1 className="mt-5 text-4xl font-bold leading-tight text-[#6D2E00] sm:text-5xl">
                {product.name}
              </h1>

              <p className="mt-8 whitespace-pre-line text-lg leading-9 text-gray-700">
                {
                  structuredDataDescription
                }
              </p>

              <ProductActions
                product={
                  normalizedProduct
                }
              />

              <div className="mt-10 grid gap-5 sm:grid-cols-2">
                <FeatureCard
                  icon={
                    <Leaf
                      size={22}
                      aria-hidden="true"
                    />
                  }
                  title="Homemade"
                  description="Authentic family recipes"
                />

                <FeatureCard
                  icon={
                    <Package
                      size={22}
                      aria-hidden="true"
                    />
                  }
                  title="Fresh Packing"
                  description="Hygienically packed for freshness"
                />

                <FeatureCard
                  icon={
                    <Truck
                      size={22}
                      aria-hidden="true"
                    />
                  }
                  title="Fast Delivery"
                  description="Freshly packed and dispatched quickly"
                />

                <FeatureCard
                  icon={
                    <ShieldCheck
                      size={22}
                      aria-hidden="true"
                    />
                  }
                  title="Premium Quality"
                  description="Carefully selected ingredients"
                />
              </div>
            </div>
          </div>

          {/* Description */}

          <section className="mt-24 rounded-[36px] border border-[#F3DFC2] bg-white/90 p-8 shadow-xl backdrop-blur-sm sm:p-10">
            <h2 className="text-3xl font-bold text-[#6D2E00]">
              Product Description
            </h2>

            <p className="mb-8 mt-3 text-gray-500">
              Learn more about this
              handcrafted product and
              what makes it special.
            </p>

            <div
              aria-hidden="true"
              className="h-px bg-gradient-to-r from-[#C89B3C] via-[#F3DFC2] to-transparent"
            />

            <p className="mt-8 whitespace-pre-line leading-9 text-gray-700">
              {
                structuredDataDescription
              }
            </p>
          </section>

          <RelatedProducts
            productId={
              product.id
            }
          />
        </div>
      </main>

      <Footer />
    </>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: FeatureCardProps) {
  return (
    <div className="rounded-3xl border border-[#F3DFC2] bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FFF4DE] text-[#C89B3C]">
          {icon}
        </div>

        <div>
          <p className="font-semibold text-[#6D2E00]">
            {title}
          </p>

          <p className="text-sm leading-6 text-gray-500">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}