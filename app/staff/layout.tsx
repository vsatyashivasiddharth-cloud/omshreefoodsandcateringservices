import type {
  Metadata,
  Viewport,
} from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  applicationName:
    "Om Shree Foods Staff",

  title: {
    default:
      "Staff Orders",
    template:
      "%s | Om Shree Foods Staff",
  },

  description:
    "Om Shree Foods staff packing and shipment operations.",

  manifest:
    "/staff/manifest.webmanifest",

  robots: {
    index: false,
    follow: false,
    nocache: true,

    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },

  icons: {
    icon: [
      {
        url:
          "/staff-app/icon-192.png",
        sizes:
          "192x192",
        type:
          "image/png",
      },
      {
        url:
          "/staff-app/icon-512.png",
        sizes:
          "512x512",
        type:
          "image/png",
      },
    ],
  },
};

export const viewport: Viewport = {
  width:
    "device-width",

  initialScale:
    1,

  maximumScale:
    5,

  themeColor:
    "#7C3300",

  colorScheme:
    "light",
};

interface StaffLayoutProps {
  children: ReactNode;
}

export default function StaffLayout({
  children,
}: Readonly<StaffLayoutProps>) {
  return children;
}