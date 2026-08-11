import type { Metadata } from "next";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/footer";
import ContactContent from "@/components/contact/ContactContent";
import { siteConfig } from "@/lib/site";

const siteUrl =
  "https://www.omshreefoodsandcaterers.com";

const contactUrl = `${siteUrl}/contact`;

const businessImageUrl =
  `${siteUrl}${siteConfig.image}`;

export const metadata: Metadata = {
  title: "Contact Us",

  description:
    "Contact Om Shree Foods & Caterers in Moin Bagh, Hyderabad for homemade snacks, pickles, sweets, product orders and catering enquiries.",

  alternates: {
    canonical: "/contact",
  },

  openGraph: {
    type: "website",
    url: "/contact",
    locale: "en_IN",
    siteName: siteConfig.name,
    title:
      "Contact Om Shree Foods & Caterers",
    description:
      "Get in touch for homemade food orders, catering enquiries and customer support in Hyderabad.",
    images: [
      {
        url: businessImageUrl,
        alt: `${siteConfig.name} storefront in Hyderabad`,
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title:
      "Contact Om Shree Foods & Caterers",
    description:
      "Get in touch for homemade food orders, catering enquiries and customer support in Hyderabad.",
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

  contactPoint: [
    {
      "@type": "ContactPoint",
      telephone: `+91${siteConfig.phone}`,
      contactType: "customer service",
      areaServed: "IN",
      availableLanguage: [
        "English",
        "Telugu",
      ],
    },
    {
      "@type": "ContactPoint",
      email: siteConfig.email,
      contactType: "customer support",
      areaServed: "IN",
      availableLanguage: [
        "English",
        "Telugu",
      ],
    },
  ],

  sameAs: [
    siteConfig.social.instagram,
    siteConfig.social.facebook,
    siteConfig.social.youtube,
  ].filter(Boolean),
};

const contactPageStructuredData = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  "@id": `${contactUrl}#contact-page`,
  url: contactUrl,
  name: `Contact ${siteConfig.name}`,
  description:
    "Contact Om Shree Foods & Caterers for homemade food orders, catering enquiries and customer support in Hyderabad.",

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

  mainEntity: {
    "@id": `${siteUrl}/#organization`,
  },
};

const breadcrumbStructuredData = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "@id": `${contactUrl}#breadcrumb`,
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
      name: "Contact",
      item: contactUrl,
    },
  ],
};

export default function ContactPage() {
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
            contactPageStructuredData,
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
        <ContactContent />
      </main>

      <Footer />
    </>
  );
}
