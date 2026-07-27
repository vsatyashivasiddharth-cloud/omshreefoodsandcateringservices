import {
  NextRequest,
  NextResponse,
} from "next/server";
import { Prisma } from "@prisma/client";

import prisma from "@/lib/prisma";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

function normalizeProduct<
  T extends {
    price: unknown;
    shippingWeightGrams: number;
  },
>(product: T) {
  return {
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
  };
}

function createSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function readWholeNumber(value: unknown) {
  if (
    typeof value !== "string" &&
    typeof value !== "number"
  ) {
    return Number.NaN;
  }

  return Number(value);
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

    const product =
      await prisma.product.findUnique({
        where: {
          id: productId,
        },
        include: {
          category: true,
        },
      });

    if (!product) {
      return NextResponse.json(
        {
          error: "Product not found.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(
      normalizeProduct(product),
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error(
      "GET Product Error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Failed to fetch product.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function PUT(
  request: NextRequest,
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

    const body: unknown =
      await request.json();

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid request body.",
        },
        {
          status: 400,
        },
      );
    }

    const data =
      body as Record<string, unknown>;

    const name =
      typeof data.name === "string"
        ? data.name.trim()
        : "";

    const slug =
      typeof data.slug === "string"
        ? createSlug(data.slug)
        : "";

    const description =
      typeof data.description === "string"
        ? data.description.trim()
        : "";

    const categoryId =
      typeof data.categoryId === "string"
        ? data.categoryId.trim()
        : "";

    const image =
      typeof data.image === "string"
        ? data.image.trim()
        : "";

    const priceValue =
      typeof data.price === "string" ||
      typeof data.price === "number"
        ? String(data.price).trim()
        : "";

    const stockValue = readWholeNumber(
      data.stock,
    );

    const shippingWeightGrams =
      readWholeNumber(
        data.shippingWeightGrams,
      );

    const featured =
      typeof data.featured === "boolean"
        ? data.featured
        : false;

    if (
      !name ||
      !slug ||
      !description ||
      !priceValue ||
      !categoryId
    ) {
      return NextResponse.json(
        {
          error:
            "Please fill all required fields.",
        },
        {
          status: 400,
        },
      );
    }

    let decimalPrice: Prisma.Decimal;

    try {
      decimalPrice =
        new Prisma.Decimal(priceValue);
    } catch {
      return NextResponse.json(
        {
          error:
            "Enter a valid product price.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !decimalPrice.isFinite() ||
      decimalPrice.lte(0)
    ) {
      return NextResponse.json(
        {
          error:
            "Price must be greater than zero.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !Number.isInteger(stockValue) ||
      stockValue < 0
    ) {
      return NextResponse.json(
        {
          error:
            "Stock must be a whole number of zero or more.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !Number.isInteger(
        shippingWeightGrams,
      ) ||
      shippingWeightGrams < 1
    ) {
      return NextResponse.json(
        {
          error:
            "Shipping weight must be a whole number greater than zero.",
        },
        {
          status: 400,
        },
      );
    }

    const [
      existingProduct,
      conflictingSlug,
      category,
    ] = await Promise.all([
      prisma.product.findUnique({
        where: {
          id: productId,
        },
        select: {
          id: true,
        },
      }),
      prisma.product.findFirst({
        where: {
          slug,
          NOT: {
            id: productId,
          },
        },
        select: {
          id: true,
        },
      }),
      prisma.category.findUnique({
        where: {
          id: categoryId,
        },
        select: {
          id: true,
        },
      }),
    ]);

    if (!existingProduct) {
      return NextResponse.json(
        {
          error: "Product not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (conflictingSlug) {
      return NextResponse.json(
        {
          error:
            "A product with this slug already exists.",
        },
        {
          status: 409,
        },
      );
    }

    if (!category) {
      return NextResponse.json(
        {
          error:
            "The selected category does not exist.",
        },
        {
          status: 400,
        },
      );
    }

    const product =
      await prisma.product.update({
        where: {
          id: productId,
        },
        data: {
          name,
          slug,
          description,
          price: decimalPrice,
          image,
          stock: stockValue,
          shippingWeightGrams,
          featured,
          categoryId,
        },
        include: {
          category: true,
        },
      });

    return NextResponse.json(
      normalizeProduct(product),
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error(
      "Update Product Error:",
      error,
    );

    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          error:
            "A product with this slug already exists.",
        },
        {
          status: 409,
        },
      );
    }

    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return NextResponse.json(
        {
          error:
            "The selected category does not exist.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        {
          error: "Product not found.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(
      {
        error:
          "Failed to update product.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function DELETE(
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

    const product =
      await prisma.product.findUnique({
        where: {
          id: productId,
        },
        select: {
          id: true,
        },
      });

    if (!product) {
      return NextResponse.json(
        {
          error: "Product not found.",
        },
        {
          status: 404,
        },
      );
    }

    await prisma.product.delete({
      where: {
        id: productId,
      },
    });

    return NextResponse.json(
      {
        message:
          "Product deleted successfully.",
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error(
      "Delete Product Error:",
      error,
    );

    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        {
          error: "Product not found.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(
      {
        error:
          "Failed to delete product.",
      },
      {
        status: 500,
      },
    );
  }
}