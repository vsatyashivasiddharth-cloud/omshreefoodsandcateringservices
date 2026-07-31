import type { Metadata } from "next";
import { Sparkles } from "lucide-react";

import Footer from "@/components/layout/footer";
import Navbar from "@/components/layout/Navbar";
import ShopContent from "@/components/shop/ShopContent";

export const dynamic = "force-dynamic";

const siteUrl =
  "https://www.omshreefoodsandcaterers.com";

const shopUrl = `${siteUrl}/shop`;

const brandName =
  "Om Shree Foods & Caterers";

interface ShopPageProps {
  searchParams: Promise<
    Record<string, string | string[] | undefined>
  >;
}

function hasActiveFilters(
  searchParams: Record<
    string,
    string | string[] | undefined
  >,
) {
  return Object.values(searchParams).some(
    (value) => {
      if (Array.isArray(value)) {
        return value.some(
          (item) => item.trim().length > 0,
        );
      }

      return Boolean(value?.trim());
    },
  );
}

function serializeStructuredData(
  value: Record<string, unknown>,
) {
  return JSON.stringify(value).replace(
    /</g,
    "\\u003c",
  );
}

export async function generateMetadata({
  searchParams,
}: ShopPageProps): Promise<Metadata> {
  const resolvedSearchParams =
    await searchParams;

  const filtered = hasActiveFilters(
    resolvedSearchParams,
  );

  const title =
    "Shop Homemade Snacks, Pickles, Sweets & Spice Powders";

  const description =
    "Shop freshly prepared murukulu, chekkalu, mixture, homemade pickles, Indian sweets, spice powders and traditional Andhra foods from Om Shree Foods & Caterers.";

  return {
    title,
    description,

    alternates: {
      canonical: "/shop",
    },

    openGraph: {
      type: "website",
      url: "/shop",
      locale: "en_IN",
      siteName: brandName,
      title: `${title} | ${brandName}`,
      description,
    },

    twitter: {
      card: "summary_large_image",
      title,
      description,
    },

    robots: filtered
      ? {
          index: false,
          follow: true,
          googleBot: {
            index: false,
            follow: true,
          },
        }
      : {
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
}

const collectionStructuredData = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "@id": `${shopUrl}#collection`,
  url: shopUrl,
  name:
    "Shop Homemade Products | Om Shree Foods & Caterers",
  description:
    "Browse authentic homemade Andhra snacks, pickles, sweets, spice powders and traditional delicacies.",
  isPartOf: {
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    url: siteUrl,
    name: brandName,
  },
  about: {
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    name: brandName,
    url: siteUrl,
  },
  mainEntity: {
    "@type": "ItemList",
    name:
      "Homemade Food Products",
    itemListOrder:
      "https://schema.org/ItemListUnordered",
  },
};

const breadcrumbStructuredData = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "@id": `${shopUrl}#breadcrumb`,
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
      item: shopUrl,
    },
  ],
};

export default function ShopPage() {
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

      <main className="min-h-screen bg-gradient-to-b from-[#FFFDF8] via-[#FFF8EE] to-white pt-28">
        <section className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-40 top-0 h-96 w-96 rounded-full bg-[#FFE7B8]/35 blur-3xl"
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-[#FFE7B8]/35 blur-3xl"
          />

          <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
            <div className="mx-auto mb-14 max-w-3xl text-center lg:mb-16">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#F3D9A4] bg-[#FFF3DA] px-5 py-2 text-sm font-semibold text-[#A66A00] shadow-sm">
                <Sparkles
                  size={16}
                  aria-hidden="true"
                />

                Our Collection
              </div>

              <h1 className="mt-6 text-4xl font-bold leading-tight text-[#6D2E00] sm:text-5xl md:text-6xl">
                Shop Homemade Products
              </h1>

              <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-gray-600">
                Discover freshly prepared murukulu,
                chekkalu, mixture, homemade pickles,
                sweets, spice powders and traditional
                delicacies made with authentic recipes
                and premium ingredients.
              </p>
            </div>

            <ShopContent />
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}