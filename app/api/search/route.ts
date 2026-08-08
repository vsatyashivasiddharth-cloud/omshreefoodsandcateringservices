import {
  NextRequest,
  NextResponse,
} from "next/server";

import prisma from "@/lib/prisma";

const MAX_QUERY_LENGTH = 100;
const MAX_RESULTS = 30;

function noStoreHeaders() {
  return {
    "Cache-Control":
      "private, no-store, max-age=0",
    Pragma: "no-cache",
    Expires: "0",
  };
}

function jsonResponse(
  body: unknown,
  status = 200,
) {
  return NextResponse.json(
    body,
    {
      status,
      headers: noStoreHeaders(),
    },
  );
}

export async function GET(
  request: NextRequest,
) {
  try {
    const query =
      request.nextUrl.searchParams
        .get("q")
        ?.trim() ?? "";

    if (!query) {
      return jsonResponse([]);
    }

    if (
      query.length >
      MAX_QUERY_LENGTH
    ) {
      return jsonResponse(
        {
          error:
            `Search terms must be ${MAX_QUERY_LENGTH} characters or fewer.`,
        },
        400,
      );
    }

    const products =
      await prisma.product.findMany({
        where: {
          OR: [
            {
              name: {
                contains: query,
                mode: "insensitive",
              },
            },
            {
              description: {
                contains: query,
                mode: "insensitive",
              },
            },
            {
              category: {
                name: {
                  contains: query,
                  mode: "insensitive",
                },
              },
            },
          ],
        },

        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          image: true,
          stock: true,

          category: {
            select: {
              id: true,
              name: true,
              slug: true,
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

        take: MAX_RESULTS,
      });

    return jsonResponse(
      products.map(
        (product) => ({
          ...product,

          price:
            Number(
              product.price,
            ),

          stock:
            Math.max(
              0,
              Math.floor(
                Number(
                  product.stock,
                ) || 0,
              ),
            ),
        }),
      ),
    );
  } catch (error) {
    console.error(
      "Search API Error:",
      error,
    );

    return jsonResponse(
      {
        error:
          "Unable to search products right now.",
      },
      500,
    );
  }
}