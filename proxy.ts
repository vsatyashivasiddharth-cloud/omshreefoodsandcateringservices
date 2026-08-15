import {
  NextRequest,
  NextResponse,
} from "next/server";
import { jwtVerify } from "jose";

const ADMIN_COOKIE_NAME =
  "admin_token";

const STAFF_DEVICE_COOKIE_NAME =
  "staff_device_token";

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

async function hasValidTypedSession(
  request: NextRequest,
  options: {
    cookieName: string;
    type: "ADMIN" | "STAFF_DEVICE";
  },
) {
  const token =
    request.cookies.get(
      options.cookieName,
    )?.value;

  if (!token) {
    return false;
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

    return (
      typeof payload.id === "string" &&
      payload.id.length > 0 &&
      typeof payload.email ===
        "string" &&
      payload.email.length > 0 &&
      payload.type ===
        options.type
    );
  } catch {
    return false;
  }
}

function createLoginUrl(
  request: NextRequest,
) {
  const loginUrl =
    new URL(
      "/admin/login",
      request.url,
    );

  const requestedPath =
    `${request.nextUrl.pathname}${request.nextUrl.search}`;

  loginUrl.searchParams.set(
    "next",
    requestedPath,
  );

  return loginUrl;
}

function isSafeAuthenticatedDestination(
  destination: string | null,
) {
  if (
    !destination ||
    destination.startsWith("//")
  ) {
    return false;
  }

  if (
    destination.startsWith(
      "/admin/login",
    )
  ) {
    return false;
  }

  return (
    destination.startsWith(
      "/admin/",
    ) ||
    destination.startsWith(
      "/staff/",
    )
  );
}

function clearCookie(
  response: NextResponse,
  cookieName: string,
) {
  response.cookies.set(
    cookieName,
    "",
    {
      httpOnly: true,

      secure:
        process.env.NODE_ENV ===
        "production",

      sameSite: "lax",

      path: "/",

      maxAge: 0,

      expires:
        new Date(0),
    },
  );
}

export async function proxy(
  request: NextRequest,
) {
  const pathname =
    request.nextUrl.pathname;

  const isLoginPage =
    pathname ===
    "/admin/login";

  const isStaffRoute =
    pathname.startsWith(
      "/staff/",
    );

  const adminAuthenticated =
    await hasValidTypedSession(
      request,
      {
        cookieName:
          ADMIN_COOKIE_NAME,
        type:
          "ADMIN",
      },
    );

  const staffAuthenticated =
    await hasValidTypedSession(
      request,
      {
        cookieName:
          STAFF_DEVICE_COOKIE_NAME,
        type:
          "STAFF_DEVICE",
      },
    );

  if (isLoginPage) {
    const requestedDestination =
      request.nextUrl
        .searchParams
        .get("next");

    const safeDestination =
      requestedDestination &&
      isSafeAuthenticatedDestination(
        requestedDestination,
      )
        ? requestedDestination
        : "/admin/dashboard";

    const destinationIsStaff =
      safeDestination.startsWith(
        "/staff/",
      );

    if (
      (
        destinationIsStaff &&
        (
          staffAuthenticated ||
          adminAuthenticated
        )
      ) ||
      (
        !destinationIsStaff &&
        adminAuthenticated
      )
    ) {
      return NextResponse.redirect(
        new URL(
          safeDestination,
          request.url,
        ),
      );
    }

    return NextResponse.next();
  }

  if (isStaffRoute) {
    if (
      staffAuthenticated ||
      adminAuthenticated
    ) {
      return NextResponse.next();
    }

    const response =
      NextResponse.redirect(
        createLoginUrl(request),
      );

    if (
      request.cookies.has(
        STAFF_DEVICE_COOKIE_NAME,
      )
    ) {
      clearCookie(
        response,
        STAFF_DEVICE_COOKIE_NAME,
      );
    }

    return response;
  }

  /*
   * Admin routes intentionally continue to
   * accept only the short-lived Admin token.
   */
  if (!adminAuthenticated) {
    const response =
      NextResponse.redirect(
        createLoginUrl(request),
      );

    if (
      request.cookies.has(
        ADMIN_COOKIE_NAME,
      )
    ) {
      clearCookie(
        response,
        ADMIN_COOKIE_NAME,
      );
    }

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/staff/:path*",
  ],
};