import type { MetadataRoute } from "next";

import prisma from "@/lib/prisma";

const baseUrl =
  "https://www.omshreefoodsandcaterers.com";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/shop`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/categories`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/catering`,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/catering/plates`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/catering/plates/veg`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/catering/plates/non-veg`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/faq`,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  try {
    const products =
      await prisma.product.findMany({
        where: {
          isActive: true,

          category: {
            isActive: true,
          },
        },
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
        .filter((product) => {
          return (
            typeof product.slug ===
              "string" &&
            product.slug.trim().length >
              0
          );
        })
        .map((product) => ({
          url: `${baseUrl}/shop/${encodeURIComponent(
            product.slug.trim(),
          )}`,
          lastModified:
            product.updatedAt,
          changeFrequency:
            "weekly",
          priority: 0.8,
        }));

    return [
      ...staticPages,
      ...productPages,
    ];
  } catch (error) {
    console.error(
      "Failed to generate product sitemap entries:",
      error,
    );

    return staticPages;
  }
}
