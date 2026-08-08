import {
  NextRequest,
  NextResponse,
} from "next/server";
import {
  Prisma,
} from "@prisma/client";
import bcrypt from "bcrypt";

import prisma from "@/lib/prisma";
import {
  normalizeIndianPhone,
} from "@/lib/phone";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BCRYPT_ROUNDS = 12;

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_BYTES = 72;

function noStoreHeaders() {
  return {
    "Cache-Control":
      "private, no-store, max-age=0",
    Pragma: "no-cache",
    Expires: "0",
  };
}

function jsonResponse(
  body: unknown,
  status: number,
) {
  return NextResponse.json(
    body,
    {
      status,
      headers: noStoreHeaders(),
    },
  );
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function getTrimmedString(
  value: unknown,
) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function isValidEmail(
  value: string,
) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value,
  );
}

function getUtf8ByteLength(
  value: string,
) {
  return Buffer.byteLength(
    value,
    "utf8",
  );
}

export async function POST(
  request: NextRequest,
) {
  try {
    const rawBody: unknown =
      await request.json();

    if (!isRecord(rawBody)) {
      return jsonResponse(
        {
          error:
            "Invalid request body.",
        },
        400,
      );
    }

    const name =
      getTrimmedString(
        rawBody.name,
      );

    const email =
      getTrimmedString(
        rawBody.email,
      ).toLowerCase();

    const rawPhone =
      getTrimmedString(
        rawBody.phone,
      );

    const password =
      typeof rawBody.password ===
      "string"
        ? rawBody.password
        : "";

    if (
      name.length < 2 ||
      name.length > 100
    ) {
      return jsonResponse(
        {
          error:
            "Please enter a valid name between 2 and 100 characters.",
        },
        400,
      );
    }

    if (
      email.length < 3 ||
      email.length > 150 ||
      !isValidEmail(email)
    ) {
      return jsonResponse(
        {
          error:
            "Please enter a valid email address.",
        },
        400,
      );
    }

    let phone: string | null =
      null;

    if (rawPhone) {
      const normalizedPhone =
        normalizeIndianPhone(
          rawPhone,
        );

      if (!normalizedPhone) {
        return jsonResponse(
          {
            error:
              "Please enter a valid Indian mobile number.",
          },
          400,
        );
      }

      phone = normalizedPhone;
    }

    if (
      password.length <
      MIN_PASSWORD_LENGTH
    ) {
      return jsonResponse(
        {
          error:
            `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
        },
        400,
      );
    }

    /*
     * bcrypt only safely considers up
     * to 72 bytes of password input.
     */
    if (
      getUtf8ByteLength(
        password,
      ) >
      MAX_PASSWORD_BYTES
    ) {
      return jsonResponse(
        {
          error:
            "Password is too long.",
        },
        400,
      );
    }

    const existingUser =
      await prisma.user.findUnique({
        where: {
          email,
        },

        select: {
          id: true,
        },
      });

    if (existingUser) {
      return jsonResponse(
        {
          error:
            "Email already registered.",
        },
        409,
      );
    }

    const hashedPassword =
      await bcrypt.hash(
        password,
        BCRYPT_ROUNDS,
      );

    const user =
      await prisma.user.create({
        data: {
          name,
          email,
          phone,
          password:
            hashedPassword,

          /*
           * Never accept a role from
           * the registration request.
           * Prisma's CUSTOMER default
           * remains in control.
           */
        },

        select: {
          id: true,
          name: true,
          email: true,
        },
      });

    return jsonResponse(
      {
        success: true,

        message:
          "Registration successful.",

        user,
      },
      201,
    );
  } catch (error) {
    if (
      error instanceof SyntaxError
    ) {
      return jsonResponse(
        {
          error:
            "Invalid request body.",
        },
        400,
      );
    }

    /*
     * Handles two simultaneous
     * registrations for the same
     * unique email safely.
     */
    if (
      error instanceof
        Prisma
          .PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return jsonResponse(
        {
          error:
            "Email already registered.",
        },
        409,
      );
    }

    console.error(
      "Registration Error:",
      error,
    );

    return jsonResponse(
      {
        error:
          "Unable to complete registration right now.",
      },
      500,
    );
  }
}