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

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

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

/* ---------- GET ---------- */

export async function GET(
  _request: NextRequest,
  {
    params,
  }: RouteContext,
) {
  try {
    const {
      id,
    } = await params;

    const categoryId =
      id.trim();

    if (!categoryId) {
      return errorResponse(
        "Category ID is required.",
        400,
      );
    }

    const category =
      await prisma.category.findUnique({
        where: {
          id:
            categoryId,
        },
      });

    if (!category) {
      return errorResponse(
        "Category not found.",
        404,
      );
    }

    return NextResponse.json(
      category,
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
      "GET Category Error:",
      error,
    );

    if (
      error instanceof
        Prisma
          .PrismaClientKnownRequestError &&
      error.code ===
        "P2023"
    ) {
      return errorResponse(
        "Invalid category ID.",
        400,
      );
    }

    return errorResponse(
      "Failed to fetch category.",
      500,
    );
  }
}

/* ---------- UPDATE ---------- */

export async function PUT(
  request: NextRequest,
  {
    params,
  }: RouteContext,
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

    const {
      id,
    } = await params;

    const categoryId =
      id.trim();

    if (!categoryId) {
      return errorResponse(
        "Category ID is required.",
        400,
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

    const [
      existingCategory,
      conflictingSlug,
    ] =
      await Promise.all([
        prisma.category.findUnique({
          where: {
            id:
              categoryId,
          },

          select: {
            id: true,
          },
        }),

        prisma.category.findFirst({
          where: {
            slug,

            NOT: {
              id:
                categoryId,
            },
          },

          select: {
            id: true,
          },
        }),
      ]);

    if (!existingCategory) {
      return errorResponse(
        "Category not found.",
        404,
      );
    }

    if (conflictingSlug) {
      return errorResponse(
        "A category with this slug already exists.",
        409,
      );
    }

    const category =
      await prisma.category.update({
        where: {
          id:
            categoryId,
        },

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
        status: 200,
        headers:
          noStoreHeaders(),
      },
    );
  } catch (error) {
    console.error(
      "Update Category Error:",
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
          .PrismaClientKnownRequestError
    ) {
      if (
        error.code ===
        "P2002"
      ) {
        return errorResponse(
          "A category with this slug already exists.",
          409,
        );
      }

      if (
        error.code ===
        "P2025"
      ) {
        return errorResponse(
          "Category not found.",
          404,
        );
      }

      if (
        error.code ===
        "P2023"
      ) {
        return errorResponse(
          "Invalid category ID.",
          400,
        );
      }
    }

    return errorResponse(
      "Failed to update category.",
      500,
    );
  }
}

/* ---------- VISIBILITY ---------- */

export async function PATCH(
  request: NextRequest,
  {
    params,
  }: RouteContext,
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

    const {
      id,
    } = await params;

    const categoryId =
      id.trim();

    if (!categoryId) {
      return errorResponse(
        "Category ID is required.",
        400,
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

    if (
      typeof data.isActive !==
      "boolean"
    ) {
      return errorResponse(
        "isActive must be a boolean.",
        400,
      );
    }

    const existingCategory =
      await prisma.category.findUnique({
        where: {
          id: categoryId,
        },

        select: {
          id: true,
        },
      });

    if (!existingCategory) {
      return errorResponse(
        "Category not found.",
        404,
      );
    }

    const category =
      await prisma.category.update({
        where: {
          id: categoryId,
        },

        data: {
          isActive:
            data.isActive,
        },
      });

    return NextResponse.json(
      {
        ...category,

        message:
          category.isActive
            ? `"${category.name}" is now visible to customers.`
            : `"${category.name}" is now hidden from customers.`,
      },
      {
        status: 200,
        headers:
          noStoreHeaders(),
      },
    );
  } catch (error) {
    console.error(
      "Update Category Visibility Error:",
      error,
    );

    if (
      error instanceof SyntaxError
    ) {
      return errorResponse(
        "Invalid request body.",
        400,
      );
    }

    if (
      error instanceof
        Prisma
          .PrismaClientKnownRequestError
    ) {
      if (
        error.code === "P2025"
      ) {
        return errorResponse(
          "Category not found.",
          404,
        );
      }

      if (
        error.code === "P2023"
      ) {
        return errorResponse(
          "Invalid category ID.",
          400,
        );
      }
    }

    return errorResponse(
      "Failed to update category visibility.",
      500,
    );
  }
}
/* ---------- DELETE ---------- */

export async function DELETE(
  request: NextRequest,
  {
    params,
  }: RouteContext,
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

    const {
      id,
    } = await params;

    const categoryId =
      id.trim();

    if (!categoryId) {
      return errorResponse(
        "Category ID is required.",
        400,
      );
    }

    const [
      category,
      productCount,
    ] =
      await Promise.all([
        prisma.category.findUnique({
          where: {
            id:
              categoryId,
          },

          select: {
            id: true,
          },
        }),

        prisma.product.count({
          where: {
            categoryId,
          },
        }),
      ]);

    if (!category) {
      return errorResponse(
        "Category not found.",
        404,
      );
    }

    if (
      productCount > 0
    ) {
      return errorResponse(
        "Cannot delete this category because it contains products.",
        409,
      );
    }

    await prisma.category.delete({
      where: {
        id:
          categoryId,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message:
          "Category deleted successfully.",
      },
      {
        status: 200,
        headers:
          noStoreHeaders(),
      },
    );
  } catch (error) {
    console.error(
      "Delete Category Error:",
      error,
    );

    if (
      error instanceof
        Prisma
          .PrismaClientKnownRequestError
    ) {
      if (
        error.code ===
        "P2025"
      ) {
        return errorResponse(
          "Category not found.",
          404,
        );
      }

      if (
        error.code ===
        "P2003"
      ) {
        return errorResponse(
          "Cannot delete this category because it contains products.",
          409,
        );
      }

      if (
        error.code ===
        "P2023"
      ) {
        return errorResponse(
          "Invalid category ID.",
          400,
        );
      }
    }

    return errorResponse(
      "Failed to delete category.",
      500,
    );
  }
}