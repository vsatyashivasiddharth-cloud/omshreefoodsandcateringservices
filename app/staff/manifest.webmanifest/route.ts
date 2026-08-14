import { NextResponse } from "next/server";

const manifest = {
  id:
    "/staff/orders",

  name:
    "Om Shree Foods Staff",

  short_name:
    "Om Shree Staff",

  description:
    "Packing and shipment operations for Om Shree Foods.",

  start_url:
    "/staff/orders",

  scope:
    "/staff/",

  display:
    "standalone",

  orientation:
    "portrait-primary",

  background_color:
    "#FFF8EE",

  theme_color:
    "#7C3300",

  icons: [
    {
      src:
        "/staff-app/icon-192.png",

      sizes:
        "192x192",

      type:
        "image/png",

      purpose:
        "any",
    },
    {
      src:
        "/staff-app/icon-512.png",

      sizes:
        "512x512",

      type:
        "image/png",

      purpose:
        "any",
    },
  ],
};

export async function GET() {
  return NextResponse.json(
    manifest,
    {
      headers: {
        "Content-Type":
          "application/manifest+json; charset=utf-8",

        "Cache-Control":
          "public, max-age=3600",
      },
    },
  );
}