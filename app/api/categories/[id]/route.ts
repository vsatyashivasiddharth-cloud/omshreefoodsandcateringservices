import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import prisma from "@/lib/prisma";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

function createSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/* ---------- GET ---------- */

export async function GET(
  _request: NextRequest,
  { params }: RouteContext,
) {
  try {
    const { id } = await params;

    const category = await prisma.category.findUnique({
      where: {
        id,
      },
    });

    if (!category) {
      return NextResponse.json(
        {
          error: "Category not found.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error("GET Category Error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch category.",
      },
      {
        status: 500,
      },
    );
  }
}

/* ---------- UPDATE ---------- */

export async function PUT(
  request: NextRequest,
  { params }: RouteContext,
) {
  try {
    const { id } = await params;
    const body: unknown = await request.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        {
          error: "Invalid request body.",
        },
        {
          status: 400,
        },
      );
    }

    const data = body as Record<string, unknown>;

    const name =
      typeof data.name === "string" ? data.name.trim() : "";

    const slug =
      typeof data.slug === "string"
        ? createSlug(data.slug)
        : "";

    const image =
      typeof data.image === "string"
        ? data.image.trim()
        : "";

    if (!name || !slug) {
      return NextResponse.json(
        {
          error: "Name and slug are required.",
        },
        {
          status: 400,
        },
      );
    }

    const [existingCategory, conflictingSlug] =
      await Promise.all([
        prisma.category.findUnique({
          where: {
            id,
          },
          select: {
            id: true,
          },
        }),
        prisma.category.findFirst({
          where: {
            slug,
            NOT: {
              id,
            },
          },
          select: {
            id: true,
          },
        }),
      ]);

    if (!existingCategory) {
      return NextResponse.json(
        {
          error: "Category not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (conflictingSlug) {
      return NextResponse.json(
        {
          error: "A category with this slug already exists.",
        },
        {
          status: 409,
        },
      );
    }

    const category = await prisma.category.update({
      where: {
        id,
      },
      data: {
        name,
        slug,
        image: image || null,
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("Update Category Error:", error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          error: "A category with this slug already exists.",
        },
        {
          status: 409,
        },
      );
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        {
          error: "Category not found.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(
      {
        error: "Failed to update category.",
      },
      {
        status: 500,
      },
    );
  }
}

/* ---------- DELETE ---------- */

export async function DELETE(
  _request: NextRequest,
  { params }: RouteContext,
) {
  try {
    const { id } = await params;

    const [category, productCount] = await Promise.all([
      prisma.category.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
        },
      }),
      prisma.product.count({
        where: {
          categoryId: id,
        },
      }),
    ]);

    if (!category) {
      return NextResponse.json(
        {
          error: "Category not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (productCount > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete this category because it contains products.",
        },
        {
          status: 409,
        },
      );
    }

    await prisma.category.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Category deleted successfully.",
    });
  } catch (error) {
    console.error("Delete Category Error:", error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        {
          error: "Category not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return NextResponse.json(
        {
          error:
            "Cannot delete this category because it contains products.",
        },
        {
          status: 409,
        },
      );
    }

    return NextResponse.json(
      {
        error: "Failed to delete category.",
      },
      {
        status: 500,
      },
    );
  }
}