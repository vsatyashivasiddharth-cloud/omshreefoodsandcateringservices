import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  allowedDevOrigins: [
    "192.168.1.6",
  ],

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname:
          "zueoiexoeanzzfhfbaic.supabase.co",
      },
    ],
  },

  async headers() {
    return [
      {
        source: "/:path*",

        headers: [
          {
            key:
              "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key:
              "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key:
              "Referrer-Policy",
            value:
              "strict-origin-when-cross-origin",
          },
          {
            key:
              "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=()",
          },
          {
            key:
              "Strict-Transport-Security",
            value:
              "max-age=31536000",
          },
        ],
      },
    ];
  },
};

export default nextConfig;