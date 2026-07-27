import {
  NextRequest,
  NextResponse,
} from "next/server";

import prisma from "@/lib/prisma";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  _request: NextRequest,
  { params }: RouteContext,
) {
  try {
    const { id } = await params;
    const productId = id.trim();

    if (!productId) {
      return NextResponse.json(
        {
          error:
            "Product ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    const currentProduct =
      await prisma.product.findUnique({
        where: {
          id: productId,
        },
        select: {
          id: true,
          categoryId: true,
        },
      });

    if (!currentProduct) {
      return NextResponse.json(
        {
          error: "Product not found.",
        },
        {
          status: 404,
        },
      );
    }

    const relatedProducts =
      await prisma.product.findMany({
        where: {
          categoryId:
            currentProduct.categoryId,
          id: {
            not: currentProduct.id,
          },
        },
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
        orderBy: [
          {
            featured: "desc",
          },
          {
            createdAt: "desc",
          },
        ],
        take: 4,
      });

    return NextResponse.json(
      relatedProducts.map(
        (product) => ({
          ...product,
          price: Number(
            product.price,
          ),
          shippingWeightGrams:
            Math.max(
              0,
              Math.floor(
                Number(
                  product
                    .shippingWeightGrams,
                ) || 0,
              ),
            ),
          createdAt:
            product.createdAt.toISOString(),
          updatedAt:
            product.updatedAt.toISOString(),
        }),
      ),
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error(
      "Failed to load related products:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Failed to fetch related products.",
      },
      {
        status: 500,
      },
    );
  }
}