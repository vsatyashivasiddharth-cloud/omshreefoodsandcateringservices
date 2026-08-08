import {
  NextRequest,
  NextResponse,
} from "next/server";
import {
  Prisma,
} from "@prisma/client";

import {
  requireAdmin,
} from "@/lib/auth";
import prisma from "@/lib/prisma";

function createSlug(
  value: string,
) {
  return value
    .toLowerCase()
    .trim()
    .replace(
      /[^a-z0-9]+/g,
      "-",
    )
    .replace(
      /^-+|-+$/g,
      "",
    );
}

function noStoreHeaders() {
  return {
    "Cache-Control":
      "private, no-store, max-age=0",
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
      headers:
        noStoreHeaders(),
    },
  );
}

export async function GET() {
  try {
    const categories =
      await prisma.category.findMany({
        orderBy: {
          createdAt: "desc",
        },
      });

    return NextResponse.json(
      categories,
      {
        status: 200,
        headers: {
          "Cache-Control":
            "no-store",
        },
      },
    );
  } catch (error) {
    console.error(
      "GET Categories Error:",
      error,
    );

    return errorResponse(
      "Failed to fetch categories.",
      500,
    );
  }
}

export async function POST(
  request: NextRequest,
) {
  try {
    const authentication =
      await requireAdmin(
        request,
      );

    if (
      !authentication.authenticated
    ) {
      return errorResponse(
        authentication.error,
        authentication.status,
      );
    }

    const body: unknown =
      await request.json();

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return errorResponse(
        "Invalid request body.",
        400,
      );
    }

    const data =
      body as Record<
        string,
        unknown
      >;

    const name =
      typeof data.name ===
      "string"
        ? data.name.trim()
        : "";

    const slug =
      typeof data.slug ===
      "string"
        ? createSlug(
            data.slug,
          )
        : "";

    const image =
      typeof data.image ===
      "string"
        ? data.image.trim()
        : "";

    if (!name || !slug) {
      return errorResponse(
        "Name and slug are required.",
        400,
      );
    }

    if (
      name.length > 150
    ) {
      return errorResponse(
        "Category name must not exceed 150 characters.",
        400,
      );
    }

    if (
      slug.length > 180
    ) {
      return errorResponse(
        "Category slug must not exceed 180 characters.",
        400,
      );
    }

    if (
      image.length > 2000
    ) {
      return errorResponse(
        "The category image URL is too long.",
        400,
      );
    }

    const existingCategory =
      await prisma.category.findUnique({
        where: {
          slug,
        },

        select: {
          id: true,
        },
      });

    if (existingCategory) {
      return errorResponse(
        "A category with this slug already exists.",
        409,
      );
    }

    const category =
      await prisma.category.create({
        data: {
          name,
          slug,

          image:
            image || null,
        },
      });

    return NextResponse.json(
      category,
      {
        status: 201,
        headers:
          noStoreHeaders(),
      },
    );
  } catch (error) {
    console.error(
      "Create Category Error:",
      error,
    );

    if (
      error instanceof
        SyntaxError
    ) {
      return errorResponse(
        "Invalid request body.",
        400,
      );
    }

    if (
      error instanceof
        Prisma
          .PrismaClientKnownRequestError &&
      error.code ===
        "P2002"
    ) {
      return errorResponse(
        "A category with this slug already exists.",
        409,
      );
    }

    return errorResponse(
      "Failed to create category.",
      500,
    );
  }
}