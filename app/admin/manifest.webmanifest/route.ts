import {
  NextResponse,
} from "next/server";

const manifest = {
  id:
    "/admin/dashboard",

  name:
    "Om Shree Foods Admin",

  short_name:
    "Om Shree Admin",

  description:
    "Secure administration for Om Shree Foods & Caterers.",

  start_url:
    "/admin/dashboard",

  scope:
    "/admin/",

  display:
    "standalone",

  orientation:
    "portrait-primary",

  background_color:
    "#FFF9F0",

  theme_color:
    "#000000",

  icons: [
    {
      src:
        "/admin-app/icon-192.png",

      sizes:
        "192x192",

      type:
        "image/png",

      purpose:
        "any",
    },
    {
      src:
        "/admin-app/icon-512.png",

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
