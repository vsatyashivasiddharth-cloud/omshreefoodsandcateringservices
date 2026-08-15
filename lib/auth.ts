import "server-only";

import type {
  NextRequest,
} from "next/server";
import {
  SignJWT,
  jwtVerify,
} from "jose";

import prisma from "@/lib/prisma";

export const ADMIN_COOKIE_NAME =
  "admin_token";

export const STAFF_DEVICE_COOKIE_NAME =
  "staff_device_token";

export const STAFF_DEVICE_MAX_AGE_SECONDS =
  60 * 60 * 24 * 365;

/*
 * Maximum lifetime of an authenticated
 * administrator JWT.
 *
 * The browser cookie itself remains a
 * session cookie, while this provides an
 * additional server-side expiration.
 */
const ADMIN_TOKEN_EXPIRATION =
  "12h";

/*
 * Staff PWA device sessions are deliberately
 * long-lived so an installed operational app
 * does not require repeated login.
 */
const STAFF_DEVICE_TOKEN_EXPIRATION =
  "365d";

interface AdminTokenPayload {
  id: string;
  email: string;
  type: "ADMIN";
}

interface StaffDeviceTokenPayload {
  id: string;
  email: string;
  type: "STAFF_DEVICE";
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

function isAdminTokenPayload(
  value: unknown,
): value is AdminTokenPayload {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return false;
  }

  const payload =
    value as Partial<AdminTokenPayload>;

  return (
    typeof payload.id === "string" &&
    payload.id.length > 0 &&
    typeof payload.email ===
      "string" &&
    payload.email.length > 0 &&
    payload.type === "ADMIN"
  );
}

function isStaffDeviceTokenPayload(
  value: unknown,
): value is StaffDeviceTokenPayload {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return false;
  }

  const payload =
    value as Partial<StaffDeviceTokenPayload>;

  return (
    typeof payload.id === "string" &&
    payload.id.length > 0 &&
    typeof payload.email ===
      "string" &&
    payload.email.length > 0 &&
    payload.type === "STAFF_DEVICE"
  );
}

function normalizeTokenIdentity(
  payload: {
    id: string;
    email: string;
  },
) {
  const normalizedEmail =
    payload.email
      .trim()
      .toLowerCase();

  if (
    !payload.id.trim() ||
    !normalizedEmail
  ) {
    throw new Error(
      "Invalid authentication token payload.",
    );
  }

  return {
    id:
      payload.id.trim(),
    email:
      normalizedEmail,
  };
}

export async function createToken(
  payload: {
    id: string;
    email: string;
  },
) {
  const identity =
    normalizeTokenIdentity(payload);

  return new SignJWT({
    id:
      identity.id,
    email:
      identity.email,
    type: "ADMIN",
  })
    .setProtectedHeader({
      alg: "HS256",
      typ: "JWT",
    })
    .setSubject(identity.id)
    .setIssuedAt()
    .setExpirationTime(
      ADMIN_TOKEN_EXPIRATION,
    )
    .sign(getAuthSecret());
}

export async function createStaffDeviceToken(
  payload: {
    id: string;
    email: string;
  },
) {
  const identity =
    normalizeTokenIdentity(payload);

  return new SignJWT({
    id:
      identity.id,
    email:
      identity.email,
    type: "STAFF_DEVICE",
  })
    .setProtectedHeader({
      alg: "HS256",
      typ: "JWT",
    })
    .setSubject(identity.id)
    .setIssuedAt()
    .setExpirationTime(
      STAFF_DEVICE_TOKEN_EXPIRATION,
    )
    .sign(getAuthSecret());
}

export async function verifyToken(
  token: string,
): Promise<AdminTokenPayload | null> {
  if (!token.trim()) {
    return null;
  }

  try {
    const { payload } =
      await jwtVerify(
        token,
        getAuthSecret(),
        {
          algorithms: [
            "HS256",
          ],
        },
      );

    if (
      !isAdminTokenPayload(
        payload,
      )
    ) {
      return null;
    }

    return {
      id:
        payload.id,
      email:
        payload.email
          .trim()
          .toLowerCase(),
      type:
        "ADMIN",
    };
  } catch {
    return null;
  }
}

export async function verifyStaffDeviceToken(
  token: string,
): Promise<StaffDeviceTokenPayload | null> {
  if (!token.trim()) {
    return null;
  }

  try {
    const { payload } =
      await jwtVerify(
        token,
        getAuthSecret(),
        {
          algorithms: [
            "HS256",
          ],
        },
      );

    if (
      !isStaffDeviceTokenPayload(
        payload,
      )
    ) {
      return null;
    }

    return {
      id:
        payload.id,
      email:
        payload.email
          .trim()
          .toLowerCase(),
      type:
        "STAFF_DEVICE",
    };
  } catch {
    return null;
  }
}

async function authenticateIdentity(
  payload: {
    id: string;
    email: string;
  },
  messages: {
    missing: string;
    mismatch: string;
  },
): Promise<AdminAuthenticationResult> {
  const admin =
    await prisma.admin.findUnique({
      where: {
        id:
          payload.id,
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
        messages.missing,
      status: 403,
    };
  }

  if (
    admin.email
      .trim()
      .toLowerCase() !==
    payload.email
      .trim()
      .toLowerCase()
  ) {
    return {
      authenticated: false,
      error:
        messages.mismatch,
      status: 403,
    };
  }

  return {
    authenticated: true,

    admin: {
      id:
        admin.id,
      name:
        admin.name,
      email:
        admin.email,
    },
  };
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

    return authenticateIdentity(
      payload,
      {
        missing:
          "Administrator account was not found.",
        mismatch:
          "Administrator session validation failed.",
      },
    );
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

export async function requireStaff(
  request: NextRequest,
): Promise<AdminAuthenticationResult> {
  try {
    const staffToken =
      request.cookies.get(
        STAFF_DEVICE_COOKIE_NAME,
      )?.value;

    if (staffToken) {
      const payload =
        await verifyStaffDeviceToken(
          staffToken,
        );

      if (payload) {
        return authenticateIdentity(
          payload,
          {
            missing:
              "Staff account was not found.",
            mismatch:
              "Staff device session validation failed.",
          },
        );
      }
    }

    /*
     * Existing authenticated administrators
     * may continue using the Staff interface.
     */
    return requireAdmin(request);
  } catch (error) {
    console.error(
      "Staff authentication failed:",
      error,
    );

    return {
      authenticated: false,
      error:
        "Unable to verify the Staff session.",
      status: 500,
    };
  }
}
