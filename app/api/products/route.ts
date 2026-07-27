import {
  NextRequest,
  NextResponse,
} from "next/server";
import { Prisma } from "@prisma/client";

import prisma from "@/lib/prisma";

function createSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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

function readWholeNumber(value: unknown) {
  if (
    typeof value !== "string" &&
    typeof value !== "number"
  ) {
    return Number.NaN;
  }

  const number = Number(value);

  return number;
}

export async function GET() {
  try {
    const products =
      await prisma.product.findMany({
        include: {
          category: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

    return NextResponse.json(
      products.map((product) =>
        normalizeProduct(product),
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
      "GET Products Error:",
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

export async function POST(
  request: NextRequest,
) {
  try {
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
      category,
    ] = await Promise.all([
      prisma.product.findUnique({
        where: {
          slug,
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

    if (existingProduct) {
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
      await prisma.product.create({
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
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "Create Product Error:",
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

    return NextResponse.json(
      {
        error:
          "Failed to create product.",
      },
      {
        status: 500,
      },
    );
  }
}