import type {
  Metadata,
  Viewport,
} from "next";
import type {
  ReactNode,
} from "react";

import AdminPwaRuntime from "./AdminPwaRuntime";
import AdminShell from "./AdminShell";

export const metadata: Metadata = {
  applicationName:
    "Om Shree Foods Admin",

  title: {
    default:
      "Admin",
    template:
      "%s | Om Shree Foods Admin",
  },

  description:
    "Secure administration for Om Shree Foods & Caterers.",

  manifest:
    "/admin/manifest.webmanifest",

  robots: {
    index:
      false,

    follow:
      false,

    nocache:
      true,

    googleBot: {
      index:
        false,

      follow:
        false,

      noimageindex:
        true,
    },
  },

  icons: {
    icon: [
      {
        url:
          "/admin-app/icon-192.png",

        sizes:
          "192x192",

        type:
          "image/png",
      },
      {
        url:
          "/admin-app/icon-512.png",

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
    "#000000",

  colorScheme:
    "light",
};

interface AdminLayoutProps {
  children:
    ReactNode;
}

export default function AdminLayout({
  children,
}: Readonly<AdminLayoutProps>) {
  return (
    <>
      <AdminPwaRuntime />

      <AdminShell>
        {children}
      </AdminShell>
    </>
  );
}
