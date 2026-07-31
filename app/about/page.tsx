import type { Metadata } from "next";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/footer";
import AboutContent from "@/components/about/AboutContent";
import { siteConfig } from "@/lib/site";

const siteUrl =
  "https://www.omshreefoodsandcaterers.com";

const aboutUrl = `${siteUrl}/about`;

export const metadata: Metadata = {
  title: "About Us",

  description:
    "Learn about Om Shree Foods & Caterers, our commitment to authentic homemade Andhra foods, quality ingredients, traditional recipes and dependable catering services.",

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
      "Discover our story, traditional recipes, homemade products, quality ingredients and catering services.",
  },

  twitter: {
    card: "summary_large_image",
    title:
      "About Om Shree Foods & Caterers",
    description:
      "Discover our story, traditional recipes, homemade products, quality ingredients and catering services.",
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

const aboutPageStructuredData = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  "@id": `${aboutUrl}#about-page`,
  url: aboutUrl,
  name: `About ${siteConfig.name}`,
  description:
    "Learn about Om Shree Foods & Caterers, our traditional recipes, homemade food products, premium ingredients and catering services.",

  isPartOf: {
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    url: siteUrl,
    name: siteConfig.name,
  },

  about: {
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    name: siteConfig.name,
    alternateName: siteConfig.shortName,
    url: siteUrl,
    description: siteConfig.description,
    telephone: `+91${siteConfig.phone}`,
    email: siteConfig.email,

    address: {
      "@type": "PostalAddress",
      addressRegion: "Andhra Pradesh",
      addressCountry: "IN",
    },

    areaServed: {
      "@type": "Country",
      name: "India",
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

    sameAs: [
      siteConfig.social.instagram,
      siteConfig.social.facebook,
      siteConfig.social.youtube,
    ].filter(Boolean),
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