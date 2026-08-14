import {
  NextRequest,
  NextResponse,
} from "next/server";
import { jwtVerify } from "jose";

const ADMIN_COOKIE_NAME = "admin_token";

function getAuthSecret() {
  const value =
    process.env.AUTH_SECRET?.trim();

  if (!value) {
    throw new Error(
      "Missing required environment variable: AUTH_SECRET",
    );
  }

  return new TextEncoder().encode(value);
}

async function hasValidAdminSession(
  request: NextRequest,
) {
  const token =
    request.cookies.get(
      ADMIN_COOKIE_NAME,
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
          algorithms: ["HS256"],
        },
      );

    return (
      typeof payload.id === "string" &&
      payload.id.length > 0 &&
      typeof payload.email ===
        "string" &&
      payload.email.length > 0 &&
      payload.type === "ADMIN"
    );
  } catch {
    return false;
  }
}

function createLoginUrl(
  request: NextRequest,
) {
  const loginUrl = new URL(
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

export async function proxy(
  request: NextRequest,
) {
  const pathname =
    request.nextUrl.pathname;

  const isLoginPage =
    pathname === "/admin/login";

  const authenticated =
    await hasValidAdminSession(
      request,
    );

  /*
   * Admin login page:
   *
   * - unauthenticated users may see it
   * - authenticated administrators may
   *   continue to either an Admin route
   *   or the Staff Orders interface
   */
  if (isLoginPage) {
    if (!authenticated) {
      return NextResponse.next();
    }

    const requestedDestination =
  request.nextUrl.searchParams.get(
    "next",
  );

const safeDestination =
  requestedDestination &&
  isSafeAuthenticatedDestination(
    requestedDestination,
  )
    ? requestedDestination
    : "/admin/dashboard";

return NextResponse.redirect(
  new URL(
    safeDestination,
    request.url,
  ),
);
  }

  /*
   * Both /admin and /staff routes use
   * the existing authenticated Admin
   * session.
   */
  if (!authenticated) {
    const response =
      NextResponse.redirect(
        createLoginUrl(request),
      );

    /*
     * Remove an invalid/expired cookie
     * before showing login again.
     */
    if (
      request.cookies.has(
        ADMIN_COOKIE_NAME,
      )
    ) {
      response.cookies.set(
        ADMIN_COOKIE_NAME,
        "",
        {
          httpOnly: true,
          secure:
            process.env.NODE_ENV ===
            "production",
          sameSite: "lax",
          path: "/",
          maxAge: 0,
          expires: new Date(0),
        },
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