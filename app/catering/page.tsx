import type { Metadata } from "next";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/footer";
import CateringContent from "@/components/catering/CateringContent";
import { siteConfig } from "@/lib/site";

const siteUrl =
  "https://www.omshreefoodsandcaterers.com";

const cateringUrl = `${siteUrl}/catering`;

export const metadata: Metadata = {
  title:
    "Catering Services for Weddings, Parties & Events",

  description:
    "Book authentic vegetarian catering services for weddings, birthdays, family functions, corporate events and special occasions from Om Shree Foods & Caterers.",

  alternates: {
    canonical: "/catering",
  },

  openGraph: {
    type: "website",
    url: "/catering",
    locale: "en_IN",
    siteName: siteConfig.name,
    title:
      "Catering Services for Weddings, Parties & Events | Om Shree Foods",
    description:
      "Authentic vegetarian catering for weddings, birthdays, family functions, corporate events and special occasions.",
  },

  twitter: {
    card: "summary_large_image",
    title:
      "Catering Services for Weddings, Parties & Events",
    description:
      "Authentic vegetarian catering for weddings, birthdays, family functions, corporate events and special occasions.",
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

const serviceStructuredData = {
  "@context": "https://schema.org",
  "@type": "Service",
  "@id": `${cateringUrl}#service`,
  name: `Catering Services by ${siteConfig.name}`,
  serviceType:
    "Vegetarian Catering Services",
  url: cateringUrl,
  description:
    "Authentic vegetarian catering services for weddings, birthdays, family functions, corporate events and special occasions.",

  provider: {
    "@type": "FoodEstablishment",
    "@id": `${siteUrl}/#organization`,
    name: siteConfig.name,
    alternateName: siteConfig.shortName,
    url: siteUrl,
    description: siteConfig.description,
    telephone: `+91${siteConfig.phone}`,
    email: siteConfig.email,
    priceRange: "₹₹",
    servesCuisine: [
      "Andhra",
      "South Indian",
      "Indian",
      "Vegetarian",
    ],
    address: {
      "@type": "PostalAddress",
      addressRegion: "Andhra Pradesh",
      addressCountry: "IN",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: `+91${siteConfig.phone}`,
      contactType: "customer service",
      areaServed: "IN",
      availableLanguage: [
        "English",
        "Telugu",
      ],
    },
  },

  areaServed: [
    {
      "@type": "AdministrativeArea",
      name: "Andhra Pradesh",
    },
    {
      "@type": "Country",
      name: "India",
    },
  ],

  audience: {
    "@type": "Audience",
    audienceType: [
      "Wedding customers",
      "Birthday parties",
      "Corporate events",
      "Family functions",
      "Special occasions",
    ],
  },

  category: [
    "Wedding Catering",
    "Birthday Catering",
    "Event Catering",
    "Corporate Catering",
    "Vegetarian Catering",
  ],
};

const breadcrumbStructuredData = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "@id": `${cateringUrl}#breadcrumb`,
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
      item: cateringUrl,
    },
  ],
};

export default function CateringPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeStructuredData(
            serviceStructuredData,
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

      <main className="pt-24">
        <CateringContent />
      </main>

      <Footer />
    </>
  );
}