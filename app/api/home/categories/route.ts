import {
  NextResponse,
} from "next/server";

import prisma from "@/lib/prisma";

function noStoreHeaders() {
  return {
    "Cache-Control":
      "private, no-store, max-age=0",
    Pragma: "no-cache",
    Expires: "0",
  };
}

function errorResponse(
  error: string,
  status: number,
) {
  return NextResponse.json(
    {
      error,
    },
    {
      status,
      headers: noStoreHeaders(),
    },
  );
}

export async function GET() {
  try {
    const categories =
      await prisma.category.findMany({
        where: {
          isActive: true,
        },

        select: {
          id: true,
          name: true,
          slug: true,
          image: true,

          _count: {
            select: {
              products: true,
            },
          },
        },

        orderBy: {
          name: "asc",
        },
      });

    return NextResponse.json(
      categories,
      {
        status: 200,
        headers:
          noStoreHeaders(),
      },
    );
  } catch (error) {
    console.error(
      "Failed to load home categories:",
      error,
    );

    return errorResponse(
      "Failed to fetch categories.",
      500,
    );
  }
}
