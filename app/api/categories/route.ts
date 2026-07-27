import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import prisma from "@/lib/prisma";

function createSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("GET Categories Error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch categories.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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
      typeof data.name === "string"
        ? data.name.trim()
        : "";

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
      return NextResponse.json(
        {
          error: "A category with this slug already exists.",
        },
        {
          status: 409,
        },
      );
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        image: image || null,
      },
    });

    return NextResponse.json(
      category,
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("Create Category Error:", error);

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

    return NextResponse.json(
      {
        error: "Failed to create category.",
      },
      {
        status: 500,
      },
    );
  }
}