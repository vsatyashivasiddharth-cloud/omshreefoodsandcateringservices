import type { Metadata } from "next";

import Footer from "@/components/layout/footer";
import Navbar from "@/components/layout/Navbar/Navbar";
import TrackOrderContent from "@/components/track-order/TrackOrderContent";

const baseUrl =
  "https://www.omshreefoodsandcaterers.com";

const pageUrl = `${baseUrl}/track-order`;

export const metadata: Metadata = {
  title: "Track Your Order",
  description:
    "Track your recent Om Shree Foods & Caterers order and check its current delivery status securely using your registered mobile number.",

  alternates: {
    canonical: "/track-order",
  },

  openGraph: {
    title:
      "Track Your Order | Om Shree Foods & Caterers",
    description:
      "Check your Om Shree Foods & Caterers order and delivery status using your registered mobile number.",
    url: pageUrl,
    siteName: "Om Shree Foods & Caterers",
    type: "website",
    locale: "en_IN",
  },

  twitter: {
    card: "summary",
    title:
      "Track Your Order | Om Shree Foods & Caterers",
    description:
      "Check your recent order and delivery status using your registered mobile number.",
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
      name: "Track Order",
      item: pageUrl,
    },
  ],
};

export default function TrackOrderPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbSchema,
          ).replace(/</g, "\\u003c"),
        }}
      />

      <Navbar />

      <TrackOrderContent />

      <Footer />
    </>
  );
}