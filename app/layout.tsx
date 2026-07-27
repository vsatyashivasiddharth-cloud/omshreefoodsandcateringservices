import type { Metadata } from "next";
import "./globals.css";

import Providers from "@/components/providers/Providers";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: {
    default: "Om Shree Foods & Caterers",
    template: "%s | Om Shree Foods & Caterers",
  },
  description:
    "Authentic homemade snacks, sweets, pickles, spice powders, catering services, and traditional foods.",
  keywords: [
    "Om Shree Foods",
    "Homemade Snacks",
    "Pickles",
    "Sweets",
    "Spice Powders",
    "Catering",
    "Traditional Foods",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
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