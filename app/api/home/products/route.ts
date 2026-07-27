import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const products =
      await prisma.product.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          price: true,
          image: true,
          stock: true,
          featured: true,
          shippingWeightGrams: true,
          categoryId: true,
          createdAt: true,
          updatedAt: true,
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              image: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

    return NextResponse.json(
      products.map((product) => ({
        ...product,
        price: Number(product.price),
        shippingWeightGrams: Math.max(
          0,
          Math.floor(
            Number(
              product.shippingWeightGrams,
            ) || 0,
          ),
        ),
        createdAt:
          product.createdAt.toISOString(),
        updatedAt:
          product.updatedAt.toISOString(),
      })),
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error(
      "Failed to load home products:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Failed to fetch products.",
      },
      {
        status: 500,
      },
    );
  }
}