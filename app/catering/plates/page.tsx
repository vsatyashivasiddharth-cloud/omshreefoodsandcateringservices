import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Drumstick,
  Leaf,
  Sparkles,
} from "lucide-react";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/footer";
import Container from "@/components/ui/Container";
import { siteConfig } from "@/lib/site";

const siteUrl =
  "https://www.omshreefoodsandcaterers.com";

const platesUrl = `${siteUrl}/catering/plates`;

const businessImageUrl =
  `${siteUrl}${siteConfig.image}`;

export const metadata: Metadata = {
  title: "Catering Plates",

  description:
    "Explore vegetarian and non-vegetarian catering plate packages in Hyderabad from Om Shree Foods & Caterers.",

  alternates: {
    canonical: "/catering/plates",
  },

  openGraph: {
    type: "website",
    url: "/catering/plates",
    locale: "en_IN",
    siteName: siteConfig.name,
    title:
      "Catering Plates | Om Shree Foods & Caterers",
    description:
      "Explore Basic, Standard, Gold and Diamond vegetarian and non-vegetarian catering packages.",
    images: [
      {
        url: businessImageUrl,
        alt: `${siteConfig.name} catering services in Hyderabad`,
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title:
      "Catering Plates | Om Shree Foods & Caterers",
    description:
      "Explore vegetarian and non-vegetarian catering packages for weddings, parties and events.",
    images: [businessImageUrl],
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

const options = [
  {
    title: "Veg Plates",
    description:
      "Explore Basic, Standard, Gold and Diamond vegetarian catering packages.",
    href: "/catering/plates/veg",
    icon: Leaf,
  },
  {
    title: "Non-Veg Plates",
    description:
      "Explore Basic, Standard, Gold and Diamond non-vegetarian catering packages.",
    href: "/catering/plates/non-veg",
    icon: Drumstick,
  },
] as const;

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
  "@id": `${platesUrl}#collection`,
  url: platesUrl,
  name: `Catering Plates | ${siteConfig.name}`,
  description:
    "Vegetarian and non-vegetarian catering plate collections for weddings, parties, corporate events and family functions.",

  primaryImageOfPage: {
    "@type": "ImageObject",
    url: businessImageUrl,
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
    name: `Catering Services by ${siteConfig.name}`,
    url: `${siteUrl}/catering`,
    provider: {
      "@id": `${siteUrl}/#organization`,
    },
  },

  mainEntity: {
    "@type": "ItemList",
    name: "Catering Plate Collections",
    numberOfItems: options.length,
    itemListOrder:
      "https://schema.org/ItemListOrderAscending",
    itemListElement: options.map(
      (option, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${siteUrl}${option.href}`,
        item: {
          "@type": "Service",
          "@id": `${siteUrl}${option.href}#collection`,
          name: option.title,
          url: `${siteUrl}${option.href}`,
          description: option.description,
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
      }),
    ),
  },
};

const breadcrumbStructuredData = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "@id": `${platesUrl}#breadcrumb`,
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
      item: platesUrl,
    },
  ],
};

export default function CateringPlatesPage() {
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
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#E8C784] bg-[#FFF1D5] px-5 py-2 text-sm font-semibold text-[#8B4513]">
                <Sparkles
                  size={16}
                  aria-hidden="true"
                />

                Catering Packages
              </div>

              <h1 className="mt-6 text-4xl font-bold text-[#6D2E00] sm:text-5xl">
                Choose Your Catering Plate
              </h1>

              <p className="mt-5 text-lg leading-8 text-gray-600">
                Select vegetarian or
                non-vegetarian catering packages
                and explore our Basic, Standard,
                Gold and Diamond menus.
              </p>
            </div>

            <div className="mx-auto mt-14 grid max-w-5xl gap-7 md:grid-cols-2">
              {options.map((option) => {
                const Icon = option.icon;

                return (
                  <Link
                    key={option.title}
                    href={option.href}
                    className="group rounded-[32px] border border-[#EFD8AE] bg-white p-8 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-[#C89B3C]/25 sm:p-10"
                  >
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFF1D5] text-[#6D2E00] transition-transform duration-300 group-hover:scale-110">
                      <Icon
                        size={32}
                        aria-hidden="true"
                      />
                    </div>

                    <h2 className="mt-7 text-3xl font-bold text-[#6D2E00]">
                      {option.title}
                    </h2>

                    <p className="mt-4 leading-7 text-gray-600">
                      {option.description}
                    </p>

                    <div className="mt-8 inline-flex items-center gap-2 font-semibold text-[#8B4513]">
                      View Packages

                      <ArrowRight
                        size={19}
                        aria-hidden="true"
                        className="transition-transform group-hover:translate-x-1"
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          </Container>
        </section>
      </main>

      <Footer />
    </>
  );
}
