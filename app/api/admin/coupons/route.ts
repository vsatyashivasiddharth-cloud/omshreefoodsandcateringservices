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

function readPositiveInteger(
  value: unknown,
) {
  const number =
    Number(value);

  if (
    !Number.isInteger(number) ||
    number < 1 ||
    number > 1_000_000
  ) {
    return null;
  }

  return number;
}

function readDiscountPercent(
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
      decimal.gt(100)
    ) {
      return null;
    }

    return decimal;
  } catch {
    return null;
  }
}

function readDate(
  value: unknown,
) {
  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    return null;
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return null;
  }

  return date;
}

function isValidCouponCode(
  code: string,
) {
  return (
    code.length >= 2 &&
    code.length <= 50 &&
    /^[A-Za-z0-9_-]+$/.test(
      code,
    )
  );
}

function serializeCoupon<
  T extends {
    id: string;
    code: string;
    discountPercent: unknown;
    maxUses: number;
    isActive: boolean;
    oneUsePerPhone: boolean;
    startsAt: Date;
    endsAt: Date;
    createdAt: Date;
    updatedAt: Date;
  },
>(
  coupon: T,
) {
  return {
    ...coupon,
    discountPercent:
      Number(
        coupon.discountPercent,
      ),
    startsAt:
      coupon.startsAt.toISOString(),
    endsAt:
      coupon.endsAt.toISOString(),
    createdAt:
      coupon.createdAt.toISOString(),
    updatedAt:
      coupon.updatedAt.toISOString(),
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

    const coupons =
      await prisma.coupon.findMany({
        orderBy: [
          {
            createdAt: "desc",
          },
          {
            code: "asc",
          },
        ],
      });

    return NextResponse.json(
      coupons.map(
        serializeCoupon,
      ),
      {
        status: 200,
        headers: noStoreHeaders(),
      },
    );
  } catch (error) {
    console.error(
      "GET Coupons Error:",
      error,
    );

    return errorResponse(
      "Failed to load coupons.",
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

    /*
     * Coupon codes are intentionally
     * case-sensitive.
     *
     * We trim accidental outer
     * whitespace, but never change
     * letter casing.
     */
    const code =
      readString(
        body.code,
      );

    const discountPercent =
      readDiscountPercent(
        body.discountPercent,
      );

    const maxUses =
      readPositiveInteger(
        body.maxUses,
      );

    const isActive =
      typeof body.isActive ===
      "boolean"
        ? body.isActive
        : true;

    const oneUsePerPhone =
      typeof body.oneUsePerPhone ===
      "boolean"
        ? body.oneUsePerPhone
        : true;

    const startsAt =
      readDate(
        body.startsAt,
      );

    const endsAt =
      readDate(
        body.endsAt,
      );

    if (
      !isValidCouponCode(
        code,
      )
    ) {
      return errorResponse(
        "Coupon code must be between 2 and 50 characters and may contain only letters, numbers, hyphens and underscores.",
        400,
      );
    }

    if (
      discountPercent === null
    ) {
      return errorResponse(
        "Discount percentage must be greater than 0 and no more than 100.",
        400,
      );
    }

    if (
      maxUses === null
    ) {
      return errorResponse(
        "Maximum customers must be a whole number between 1 and 1000000.",
        400,
      );
    }

    if (!startsAt) {
      return errorResponse(
        "Enter a valid coupon start date and time.",
        400,
      );
    }

    if (!endsAt) {
      return errorResponse(
        "Enter a valid coupon end date and time.",
        400,
      );
    }

    if (
      startsAt.getTime() >=
      endsAt.getTime()
    ) {
      return errorResponse(
        "Coupon end date and time must be after the start date and time.",
        400,
      );
    }

    const coupon =
      await prisma.coupon.create({
        data: {
          code,
          discountPercent,
          maxUses,
          isActive,
          oneUsePerPhone,
          startsAt,
          endsAt,
        },
      });

    return NextResponse.json(
      serializeCoupon(
        coupon,
      ),
      {
        status: 201,
        headers: noStoreHeaders(),
      },
    );
  } catch (error) {
    console.error(
      "POST Coupon Error:",
      error,
    );

    if (
      error instanceof
        Prisma
          .PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return errorResponse(
        "That exact coupon code already exists.",
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
      "Failed to create coupon.",
      500,
    );
  }
}
