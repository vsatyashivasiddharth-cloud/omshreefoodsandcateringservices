import type { Metadata } from "next";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/footer";
import FAQContent from "@/components/faq/FAQContent";

import { faqs } from "@/lib/constants/faq";
import { siteConfig } from "@/lib/site";

const baseUrl =
  "https://www.omshreefoodsandcaterers.com";

const pageUrl = `${baseUrl}/faq`;

const title =
  "Frequently Asked Questions";

const description =
  "Find answers about Om Shree Foods & Caterers products, homemade food, catering services, ordering, payments, delivery and special requests.";

export const metadata: Metadata = {
  title,
  description,

  alternates: {
    canonical: "/faq",
  },

  openGraph: {
    title: `${title} | ${siteConfig.name}`,
    description,
    url: pageUrl,
    siteName: siteConfig.name,
    type: "website",
    locale: "en_IN",
    images: [
      {
        url: "/images/about/shop-front.png",
        width: 1195,
        height: 896,
        alt: `${siteConfig.name} business location`,
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: `${title} | ${siteConfig.name}`,
    description,
    images: [
      "/images/about/shop-front.png",
    ],
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

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "@id": `${pageUrl}#breadcrumb`,
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: baseUrl,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Frequently Asked Questions",
      item: pageUrl,
    },
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "@id": `${pageUrl}#faq`,
  url: pageUrl,
  name: title,
  description,
  inLanguage: "en-IN",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

export default function FAQPage() {
  return (
    <>
      <Navbar />

      <main className="pt-6">
        <FAQContent />
      </main>

      <Footer />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbSchema,
          ).replace(/</g, "\\u003c"),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            faqSchema,
          ).replace(/</g, "\\u003c"),
        }}
      />
    </>
  );
}
