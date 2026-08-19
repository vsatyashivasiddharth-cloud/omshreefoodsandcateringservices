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

    const couponId =
      id.trim();

    if (!couponId) {
      return errorResponse(
        "Coupon ID is required.",
        400,
      );
    }

    const coupon =
      await prisma.coupon.findUnique({
        where: {
          id: couponId,
        },
      });

    if (!coupon) {
      return errorResponse(
        "Coupon not found.",
        404,
      );
    }

    return NextResponse.json(
      serializeCoupon(
        coupon,
      ),
      {
        status: 200,
        headers: noStoreHeaders(),
      },
    );
  } catch (error) {
    console.error(
      "GET Coupon Error:",
      error,
    );

    return errorResponse(
      "Failed to load coupon.",
      500,
    );
  }
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

    const couponId =
      id.trim();

    if (!couponId) {
      return errorResponse(
        "Coupon ID is required.",
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
        : null;

    const oneUsePerPhone =
      typeof body.oneUsePerPhone ===
      "boolean"
        ? body.oneUsePerPhone
        : null;

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

    if (
      isActive === null
    ) {
      return errorResponse(
        "Coupon active status is required.",
        400,
      );
    }

    if (
      oneUsePerPhone === null
    ) {
      return errorResponse(
        "One-use-per-phone setting is required.",
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

    const existingCoupon =
      await prisma.coupon.findUnique({
        where: {
          id: couponId,
        },
        select: {
          id: true,
        },
      });

    if (!existingCoupon) {
      return errorResponse(
        "Coupon not found.",
        404,
      );
    }

    const coupon =
      await prisma.coupon.update({
        where: {
          id: couponId,
        },
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
        status: 200,
        headers: noStoreHeaders(),
      },
    );
  } catch (error) {
    console.error(
      "PUT Coupon Error:",
      error,
    );

    if (
      error instanceof
        Prisma
          .PrismaClientKnownRequestError
    ) {
      if (
        error.code === "P2002"
      ) {
        return errorResponse(
          "That exact coupon code already exists.",
          409,
        );
      }

      if (
        error.code === "P2025"
      ) {
        return errorResponse(
          "Coupon not found.",
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
      "Failed to update coupon.",
      500,
    );
  }
}

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

    const couponId =
      id.trim();

    if (!couponId) {
      return errorResponse(
        "Coupon ID is required.",
        400,
      );
    }

    const body: unknown =
      await request.json();

    if (
      !isRecord(body) ||
      typeof body.isActive !==
        "boolean"
    ) {
      return errorResponse(
        "Coupon active status is required.",
        400,
      );
    }

    const coupon =
      await prisma.coupon.update({
        where: {
          id: couponId,
        },
        data: {
          isActive:
            body.isActive,
        },
      });

    return NextResponse.json(
      serializeCoupon(
        coupon,
      ),
      {
        status: 200,
        headers: noStoreHeaders(),
      },
    );
  } catch (error) {
    console.error(
      "PATCH Coupon Error:",
      error,
    );

    if (
      error instanceof
        Prisma
          .PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return errorResponse(
        "Coupon not found.",
        404,
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
      "Failed to update coupon status.",
      500,
    );
  }
}


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

    const couponId =
      id.trim();

    if (!couponId) {
      return errorResponse(
        "Coupon ID is required.",
        400,
      );
    }

    const coupon =
      await prisma.coupon.delete({
        where: {
          id: couponId,
        },
      });

    return NextResponse.json(
      {
        id: coupon.id,
        code: coupon.code,
      },
      {
        status: 200,
        headers: noStoreHeaders(),
      },
    );
  } catch (error) {
    console.error(
      "DELETE Coupon Error:",
      error,
    );

    if (
      error instanceof
        Prisma
          .PrismaClientKnownRequestError
    ) {
      if (
        error.code === "P2025"
      ) {
        return errorResponse(
          "Coupon not found.",
          404,
        );
      }

      if (
        error.code === "P2003"
      ) {
        return errorResponse(
          "This coupon has usage history and cannot be deleted. Disable it instead.",
          409,
        );
      }
    }

    return errorResponse(
      "Failed to delete coupon.",
      500,
    );
  }
}
