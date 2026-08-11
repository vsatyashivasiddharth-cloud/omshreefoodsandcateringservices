import type { Metadata } from "next";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/footer";
import CateringContent from "@/components/catering/CateringContent";
import { siteConfig } from "@/lib/site";

const siteUrl =
  "https://www.omshreefoodsandcaterers.com";

const cateringUrl = `${siteUrl}/catering`;

const businessImageUrl =
  `${siteUrl}${siteConfig.image}`;

export const metadata: Metadata = {
  title:
    "Catering Services for Weddings, Parties & Events",

  description:
    "Book authentic catering services in Hyderabad for weddings, birthdays, family functions, corporate events and special occasions from Om Shree Foods & Caterers.",

  alternates: {
    canonical: "/catering",
  },

  openGraph: {
    type: "website",
    url: "/catering",
    locale: "en_IN",
    siteName: siteConfig.name,
    title:
      "Catering Services in Hyderabad | Om Shree Foods",
    description:
      "Authentic catering for weddings, birthdays, family functions, corporate events and special occasions in Hyderabad.",
    images: [
      {
        url: businessImageUrl,
        alt: `${siteConfig.name} in Hyderabad`,
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title:
      "Catering Services in Hyderabad",
    description:
      "Authentic catering for weddings, birthdays, family functions, corporate events and special occasions.",
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

function serializeStructuredData(
  value: Record<string, unknown>,
) {
  return JSON.stringify(value).replace(
    /</g,
    "\\u003c",
  );
}

const providerStructuredData = {
  "@type": "FoodEstablishment",
  "@id": `${siteUrl}/#organization`,
  name: siteConfig.name,
  alternateName: siteConfig.shortName,
  legalName: siteConfig.tradeName,
  url: siteUrl,
  image: businessImageUrl,
  logo: businessImageUrl,
  description: siteConfig.description,
  telephone: `+91${siteConfig.phone}`,
  email: siteConfig.email,
  priceRange: "â‚¹â‚¹",

  servesCuisine: [
    "Andhra",
    "South Indian",
    "Indian",
    "Vegetarian",
  ],

  address: {
    "@type": "PostalAddress",
    streetAddress:
      siteConfig.addressDetails.streetAddress,
    addressLocality:
      siteConfig.addressDetails.addressLocality,
    addressRegion:
      siteConfig.addressDetails.addressRegion,
    postalCode:
      siteConfig.addressDetails.postalCode,
    addressCountry:
      siteConfig.addressDetails.addressCountry,
  },
};

const serviceStructuredData = {
  "@context": "https://schema.org",
  "@type": "Service",
  "@id": `${cateringUrl}#service`,
  name: `Catering Services by ${siteConfig.name}`,
  serviceType: "Catering Services",
  url: cateringUrl,
  image: businessImageUrl,
  description:
    "Authentic catering services for weddings, birthdays, family functions, corporate events and special occasions in Hyderabad.",

  provider: providerStructuredData,

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

      <main className="pt-6">
        <CateringContent />
      </main>

      <Footer />
    </>
  );
}
