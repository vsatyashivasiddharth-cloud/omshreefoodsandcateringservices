import type {
  Metadata,
  Viewport,
} from "next";
import type { ReactNode } from "react";

import "./globals.css";

import Providers from "@/components/providers/Providers";
import { Toaster } from "sonner";

import { siteConfig } from "@/lib/site";

const siteUrl =
  "https://www.omshreefoodsandcaterers.com";

const defaultTitle =
  "Om Shree Foods & Caterers";

const defaultDescription =
  "Shop authentic homemade Andhra and Telangana snacks, sweets, pickles, spice powders and traditional foods, or book premium catering services from Om Shree Foods & Caterers in Hyderabad.";

const socialImage =
  "/images/about/shop-front.png";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  applicationName: siteConfig.name,

  title: {
    default: defaultTitle,
    template: `%s | ${siteConfig.name}`,
  },

  description: defaultDescription,

  keywords: [
    "Om Shree Foods",
    "Om Shree Foods and Caterers",
    "Om Shree Foods Hyderabad",
    "homemade snacks Hyderabad",
    "Indian snacks",
    "Andhra snacks",
    "Telangana snacks",
    "traditional snacks",
    "Murukulu",
    "Murukku",
    "Chekkalu",
    "Sakinalu",
    "Janthikalu",
    "Kara Boondi",
    "Mixture",
    "Ribbon Pakoda",
    "hot items",
    "homemade pickles",
    "Andhra pickles",
    "Telangana pickles",
    "Mango Pickle",
    "Avakaya Pickle",
    "Gongura Pickle",
    "Lemon Pickle",
    "Tomato Pickle",
    "Chicken Pickle",
    "Chicken Boneless Pickle",
    "Mutton Pickle",
    "Mutton Boneless Pickle",
    "Usirikaya Pickle",
    "Kandi Podi",
    "Vellilu Karam",
    "Nalla Karam",
    "Kakarakaya Karam",
    "Indian sweets",
    "Laddu",
    "Boondi Laddu",
    "Ariselu",
    "Kajjikayalu",
    "spice powders",
    "Karam Podi",
    "Curry Leaf Powder",
    "Idli Karam",
    "catering services Hyderabad",
    "wedding catering Hyderabad",
    "birthday catering Hyderabad",
    "vegetarian catering plates",
    "non vegetarian catering plates",
    "traditional food Hyderabad",
    "online homemade food store",
  ],

  authors: [
    {
      name: siteConfig.name,
      url: siteUrl,
    },
  ],

  creator: siteConfig.name,
  publisher: siteConfig.name,
  category: "Food and Catering",

  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteUrl,
    siteName: siteConfig.name,
    title: defaultTitle,
    description: defaultDescription,

    images: [
      {
        url: socialImage,
        width: 1195,
        height: 896,
        alt: `${siteConfig.name} storefront in Hyderabad`,
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: defaultDescription,
    images: [socialImage],
  },

  robots: {
    index: true,
    follow: true,

    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },

  other: {
    "geo.region": "IN-TG",
    "geo.placename": "Hyderabad",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#FFF8EE",
  colorScheme: "light",
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({
  children,
}: Readonly<RootLayoutProps>) {
  return (
    <html lang="en-IN">
      <body className="bg-[#FFF8EE] text-gray-900 antialiased">
        <Providers>{children}</Providers>

        <Toaster
          position="top-right"
          richColors
          closeButton
          duration={3000}
        />
      </body>
    </html>
  );
}