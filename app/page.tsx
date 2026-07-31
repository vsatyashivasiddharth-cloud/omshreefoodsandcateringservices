import type { Metadata } from "next";

import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/home/hero";
import Categories from "@/components/home/categories";
import FeaturedProducts from "@/components/home/featured-products";
import WhyChooseUs from "@/components/home/why-choose-us";
import Catering from "@/components/home/catering";
import Testimonials from "@/components/home/testimonials";
import WhatsAppCTA from "@/components/home/whatsapp-cta";
import FAQ from "@/components/home/faq";
import Footer from "@/components/layout/footer";
import { siteConfig } from "@/lib/site";

const siteUrl =
  "https://www.omshreefoodsandcaterers.com";

export const metadata: Metadata = {
  title:
    "Homemade Snacks, Pickles, Sweets & Catering",

  description:
    "Shop authentic Andhra snacks such as murukulu, chekkalu, mixture and ribbon pakoda, homemade pickles, sweets, spice powders and premium catering services from Om Shree Foods & Caterers.",

  alternates: {
    canonical: "/",
  },

  openGraph: {
    type: "website",
    url: "/",
    title:
      "Homemade Snacks, Pickles, Sweets & Catering | Om Shree Foods",
    description:
      "Discover authentic homemade Andhra snacks, pickles, sweets, spice powders and premium catering services.",
    siteName:
      "Om Shree Foods & Caterers",
    locale: "en_IN",
  },

  twitter: {
    card: "summary_large_image",
    title:
      "Homemade Snacks, Pickles, Sweets & Catering",
    description:
      "Authentic homemade Andhra snacks, pickles, sweets, spice powders and catering services.",
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
  description: siteConfig.description,

  publisher: {
    "@id": `${siteUrl}/#organization`,
  },

  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${siteUrl}/search?q={search_term_string}`,
    },
    "query-input":
      "required name=search_term_string",
  },
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            organizationStructuredData,
          ),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            websiteStructuredData,
          ),
        }}
      />

      <Navbar />
      <Hero />
      <Categories />
      <FeaturedProducts />
      <WhyChooseUs />
      <Catering />
      <Testimonials />
      <WhatsAppCTA />
      <FAQ />
      <Footer />
    </>
  );
}