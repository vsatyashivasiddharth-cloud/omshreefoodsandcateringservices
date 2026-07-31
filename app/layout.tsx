import type { Metadata } from "next";
import "./globals.css";

import Providers from "@/components/providers/Providers";
import { Toaster } from "sonner";

const siteUrl =
  "https://www.omshreefoodsandcaterers.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  applicationName:
    "Om Shree Foods & Caterers",

  title: {
    default:
      "Om Shree Foods & Caterers",
    template:
      "%s | Om Shree Foods & Caterers",
  },

  description:
    "Shop authentic homemade snacks, sweets, pickles, spice powders and traditional foods, or book premium catering services from Om Shree Foods & Caterers.",

  keywords: [
  "Om Shree Foods",
  "Om Shree Foods and Caterers",
  "Homemade Snacks",
  "Indian Snacks",
  "Andhra Snacks",
  "Telangana Snacks",
  "Traditional Snacks",
  "Murukulu",
  "Murukku",
  "Chekkalu",
  "Sakinalu",
  "Janthikalu",
  "Kara Boondi",
  "Mixture",
  "Ribbon Pakoda",
  "Hot Items",
  "Homemade Pickles",
  "Andhra Pickles",
  "Telangana Pickles",
  "Mango Pickle",
  "Avakaya Pickle",
  "Gongura Pickle",
  "Lemon Pickle",
  "Tomato Pickle",
  "Chicken Pickle",
  "Chicken Boneless Pickle",
  "Mutton Pickle",
  "Mutton Boneless Pickle",
  "Kandi Podi",
  "Vellilu Karam",
  "Nalla Karam",
  "Kakarakaya Karam",
  "Usirikaya Pickle",
  "Indian Sweets",
  "Laddu",
  "Boondi Laddu",
  "Ariselu",
  "Kajjikayalu",
  "Spice Powders",
  "Karam Podi",
  "Curry Leaf Powder",
  "Idli Karam",
  "Catering Services",
  "Catering in Andhra Pradesh",
  "Catering in Telanagana",
  "Traditional Foods",
  "Online Food Store",
],

  authors: [
    {
      name: "Om Shree Foods & Caterers",
      url: siteUrl,
    },
  ],

  creator:
    "Om Shree Foods & Caterers",

  publisher:
    "Om Shree Foods & Caterers",

  category: "Food and Catering",

  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteUrl,
    siteName:
      "Om Shree Foods & Caterers",
    title:
      "Om Shree Foods & Caterers",
    description:
      "Authentic homemade snacks, sweets, pickles, spice powders, traditional foods and premium catering services.",
  },

  twitter: {
    card: "summary_large_image",
    title:
      "Om Shree Foods & Caterers",
    description:
      "Authentic homemade snacks, sweets, pickles, spice powders, traditional foods and premium catering services.",
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-IN">
      <body className="bg-[#FFF8EE] text-gray-900 antialiased">
        <Providers>
          {children}
        </Providers>

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