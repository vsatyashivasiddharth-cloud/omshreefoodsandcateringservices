import prisma from "@/lib/prisma";

export async function getFeaturedProducts() {
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
    take: 8,
  });
}