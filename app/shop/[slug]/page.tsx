import type { ReactNode } from "react";
import type { Metadata } from "next";
import Image from "next/image";
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
import RelatedProducts from "@/components/shop/RelatedProducts";
import { formatCurrency } from "@/lib/shop";
import prisma from "@/lib/prisma";
import type { ProductWithCategory } from "@/types/product";


const siteUrl =
  "https://www.omshreefoodsandcaterers.com";

const brandName =
  "Om Shree Foods & Caterers";

function getAbsoluteUrl(url: string | null) {
  if (!url) {
    return `${siteUrl}/images/no-image.jpg`;
  }

  try {
    return new URL(url, siteUrl).toString();
  } catch {
    return `${siteUrl}/images/no-image.jpg`;
  }
}

function serializeStructuredData(
  value: Record<string, unknown>,
) {
  return JSON.stringify(value).replace(
    /</g,
    "\\u003c",
  );
}

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

async function getProduct(slug: string) {
  const normalizedSlug = slug.trim();

  if (!normalizedSlug) {
    return null;
  }

  return prisma.product.findUnique({
    where: {
      slug: normalizedSlug,
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
      shippingWeightGrams: true,
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
    },
  });
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return {
      title: "Product Not Found",
      description:
        "The requested product could not be found.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const productUrl =
    `/shop/${encodeURIComponent(product.slug)}`;

  const imageUrl = getAbsoluteUrl(
    product.image,
  );

  const description =
    product.description?.trim() ||
    `Buy ${product.name} online from ${brandName}. Freshly prepared, hygienically packed and delivered across India.`;

  return {
    title: product.name,
    description,

    alternates: {
      canonical: productUrl,
    },

    openGraph: {
      type: "website",
      url: productUrl,
      siteName: brandName,
      locale: "en_IN",
      title: `${product.name} | ${brandName}`,
      description,
      images: [
        {
          url: imageUrl,
          alt: product.name,
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title: `${product.name} | ${brandName}`,
      description,
      images: [imageUrl],
    },

    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },

    other: {
      "product:price:amount":
        Number(product.price).toFixed(2),
      "product:price:currency": "INR",
      "product:availability":
        product.stock > 0
          ? "in stock"
          : "out of stock",
      "product:category":
        product.category.name,
    },
  };
}

export default async function ProductPage({
  params,
}: ProductPageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  const normalizedProduct: ProductWithCategory = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: Number(product.price),
    image:
      product.image ||
      "/images/no-image.jpg",
    stock: Math.max(
      0,
      Math.floor(Number(product.stock) || 0),
    ),
    featured: product.featured,
    shippingWeightGrams: Math.max(
      0,
      Math.floor(
        Number(product.shippingWeightGrams) || 0,
      ),
    ),
    categoryId: product.categoryId,
    category: {
      id: product.category.id,
      name: product.category.name,
      slug: product.category.slug,
      image: product.category.image,
    },
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };

  const inStock =
    normalizedProduct.stock > 0;

  const productUrl =
  `${siteUrl}/shop/${encodeURIComponent(
    product.slug,
  )}`;

const productImage = getAbsoluteUrl(
  product.image,
);

const productStructuredData = {
  "@context": "https://schema.org",
  "@type": "Product",
  "@id": `${productUrl}#product`,
  name: product.name,
  description: product.description,
  url: productUrl,
  image: [productImage],
  sku: product.id,
  category: product.category.name,

  brand: {
    "@type": "Brand",
    name: brandName,
  },

  offers: {
    "@type": "Offer",
    url: productUrl,
    priceCurrency: "INR",
    price: normalizedProduct.price.toFixed(2),
    availability: inStock
      ? "https://schema.org/InStock"
      : "https://schema.org/OutOfStock",
    itemCondition:
      "https://schema.org/NewCondition",
    seller: {
      "@type": "Organization",
      name: brandName,
      url: siteUrl,
    },
  },
};

const breadcrumbStructuredData = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: siteUrl,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Shop",
      item: `${siteUrl}/shop`,
    },
    {
      "@type": "ListItem",
      position: 3,
      name: product.category.name,
      item: `${siteUrl}/shop?category=${encodeURIComponent(
        product.category.slug,
      )}`,
    },
    {
      "@type": "ListItem",
      position: 4,
      name: product.name,
      item: productUrl,
    },
  ],
};  

  return (
    <>
      
      <script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: serializeStructuredData(
      productStructuredData,
    ),
  }}
/>

<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: serializeStructuredData(
      breadcrumbStructuredData,
    ),
  }}
/>

<Navbar />


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
                product.category.slug,
              )}`}
              className="rounded transition-colors hover:text-[#C89B3C] focus:outline-none focus:ring-2 focus:ring-[#C89B3C]/30"
            >
              {product.category.name}
            </Link>

            <ChevronRight
              size={15}
              aria-hidden="true"
            />

            <span
              className="max-w-full truncate font-semibold text-[#6D2E00]"
              aria-current="page"
            >
              {product.name}
            </span>
          </nav>

          <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="overflow-hidden rounded-[36px] border border-[#F3DFC2] bg-white p-4 shadow-2xl">
              <div className="relative aspect-square overflow-hidden rounded-[28px] bg-[#FFF8EE] lg:aspect-auto lg:h-[560px]">
                <Image
                  src={normalizedProduct.image}
                  alt={product.name}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover transition-transform duration-700 hover:scale-105"
                />

                {product.featured && (
                  <div className="absolute left-5 top-5 rounded-full bg-[#C89B3C] px-4 py-2 text-sm font-bold text-white shadow-lg">
                    Featured
                  </div>
                )}

                {!inStock && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/45">
                    <span className="rounded-full bg-white px-6 py-3 font-bold text-[#6D2E00] shadow-xl">
                      Currently Out of Stock
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col self-start lg:sticky lg:top-28">
              <Link
                href={`/shop?category=${encodeURIComponent(
                  product.category.slug,
                )}`}
                className="inline-flex w-fit rounded-full bg-[#FFF3DA] px-4 py-2 text-sm font-semibold uppercase tracking-wider text-[#C89B3C] transition-colors hover:bg-[#F8E7C5] focus:outline-none focus:ring-4 focus:ring-[#C89B3C]/20"
              >
                {product.category.name}
              </Link>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                <Leaf
                  size={16}
                  className="text-[#C89B3C]"
                  aria-hidden="true"
                />

                <span>Freshly Prepared</span>

                <span aria-hidden="true">
                  •
                </span>

                <span>Premium Ingredients</span>
              </div>

              <h1 className="mt-5 text-4xl font-bold leading-tight text-[#6D2E00] sm:text-5xl">
                {product.name}
              </h1>

              <div className="mt-8 flex flex-wrap items-end gap-4">
                <span className="text-4xl font-extrabold tracking-tight text-[#6D2E00] sm:text-5xl">
                  {formatCurrency(
                    normalizedProduct.price,
                  )}
                </span>

                <span className="pb-2 text-sm text-gray-500">
                  Inclusive of applicable taxes
                </span>
              </div>

              <p className="mt-8 whitespace-pre-line text-lg leading-9 text-gray-700">
                {product.description}
              </p>

              <div className="mt-8">
                <span
                  className={`inline-flex items-center gap-2 rounded-full px-5 py-2 font-semibold ${
                    inStock
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`h-2.5 w-2.5 rounded-full ${
                      inStock
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}
                  />

                  {inStock
                    ? `${normalizedProduct.stock} in stock`
                    : "Out of stock"}
                </span>
              </div>

              <ProductActions
                product={normalizedProduct}
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

          <section className="mt-24 rounded-[36px] border border-[#F3DFC2] bg-white/90 p-8 shadow-xl backdrop-blur-sm sm:p-10">
            <h2 className="text-3xl font-bold text-[#6D2E00]">
              Product Description
            </h2>

            <p className="mb-8 mt-3 text-gray-500">
              Learn more about this handcrafted product
              and what makes it special.
            </p>

            <div
              aria-hidden="true"
              className="h-px bg-gradient-to-r from-[#C89B3C] via-[#F3DFC2] to-transparent"
            />

            <p className="mt-8 whitespace-pre-line leading-9 text-gray-700">
              {product.description}
            </p>
          </section>

          <RelatedProducts
            productId={product.id}
          />
        </div>
      </main>

      <Footer />
    </>
  );
}

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
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