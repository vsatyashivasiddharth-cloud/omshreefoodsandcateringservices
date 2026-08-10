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

function isRecord(
  value: unknown,
): value is Record<
  string,
  unknown
> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function readString(
  value: unknown,
) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function readPositiveDecimal(
  value: unknown,
) {
  if (
    typeof value !== "string" &&
    typeof value !== "number"
  ) {
    return null;
  }

  const normalized =
    String(value).trim();

  if (!normalized) {
    return null;
  }

  try {
    const decimal =
      new Prisma.Decimal(
        normalized,
      );

    if (
      !decimal.isFinite() ||
      decimal.lte(0) ||
      decimal.gt(1000)
    ) {
      return null;
    }

    return decimal;
  } catch {
    return null;
  }
}

function readNonNegativeInteger(
  value: unknown,
) {
  const number =
    Number(value);

  if (
    !Number.isInteger(number) ||
    number < 0 ||
    number > 100_000
  ) {
    return null;
  }

  return number;
}

function readPositiveInteger(
  value: unknown,
) {
  const number =
    Number(value);

  if (
    !Number.isInteger(number) ||
    number < 1 ||
    number > 100_000
  ) {
    return null;
  }

  return number;
}

function normalizeCode(
  value: string,
) {
  return value
    .toUpperCase()
    .trim()
    .replace(
      /[^A-Z0-9]+/g,
      "_",
    )
    .replace(
      /^_+|_+$/g,
      "",
    );
}

function serializePackage<
  T extends {
    id: string;
    name: string;
    code: string;
    lengthCm: unknown;
    breadthCm: unknown;
    heightCm: unknown;
    emptyWeightGrams: number;
    maxWeightGrams: number;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
  },
>(
  shippingPackage: T,
) {
  return {
    ...shippingPackage,
    lengthCm:
      Number(
        shippingPackage.lengthCm,
      ),
    breadthCm:
      Number(
        shippingPackage.breadthCm,
      ),
    heightCm:
      Number(
        shippingPackage.heightCm,
      ),
  };
}

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

    const packageId =
      id.trim();

    if (!packageId) {
      return errorResponse(
        "Shipping package ID is required.",
        400,
      );
    }

    const body: unknown =
      await request.json();

    if (!isRecord(body)) {
      return errorResponse(
        "Invalid request body.",
        400,
      );
    }

    const name =
      readString(body.name);

    const code =
      normalizeCode(
        readString(body.code),
      );

    const lengthCm =
      readPositiveDecimal(
        body.lengthCm,
      );

    const breadthCm =
      readPositiveDecimal(
        body.breadthCm,
      );

    const heightCm =
      readPositiveDecimal(
        body.heightCm,
      );

    const emptyWeightGrams =
      readNonNegativeInteger(
        body.emptyWeightGrams,
      );

    const maxWeightGrams =
      readPositiveInteger(
        body.maxWeightGrams,
      );

    const active =
      typeof body.active ===
      "boolean"
        ? body.active
        : true;

    if (
      name.length < 2 ||
      name.length > 100
    ) {
      return errorResponse(
        "Package name must be between 2 and 100 characters.",
        400,
      );
    }

    if (
      code.length < 2 ||
      code.length > 50
    ) {
      return errorResponse(
        "Package code must be between 2 and 50 characters.",
        400,
      );
    }

    if (
      !lengthCm ||
      !breadthCm ||
      !heightCm
    ) {
      return errorResponse(
        "Length, breadth and height must each be greater than 0 and no more than 1000 cm.",
        400,
      );
    }

    if (
      emptyWeightGrams === null
    ) {
      return errorResponse(
        "Empty package weight must be a whole number between 0 and 100000 grams.",
        400,
      );
    }

    if (
      maxWeightGrams === null
    ) {
      return errorResponse(
        "Maximum packed weight must be a whole number between 1 and 100000 grams.",
        400,
      );
    }

    if (
      emptyWeightGrams >=
      maxWeightGrams
    ) {
      return errorResponse(
        "Maximum packed weight must be greater than the empty package weight.",
        400,
      );
    }

    const existingPackage =
      await prisma.shippingPackage.findUnique({
        where: {
          id: packageId,
        },
        select: {
          id: true,
        },
      });

    if (!existingPackage) {
      return errorResponse(
        "Shipping package not found.",
        404,
      );
    }

    /*
     * Prevent accidentally disabling the final active
     * carton because checkout requires at least one
     * active ShippingPackage.
     */
    if (!active) {
      const activeCount =
        await prisma.shippingPackage.count({
          where: {
            active: true,
            NOT: {
              id: packageId,
            },
          },
        });

      if (activeCount === 0) {
        return errorResponse(
          "Keep at least one shipping package active so checkout can calculate delivery.",
          409,
        );
      }
    }

    const shippingPackage =
      await prisma.shippingPackage.update({
        where: {
          id: packageId,
        },
        data: {
          name,
          code,
          lengthCm,
          breadthCm,
          heightCm,
          emptyWeightGrams,
          maxWeightGrams,
          active,
        },
      });

    return NextResponse.json(
      serializePackage(
        shippingPackage,
      ),
      {
        status: 200,
        headers: noStoreHeaders(),
      },
    );
  } catch (error) {
    console.error(
      "PUT Shipping Package Error:",
      error,
    );

    if (
      error instanceof
      Prisma.PrismaClientKnownRequestError
    ) {
      if (
        error.code === "P2002"
      ) {
        return errorResponse(
          "That shipping package code is already in use.",
          409,
        );
      }

      if (
        error.code === "P2025"
      ) {
        return errorResponse(
          "Shipping package not found.",
          404,
        );
      }
    }

    if (
      error instanceof SyntaxError
    ) {
      return errorResponse(
        "Invalid request body.",
        400,
      );
    }

    return errorResponse(
      "Failed to update shipping package.",
      500,
    );
  }
}