import type { Metadata } from "next";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/footer";
import AboutContent from "@/components/about/AboutContent";
import { siteConfig } from "@/lib/site";

const siteUrl =
  "https://www.omshreefoodsandcaterers.com";

const aboutUrl = `${siteUrl}/about`;

const businessImageUrl =
  `${siteUrl}${siteConfig.image}`;

export const metadata: Metadata = {
  title: "About Us",

  description:
    "Learn about Om Shree Foods & Caterers in Hyderabad, our authentic homemade foods, traditional recipes, quality ingredients and dependable catering services.",

  alternates: {
    canonical: "/about",
  },

  openGraph: {
    type: "website",
    url: "/about",
    locale: "en_IN",
    siteName: siteConfig.name,
    title:
      "About Om Shree Foods & Caterers",
    description:
      "Discover our story, homemade products, traditional recipes and catering services in Hyderabad.",
    images: [
      {
        url: businessImageUrl,
        alt: `${siteConfig.name} shop in Hyderabad`,
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title:
      "About Om Shree Foods & Caterers",
    description:
      "Discover our story, homemade products, traditional recipes and catering services in Hyderabad.",
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

const organizationStructuredData = {
  "@context": "https://schema.org",
  "@type": [
    "Organization",
    "FoodEstablishment",
  ],
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
  priceRange: "₹₹",

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

  areaServed: [
    {
      "@type": "City",
      name: "Hyderabad",
    },
    {
      "@type": "AdministrativeArea",
      name: "Telangana",
    },
    {
      "@type": "Country",
      name: "India",
    },
  ],

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

  sameAs: [
    siteConfig.social.instagram,
    siteConfig.social.facebook,
    siteConfig.social.youtube,
  ].filter(Boolean),
};

const aboutPageStructuredData = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  "@id": `${aboutUrl}#about-page`,
  url: aboutUrl,
  name: `About ${siteConfig.name}`,
  description:
    "Learn about Om Shree Foods & Caterers, our traditional homemade foods and catering services in Hyderabad.",
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
    "@id": `${siteUrl}/#organization`,
  },
};

const breadcrumbStructuredData = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "@id": `${aboutUrl}#breadcrumb`,
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
      name: "About",
      item: aboutUrl,
    },
  ],
};

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeStructuredData(
            organizationStructuredData,
          ),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeStructuredData(
            aboutPageStructuredData,
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
        <AboutContent />
      </main>

      <Footer />
    </>
  );
}