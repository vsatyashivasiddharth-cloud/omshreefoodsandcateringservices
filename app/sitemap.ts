import type { MetadataRoute } from "next";

import prisma from "@/lib/prisma";

const baseUrl =
  "https://www.omshreefoodsandcaterers.com";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/shop`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/categories`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/catering`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/catering/plates`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/catering/plates/veg`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/catering/plates/non-veg`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/track-order`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  try {
    const products = await prisma.product.findMany({
      select: {
        slug: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    const productPages: MetadataRoute.Sitemap =
      products
        .filter(
          (product) =>
            typeof product.slug === "string" &&
            product.slug.trim().length > 0,
        )
        .map((product) => ({
          url: `${baseUrl}/shop/${encodeURIComponent(
            product.slug,
          )}`,
          lastModified: product.updatedAt ?? now,
          changeFrequency: "weekly",
          priority: 0.8,
        }));

    return [...staticPages, ...productPages];
  } catch (error) {
    console.error(
      "Failed to generate product sitemap entries:",
      error,
    );

    return staticPages;
  }
}