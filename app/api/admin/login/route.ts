import {
  NextRequest,
  NextResponse,
} from "next/server";
import { compare } from "bcrypt";

import {
  ADMIN_COOKIE_NAME,
  createToken,
} from "@/lib/auth";
import prisma from "@/lib/prisma";

interface LoginRequestBody {
  email?: unknown;
  password?: unknown;
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
      await createToken({
        id: admin.id,
        email: admin.email,
      });

    const response =
      NextResponse.json(
        {
          success: true,
          message:
            "Login successful.",
        },
        {
          status: 200,
          headers:
            noStoreHeaders(),
        },
      );

    /*
     * IMPORTANT:
     *
     * There is intentionally no maxAge or
     * expires value here.
     *
     * This makes admin_token a browser
     * session cookie rather than a cookie
     * deliberately persisted for 7 days.
     *
     * The JWT itself still has its own
     * server-verified expiration.
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