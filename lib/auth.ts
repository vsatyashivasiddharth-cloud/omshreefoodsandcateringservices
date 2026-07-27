import "server-only";

import type { NextRequest } from "next/server";
import { SignJWT, jwtVerify } from "jose";

import prisma from "@/lib/prisma";

export const ADMIN_COOKIE_NAME =
  "admin_token";

const TOKEN_EXPIRATION = "7d";

interface AuthTokenPayload {
  id: string;
  email: string;
  type: "ADMIN";
}

export interface AuthenticatedAdmin {
  id: string;
  name: string;
  email: string;
}

export type AdminAuthenticationResult =
  | {
      authenticated: true;
      admin: AuthenticatedAdmin;
    }
  | {
      authenticated: false;
      error: string;
      status: 401 | 403 | 500;
    };

function getAuthSecret() {
  const value =
    process.env.AUTH_SECRET?.trim();

  if (!value) {
    throw new Error(
      "Missing required environment variable: AUTH_SECRET",
    );
  }

  return new TextEncoder().encode(
    value,
  );
}

function isAuthTokenPayload(
  value: unknown,
): value is AuthTokenPayload {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return false;
  }

  const payload =
    value as Partial<AuthTokenPayload>;

  return (
    typeof payload.id === "string" &&
    payload.id.length > 0 &&
    typeof payload.email ===
      "string" &&
    payload.email.length > 0 &&
    payload.type === "ADMIN"
  );
}

export async function createToken(
  payload: {
    id: string;
    email: string;
  },
) {
  const tokenPayload: AuthTokenPayload = {
    id: payload.id,
    email: payload.email,
    type: "ADMIN",
  };

  return new SignJWT({
    id: tokenPayload.id,
    email: tokenPayload.email,
    type: tokenPayload.type,
  })
    .setProtectedHeader({
      alg: "HS256",
      typ: "JWT",
    })
    .setSubject(tokenPayload.id)
    .setIssuedAt()
    .setExpirationTime(
      TOKEN_EXPIRATION,
    )
    .sign(getAuthSecret());
}

export async function verifyToken(
  token: string,
): Promise<AuthTokenPayload | null> {
  try {
    const { payload } =
      await jwtVerify(
        token,
        getAuthSecret(),
        {
          algorithms: ["HS256"],
        },
      );

    if (!isAuthTokenPayload(payload)) {
      return null;
    }

    return {
      id: payload.id,
      email: payload.email,
      type: payload.type,
    };
  } catch {
    return null;
  }
}

export async function requireAdmin(
  request: NextRequest,
): Promise<AdminAuthenticationResult> {
  try {
    const token =
      request.cookies.get(
        ADMIN_COOKIE_NAME,
      )?.value;

    if (!token) {
      return {
        authenticated: false,
        error:
          "Administrator authentication is required.",
        status: 401,
      };
    }

    const payload =
      await verifyToken(token);

    if (!payload) {
      return {
        authenticated: false,
        error:
          "Your administrator session is invalid or has expired.",
        status: 401,
      };
    }

    const admin =
      await prisma.admin.findUnique({
        where: {
          id: payload.id,
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });

    if (!admin) {
      return {
        authenticated: false,
        error:
          "Administrator account was not found.",
        status: 403,
      };
    }

    if (
      admin.email.toLowerCase() !==
      payload.email.toLowerCase()
    ) {
      return {
        authenticated: false,
        error:
          "Administrator session validation failed.",
        status: 403,
      };
    }

    return {
      authenticated: true,
      admin,
    };
  } catch (error) {
    console.error(
      "Admin authentication failed:",
      error,
    );

    return {
      authenticated: false,
      error:
        "Unable to verify the administrator session.",
      status: 500,
    };
  }
}