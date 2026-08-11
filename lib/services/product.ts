import prisma from "@/lib/prisma";

/**
 * Get all customer-visible products
 */
export async function getAllProducts() {
  return prisma.product.findMany({
    where: {
      isActive: true,

      category: {
        isActive: true,
      },
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
 * Get featured customer-visible products
 */
export async function getFeaturedProducts(
  limit = 6,
) {
  return prisma.product.findMany({
    where: {
      featured: true,
      isActive: true,

      category: {
        isActive: true,
      },
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
 * Get a single customer-visible product by slug
 */
export async function getProductBySlug(
  slug: string,
) {
  return prisma.product.findFirst({
    where: {
      slug,
      isActive: true,

      category: {
        isActive: true,
      },
    },

    include: {
      category: true,
    },
  });
}

/**
 * Get related customer-visible products
 */
export async function getRelatedProducts(
  slug: string,
) {
  const product =
    await prisma.product.findFirst({
      where: {
        slug,
        isActive: true,

        category: {
          isActive: true,
        },
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
      categoryId:
        product.categoryId,

      isActive: true,

      category: {
        isActive: true,
      },

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
 * Get customer-visible products by category
 */
export async function getProductsByCategory(
  categoryId: string,
) {
  return prisma.product.findMany({
    where: {
      categoryId,
      isActive: true,

      category: {
        isActive: true,
      },
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
 * Search customer-visible products
 */
export async function searchProducts(
  search: string,
) {
  return prisma.product.findMany({
    where: {
      isActive: true,

      category: {
        isActive: true,
      },

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