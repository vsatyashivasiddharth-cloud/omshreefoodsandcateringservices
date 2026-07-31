import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  FolderOpen,
  PackageSearch,
} from "lucide-react";

import prisma from "@/lib/prisma";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/footer";

import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

export const dynamic = "force-dynamic";

const siteUrl =
  "https://www.omshreefoodsandcaterers.com";

const categoriesUrl = `${siteUrl}/categories`;

const brandName =
  "Om Shree Foods & Caterers";

export const metadata: Metadata = {
  title: "Food Categories",

  description:
    "Browse homemade Andhra snacks, pickles, sweets, spice powders and traditional food categories from Om Shree Foods & Caterers.",

  alternates: {
    canonical: "/categories",
  },

  openGraph: {
    type: "website",
    url: "/categories",
    locale: "en_IN",
    siteName: brandName,
    title:
      "Food Categories | Om Shree Foods & Caterers",
    description:
      "Explore homemade snacks, pickles, sweets, spice powders and traditional Andhra food categories.",
  },

  twitter: {
    card: "summary_large_image",
    title:
      "Food Categories | Om Shree Foods & Caterers",
    description:
      "Explore homemade snacks, pickles, sweets, spice powders and traditional Andhra food categories.",
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
};

function getAbsoluteUrl(
  value: string | null,
) {
  if (!value) {
    return undefined;
  }

  try {
    return new URL(value, siteUrl).toString();
  } catch {
    return undefined;
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

export default async function CategoriesPage() {
  const categories =
    await prisma.category.findMany({
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

  const collectionStructuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${categoriesUrl}#collection`,
    url: categoriesUrl,
    name:
      "Food Categories | Om Shree Foods & Caterers",
    description:
      "Browse homemade snacks, pickles, sweets, spice powders and traditional Andhra food categories.",
    isPartOf: {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: brandName,
    },
    mainEntity: {
      "@type": "ItemList",
      name: "Food Categories",
      numberOfItems: categories.length,
      itemListOrder:
        "https://schema.org/ItemListOrderAscending",
      itemListElement: categories.map(
        (category, index) => {
          const categoryUrl =
            `${siteUrl}/shop?category=${encodeURIComponent(
              category.slug,
            )}`;

          const image = getAbsoluteUrl(
            category.image,
          );

          return {
            "@type": "ListItem",
            position: index + 1,
            url: categoryUrl,
            item: {
              "@type": "Thing",
              "@id": categoryUrl,
              name: category.name,
              url: categoryUrl,
              ...(image
                ? {
                    image,
                  }
                : {}),
              additionalProperty: {
                "@type": "PropertyValue",
                name: "Product count",
                value:
                  category._count.products,
              },
            },
          };
        },
      ),
    },
  };

  const breadcrumbStructuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${categoriesUrl}#breadcrumb`,
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
        name: "Categories",
        item: categoriesUrl,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeStructuredData(
            collectionStructuredData,
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

      <main className="min-h-screen bg-gradient-to-br from-[#FFFDF8] via-white to-[#FFF6E9] pt-28">
        <section className="border-b border-[#F3DFC2] bg-[#FFF4DE]">
          <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8 lg:py-20">
            <Badge
              variant="warning"
              size="md"
              rounded
            >
              Browse by Category
            </Badge>

            <h1 className="mt-5 text-4xl font-bold tracking-tight text-[#6D2E00] sm:text-5xl">
              Explore Our Food Categories
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-gray-600">
              Discover traditional Andhra foods,
              homemade snacks, pickles, sweets and
              freshly prepared favourites from Om
              Shree Foods &amp; Caterers.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          {categories.length === 0 ? (
            <Card
              variant="outlined"
              padding="lg"
              className="mx-auto max-w-2xl text-center"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#FFF4DE] text-[#C89B3C]">
                <FolderOpen
                  size={30}
                  aria-hidden="true"
                />
              </div>

              <h2 className="mt-5 text-2xl font-bold text-[#6D2E00]">
                No Categories Available
              </h2>

              <p className="mt-3 text-gray-600">
                Categories will appear here once
                they are added.
              </p>

              <Link
                href="/shop"
                className="mt-6 inline-block"
              >
                <Button
                  variant="primary"
                  rightIcon={
                    <ArrowRight
                      size={18}
                      aria-hidden="true"
                    />
                  }
                >
                  Browse All Products
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {categories.map(
                (category) => (
                  <Link
                    key={category.id}
                    href={`/shop?category=${encodeURIComponent(
                      category.slug,
                    )}`}
                    className="group block"
                  >
                    <Card
                      padding="none"
                      hover
                      className="h-full overflow-hidden"
                    >
                      <div className="relative h-56 overflow-hidden bg-[#FFF4DE]">
                        {category.image ? (
                          <Image
                            src={category.image}
                            alt={category.name}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                            className="object-cover transition duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[#C89B3C]">
                            <PackageSearch
                              size={48}
                              aria-hidden="true"
                            />
                          </div>
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />

                        <div className="absolute bottom-4 left-4">
                          <Badge
                            variant="warning"
                            rounded
                          >
                            {
                              category._count
                                .products
                            }{" "}
                            {category._count
                              .products === 1
                              ? "Product"
                              : "Products"}
                          </Badge>
                        </div>
                      </div>

                      <div className="p-5">
                        <div className="flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <h2 className="truncate text-xl font-bold text-[#6D2E00]">
                              {category.name}
                            </h2>

                            <p className="mt-2 text-sm leading-6 text-gray-500">
                              Explore products in
                              this category.
                            </p>
                          </div>

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FFF4DE] text-[#6D2E00] transition group-hover:translate-x-1 group-hover:bg-[#6D2E00] group-hover:text-white">
                            <ArrowRight
                              size={18}
                              aria-hidden="true"
                            />
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ),
              )}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </>
  );
}