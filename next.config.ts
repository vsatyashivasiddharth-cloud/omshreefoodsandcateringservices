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
        hostname: "zueoiexoeanzzfhfbaic.supabase.co",
      },
    ],
  },
};

export default nextConfig;