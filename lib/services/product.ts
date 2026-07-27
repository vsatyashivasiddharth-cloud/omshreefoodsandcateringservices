import prisma from "@/lib/prisma";

/**
 * Get all products
 */
export async function getAllProducts() {
  return prisma.product.findMany({
    include: {
      category: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * Get featured products
 */
export async function getFeaturedProducts(limit = 6) {
  return prisma.product.findMany({
    where: {
      featured: true,
    },
    include: {
      category: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
  });
}

/**
 * Get a single product by slug
 */
export async function getProductBySlug(slug: string) {
  return prisma.product.findUnique({
    where: {
      slug,
    },
    include: {
      category: true,
    },
  });
}

/**
 * Get related products
 */
export async function getRelatedProducts(slug: string) {
  const product = await prisma.product.findUnique({
    where: {
      slug,
    },
    include: {
      category: true,
    },
  });

  if (!product) {
    return [];
  }

  return prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      NOT: {
        slug,
      },
    },
    include: {
      category: true,
    },
    take: 4,
  });
}

/**
 * Get products by category
 */
export async function getProductsByCategory(categoryId: string) {
  return prisma.product.findMany({
    where: {
      categoryId,
    },
    include: {
      category: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * Search products
 */
export async function searchProducts(search: string) {
  return prisma.product.findMany({
    where: {
      OR: [
        {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: search,
            mode: "insensitive",
          },
        },
      ],
    },
    include: {
      category: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}