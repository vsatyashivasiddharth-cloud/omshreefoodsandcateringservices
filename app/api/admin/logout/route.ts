import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  ADMIN_COOKIE_NAME,
} from "@/lib/auth";

function noStoreHeaders() {
  return {
    "Cache-Control":
      "private, no-store, max-age=0",
  };
}

export async function POST(
  _request: NextRequest,
) {
  const response =
    NextResponse.json(
      {
        success: true,
        message:
          "Logged out successfully.",
      },
      {
        status: 200,
        headers:
          noStoreHeaders(),
      },
    );

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

  return response;
}