import {
  NextRequest,
  NextResponse,
} from "next/server";
import { compare } from "bcrypt";

import {
  ADMIN_COOKIE_NAME,
  STAFF_DEVICE_COOKIE_NAME,
  STAFF_DEVICE_MAX_AGE_SECONDS,
  createStaffDeviceToken,
  createToken,
} from "@/lib/auth";
import prisma from "@/lib/prisma";

interface LoginRequestBody {
  email?: unknown;
  password?: unknown;
  sessionType?: unknown;
}

type LoginSessionType =
  | "ADMIN"
  | "STAFF_DEVICE";

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function noStoreHeaders() {
  return {
    "Cache-Control":
      "private, no-store, max-age=0",
  };
}

export async function POST(
  request: NextRequest,
) {
  try {
    const rawBody: unknown =
      await request.json();

    if (!isRecord(rawBody)) {
      return NextResponse.json(
        {
          error:
            "Invalid login request.",
        },
        {
          status: 400,
          headers:
            noStoreHeaders(),
        },
      );
    }

    const body =
      rawBody as LoginRequestBody;

    const email =
      typeof body.email === "string"
        ? body.email
            .trim()
            .toLowerCase()
        : "";

    const password =
      typeof body.password ===
      "string"
        ? body.password
        : "";

    const sessionType:
      LoginSessionType =
        body.sessionType ===
        "STAFF_DEVICE"
          ? "STAFF_DEVICE"
          : "ADMIN";

    if (!email || !password) {
      return NextResponse.json(
        {
          error:
            "Email and password are required.",
        },
        {
          status: 400,
          headers:
            noStoreHeaders(),
        },
      );
    }

    if (
      email.length > 150 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid email or password.",
        },
        {
          status: 401,
          headers:
            noStoreHeaders(),
        },
      );
    }

    if (
      password.length < 1 ||
      password.length > 200
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid email or password.",
        },
        {
          status: 401,
          headers:
            noStoreHeaders(),
        },
      );
    }

    const admin =
      await prisma.admin.findUnique({
        where: {
          email,
        },

        select: {
          id: true,
          email: true,
          password: true,
        },
      });

    /*
     * Always return the same error for an
     * unknown email or incorrect password.
     * This avoids revealing whether an
     * administrator account exists.
     */
    if (!admin) {
      return NextResponse.json(
        {
          error:
            "Invalid email or password.",
        },
        {
          status: 401,
          headers:
            noStoreHeaders(),
        },
      );
    }

    const validPassword =
      await compare(
        password,
        admin.password,
      );

    if (!validPassword) {
      return NextResponse.json(
        {
          error:
            "Invalid email or password.",
        },
        {
          status: 401,
          headers:
            noStoreHeaders(),
        },
      );
    }

    const token =
      sessionType ===
      "STAFF_DEVICE"
        ? await createStaffDeviceToken({
            id:
              admin.id,
            email:
              admin.email,
          })
        : await createToken({
            id:
              admin.id,
            email:
              admin.email,
          });

    const response =
      NextResponse.json(
        {
          success: true,
          message:
            sessionType ===
            "STAFF_DEVICE"
              ? "Staff login successful."
              : "Login successful.",
        },
        {
          status: 200,
          headers:
            noStoreHeaders(),
        },
      );

    if (
      sessionType ===
      "STAFF_DEVICE"
    ) {
      /*
       * Staff PWA device session.
       *
       * This cookie deliberately persists
       * across normal browser/PWA restarts.
       */
      response.cookies.set(
        STAFF_DEVICE_COOKIE_NAME,
        token,
        {
          httpOnly: true,

          secure:
            process.env.NODE_ENV ===
            "production",

          sameSite: "lax",

          path: "/",

          maxAge:
            STAFF_DEVICE_MAX_AGE_SECONDS,
        },
      );
    } else {
      /*
       * Keep the Admin panel's existing
       * session-cookie behavior unchanged.
       *
       * There is intentionally no maxAge
       * or expires value for admin_token.
       */
      response.cookies.set(
        ADMIN_COOKIE_NAME,
        token,
        {
          httpOnly: true,

          secure:
            process.env.NODE_ENV ===
            "production",

          sameSite: "lax",

          path: "/",
        },
      );
    }

    return response;
  } catch (error) {
    console.error(
      "Admin login failed:",
      error,
    );

    if (
      error instanceof SyntaxError
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid login request.",
        },
        {
          status: 400,
          headers:
            noStoreHeaders(),
        },
      );
    }

    return NextResponse.json(
      {
        error:
          "Unable to complete administrator login.",
      },
      {
        status: 500,
        headers:
          noStoreHeaders(),
      },
    );
  }
}