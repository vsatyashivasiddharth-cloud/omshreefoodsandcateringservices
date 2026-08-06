import type { Metadata } from "next";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/footer";

import Hero from "@/components/home/hero";
import Categories from "@/components/home/categories";
import FeaturedProducts from "@/components/home/featured-products";
import WhyChooseUs from "@/components/home/why-choose-us";
import Catering from "@/components/home/catering";
import Testimonials from "@/components/home/testimonials";
import WhatsAppCTA from "@/components/home/whatsapp-cta";
import FAQ from "@/components/home/faq";

import { siteConfig } from "@/lib/site";

const siteUrl =
  "https://www.omshreefoodsandcaterers.com";

const businessImage =
  `${siteUrl}/images/about/shop-front.png`;

const pageTitle =
  "Homemade Andhra Snacks, Pickles, Sweets & Catering";

const pageDescription =
  "Shop authentic homemade Andhra snacks, pickles, sweets and spice powders from Om Shree Foods & Caterers in Hyderabad. Explore vegetarian and non-vegetarian catering packages for weddings, parties and special events.";

export const metadata: Metadata = {
  title: pageTitle,

  description: pageDescription,

  keywords: [
    "homemade snacks Hyderabad",
    "Andhra snacks online",
    "murukulu",
    "chekkalu",
    "ribbon pakoda",
    "homemade pickles",
    "Andhra pickles",
    "Indian sweets Hyderabad",
    "catering services Hyderabad",
    "wedding catering Hyderabad",
    "vegetarian catering plates",
    "non vegetarian catering plates",
    "Om Shree Foods and Caterers",
  ],

  alternates: {
    canonical: "/",
  },

  openGraph: {
    type: "website",
    url: siteUrl,
    title: `${pageTitle} | ${siteConfig.shortName}`,
    description: pageDescription,
    siteName: siteConfig.name,
    locale: "en_IN",

    images: [
      {
        url: businessImage,
        width: 1195,
        height: 896,
        alt: "Om Shree Foods and Caterers business entrance in Hyderabad",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: `${pageTitle} | ${siteConfig.shortName}`,
    description: pageDescription,
    images: [businessImage],
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

const organizationStructuredData = {
  "@context": "https://schema.org",

  "@type": [
    "Organization",
    "FoodEstablishment",
  ],

  "@id": `${siteUrl}/#organization`,

  name: siteConfig.name,

  alternateName: siteConfig.shortName,

  legalName:
    "Om Shree Foods and Catering Services",

  url: siteUrl,

  image: businessImage,

  logo: businessImage,

  description:
    "Authentic homemade Andhra snacks, pickles, sweets, spice powders and professional vegetarian and non-vegetarian catering services.",

  telephone: `+91${siteConfig.phone}`,

  email: siteConfig.email,

  priceRange: "₹₹",

  servesCuisine: [
    "Andhra",
    "South Indian",
    "Indian",
    "Vegetarian",
    "Non-Vegetarian",
  ],

  address: {
    "@type": "PostalAddress",

    streetAddress:
      "18-8-278/185/2/b, Ambikanagar Uppuguda Road, Moin Bagh",

    addressLocality: "Hyderabad",

    addressRegion: "Telangana",

    postalCode: "500058",

    addressCountry: "IN",
  },

  areaServed: [
    {
      "@type": "City",
      name: "Hyderabad",
    },
    {
      "@type": "State",
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
  ],

  hasOfferCatalog: {
    "@type": "OfferCatalog",

    name:
      "Food Products and Catering Services",

    itemListElement: [
      {
        "@type": "OfferCatalog",
        name: "Homemade Snacks",
        url: `${siteUrl}/shop`,
      },
      {
        "@type": "OfferCatalog",
        name: "Pickles and Spice Powders",
        url: `${siteUrl}/shop`,
      },
      {
        "@type": "OfferCatalog",
        name: "Vegetarian Catering Plates",
        url: `${siteUrl}/catering/plates/veg`,
      },
      {
        "@type": "OfferCatalog",
        name: "Non-Vegetarian Catering Plates",
        url: `${siteUrl}/catering/plates/non-veg`,
      },
    ],
  },

  sameAs: [
    siteConfig.social.instagram,
    siteConfig.social.facebook,
    siteConfig.social.youtube,
  ].filter(Boolean),
};

const websiteStructuredData = {
  "@context": "https://schema.org",

  "@type": "WebSite",

  "@id": `${siteUrl}/#website`,

  url: siteUrl,

  name: siteConfig.name,

  alternateName: siteConfig.shortName,

  description: pageDescription,

  inLanguage: "en-IN",

  publisher: {
    "@id": `${siteUrl}/#organization`,
  },

  potentialAction: {
    "@type": "SearchAction",

    target: {
      "@type": "EntryPoint",

      urlTemplate:
        `${siteUrl}/search?q={search_term_string}`,
    },

    "query-input":
      "required name=search_term_string",
  },
};

const homePageStructuredData = {
  "@context": "https://schema.org",

  "@type": "WebPage",

  "@id": `${siteUrl}/#webpage`,

  url: siteUrl,

  name: `${pageTitle} | ${siteConfig.name}`,

  description: pageDescription,

  isPartOf: {
    "@id": `${siteUrl}/#website`,
  },

  about: {
    "@id": `${siteUrl}/#organization`,
  },

  primaryImageOfPage: {
    "@type": "ImageObject",
    url: businessImage,
    width: 1195,
    height: 896,
  },

  inLanguage: "en-IN",
};

function serializeStructuredData(
  data: Record<string, unknown>,
) {
  return JSON.stringify(data).replace(
    /</g,
    "\\u003c",
  );
}

export default function HomePage() {
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
            websiteStructuredData,
          ),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeStructuredData(
            homePageStructuredData,
          ),
        }}
      />

      <Navbar />

      <main>
        <Hero />

        <Categories />

        <FeaturedProducts />

        <WhyChooseUs />

        <Catering />

        <Testimonials />

        <WhatsAppCTA />

        <FAQ />
      </main>

      <Footer />
    </>
  );
}