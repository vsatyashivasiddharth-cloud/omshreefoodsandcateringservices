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


interface ComparableShippingPackage {
  id: string;
  name: string;
  lengthCm: unknown;
  breadthCm: unknown;
  heightCm: unknown;
  emptyWeightGrams: number;
  maxWeightGrams: number;
  active: boolean;
}

function toPositiveNumber(
  value: unknown,
) {
  const number = Number(value);

  return Number.isFinite(number) &&
    number > 0
    ? number
    : null;
}

function packageVolumeCm3(
  shippingPackage:
    ComparableShippingPackage,
) {
  const lengthCm =
    toPositiveNumber(
      shippingPackage.lengthCm,
    );

  const breadthCm =
    toPositiveNumber(
      shippingPackage.breadthCm,
    );

  const heightCm =
    toPositiveNumber(
      shippingPackage.heightCm,
    );

  if (
    lengthCm === null ||
    breadthCm === null ||
    heightCm === null
  ) {
    return null;
  }

  return (
    lengthCm *
    breadthCm *
    heightCm
  );
}

function getConfigurationWarnings(
  candidate:
    ComparableShippingPackage,
  others:
    ComparableShippingPackage[],
) {
  if (!candidate.active) {
    return [];
  }

  const candidateVolume =
    packageVolumeCm3(
      candidate,
    );

  if (candidateVolume === null) {
    return [];
  }

  const warnings: string[] =
    [];

  for (const other of others) {
    if (
      !other.active ||
      other.id ===
        candidate.id
    ) {
      continue;
    }

    const otherVolume =
      packageVolumeCm3(
        other,
      );

    if (otherVolume === null) {
      continue;
    }

    const sameVolume =
      Math.abs(
        candidateVolume -
          otherVolume,
      ) < 0.001;

    const sameWeightCapacity =
      candidate.maxWeightGrams ===
      other.maxWeightGrams;

    if (
      sameVolume &&
      sameWeightCapacity
    ) {
      warnings.push(
        `"${candidate.name}" has the same outer volume and maximum packed weight as "${other.name}". Confirm both presets are intentionally different.`,
      );

      continue;
    }

    if (
      candidateVolume <
        otherVolume &&
      candidate.maxWeightGrams >
        other.maxWeightGrams
    ) {
      warnings.push(
        `"${candidate.name}" is physically smaller than "${other.name}" but has a higher maximum packed weight. Confirm this matches the real packaging limits.`,
      );
    }

    if (
      candidateVolume >
        otherVolume &&
      candidate.maxWeightGrams <
        other.maxWeightGrams
    ) {
      warnings.push(
        `"${candidate.name}" is physically larger than "${other.name}" but has a lower maximum packed weight. Confirm this matches the real packaging limits.`,
      );
    }

    if (
      candidateVolume >=
        otherVolume &&
      candidate.emptyWeightGrams <
        other.emptyWeightGrams
    ) {
      warnings.push(
        `"${candidate.name}" is at least as large as "${other.name}" but has a lower empty package weight. Confirm the measured packing weights are correct.`,
      );
    }
  }

  return Array.from(
    new Set(warnings),
  ).slice(0, 5);
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

export async function GET(
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

    const packages =
      await prisma.shippingPackage.findMany({
        orderBy: [
          {
            active: "desc",
          },
          {
            maxWeightGrams:
              "asc",
          },
          {
            emptyWeightGrams:
              "asc",
          },
          {
            name: "asc",
          },
        ],
      });

    return NextResponse.json(
      packages.map(
        serializePackage,
      ),
      {
        status: 200,
        headers: noStoreHeaders(),
      },
    );
  } catch (error) {
    console.error(
      "GET Shipping Packages Error:",
      error,
    );

    return errorResponse(
      "Failed to load shipping packages.",
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

    const existingPackages =
      await prisma.shippingPackage.findMany({
        select: {
          id: true,
          name: true,
          lengthCm: true,
          breadthCm: true,
          heightCm: true,
          emptyWeightGrams: true,
          maxWeightGrams: true,
          active: true,
        },
      });

    const shippingPackage =
      await prisma.shippingPackage.create({
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

    const warnings =
      getConfigurationWarnings(
        shippingPackage,
        existingPackages,
      );

    return NextResponse.json(
      {
        ...serializePackage(
          shippingPackage,
        ),
        warnings,
      },
      {
        status: 201,
        headers: noStoreHeaders(),
      },
    );
  } catch (error) {
    console.error(
      "POST Shipping Package Error:",
      error,
    );

    if (
      error instanceof
      Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return errorResponse(
        "That shipping package code is already in use.",
        409,
      );
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
      "Failed to create shipping package.",
      500,
    );
  }
}