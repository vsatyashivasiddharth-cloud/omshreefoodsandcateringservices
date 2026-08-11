import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  Drumstick,
} from "lucide-react";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/footer";
import Container from "@/components/ui/Container";
import CateringPlateGrid from "@/components/catering/CateringPlateGrid";
import {
  nonVegCateringPlates,
} from "@/lib/catering-plates";
import { siteConfig } from "@/lib/site";

const siteUrl =
  "https://www.omshreefoodsandcaterers.com";

const nonVegPlatesUrl =
  `${siteUrl}/catering/plates/non-veg`;

const defaultImageUrl =
  `${siteUrl}${siteConfig.image}`;

export const metadata: Metadata = {
  title: "Non-Vegetarian Catering Plates",

  description:
    "Explore Basic, Standard, Gold and Diamond non-vegetarian catering packages in Hyderabad from Om Shree Foods & Caterers.",

  alternates: {
    canonical:
      "/catering/plates/non-veg",
  },

  openGraph: {
    type: "website",
    url: "/catering/plates/non-veg",
    locale: "en_IN",
    siteName: siteConfig.name,
    title:
      "Non-Vegetarian Catering Plates | Om Shree Foods & Caterers",
    description:
      "Explore non-vegetarian catering menus for weddings, parties, family functions and special occasions in Hyderabad.",
    images: [
      {
        url: defaultImageUrl,
        alt: `${siteConfig.name} non-vegetarian catering services`,
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title:
      "Non-Vegetarian Catering Plates | Om Shree Foods & Caterers",
    description:
      "Explore Basic, Standard, Gold and Diamond non-vegetarian catering packages.",
    images: [defaultImageUrl],
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

function serializeStructuredData(
  value: Record<string, unknown>,
) {
  return JSON.stringify(value).replace(
    /</g,
    "\\u003c",
  );
}

const collectionStructuredData = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "@id": `${nonVegPlatesUrl}#collection`,
  url: nonVegPlatesUrl,
  name: `Non-Vegetarian Catering Plates | ${siteConfig.name}`,
  description:
    "Basic, Standard, Gold and Diamond non-vegetarian catering packages for weddings, parties, family functions and events in Hyderabad.",

  primaryImageOfPage: {
    "@type": "ImageObject",
    url: defaultImageUrl,
  },

  isPartOf: {
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    url: siteUrl,
    name: siteConfig.name,
  },

  about: {
    "@type": "Service",
    "@id": `${siteUrl}/catering#service`,
    name: `Non-Vegetarian Catering Services by ${siteConfig.name}`,
    url: `${siteUrl}/catering`,
    provider: {
      "@id": `${siteUrl}/#organization`,
    },
    areaServed: [
      {
        "@type": "City",
        name: "Hyderabad",
      },
      {
        "@type": "AdministrativeArea",
        name: "Telangana",
      },
    ],
  },

  mainEntity: {
    "@type": "ItemList",
    name:
      "Non-Vegetarian Catering Plate Packages",
    numberOfItems:
      nonVegCateringPlates.length,
    itemListOrder:
      "https://schema.org/ItemListOrderAscending",

    itemListElement:
      nonVegCateringPlates.map(
        (plate, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: `${nonVegPlatesUrl}#${plate.slug}`,
          item: {
            "@type": "Service",
            "@id": `${nonVegPlatesUrl}#${plate.slug}`,
            name: plate.name,
            description: plate.description,
            url: `${nonVegPlatesUrl}#${plate.slug}`,
            image: `${siteUrl}${plate.image}`,
            serviceType:
              "Non-Vegetarian Catering Plate Package",
            category:
              "Non-Vegetarian Catering",
            provider: {
              "@id": `${siteUrl}/#organization`,
            },
            areaServed: {
              "@type": "City",
              name: "Hyderabad",
            },
          },
        }),
      ),
  },
};

const breadcrumbStructuredData = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "@id": `${nonVegPlatesUrl}#breadcrumb`,
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
      name: "Catering",
      item: `${siteUrl}/catering`,
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "Catering Plates",
      item: `${siteUrl}/catering/plates`,
    },
    {
      "@type": "ListItem",
      position: 4,
      name:
        "Non-Vegetarian Catering Plates",
      item: nonVegPlatesUrl,
    },
  ],
};

export default function NonVegPlatesPage() {
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

      <main className="min-h-screen bg-gradient-to-b from-[#FFFDF8] via-[#FFF8EE] to-white pt-6">
        <section className="py-10 sm:py-12">
          <Container>
            <Link
              href="/catering/plates"
              className="inline-flex items-center gap-2 font-semibold text-[#8B4513] transition hover:text-[#6D2E00] focus:outline-none focus:ring-4 focus:ring-[#C89B3C]/20"
            >
              <ArrowLeft
                size={18}
                aria-hidden="true"
              />

              All Catering Plates
            </Link>

            <div className="mx-auto mb-14 mt-8 max-w-3xl text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FCE8E4] text-red-700">
                <Drumstick
                  size={32}
                  aria-hidden="true"
                />
              </div>

              <h1 className="mt-6 text-4xl font-bold text-[#6D2E00] sm:text-5xl">
                Non-Vegetarian Catering Plates
              </h1>

              <p className="mt-5 text-lg leading-8 text-gray-600">
                Explore our Basic, Standard, Gold
                and Diamond non-vegetarian
                catering menus for weddings,
                parties, family functions and
                special occasions.
              </p>
            </div>

            <CateringPlateGrid
              plates={nonVegCateringPlates}
            />
          </Container>
        </section>
      </main>

      <Footer />
    </>
  );
}
