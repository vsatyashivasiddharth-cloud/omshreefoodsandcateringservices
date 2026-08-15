import "server-only";

import {
  timingSafeEqual,
} from "node:crypto";

import type {
  NextRequest,
} from "next/server";

function getPrintBridgeToken() {
  const token =
    process.env
      .STAFF_PRINT_BRIDGE_TOKEN
      ?.trim();

  if (!token) {
    throw new Error(
      "Missing required environment variable: STAFF_PRINT_BRIDGE_TOKEN",
    );
  }

  return token;
}

export function isPrintBridgeAuthorized(
  request: NextRequest,
) {
  try {
    const authorization =
      request.headers.get(
        "authorization",
      );

    if (
      !authorization ||
      !authorization.startsWith(
        "Bearer ",
      )
    ) {
      return false;
    }

    const receivedToken =
      authorization
        .slice(
          "Bearer ".length,
        )
        .trim();

    if (!receivedToken) {
      return false;
    }

    const expectedBuffer =
      Buffer.from(
        getPrintBridgeToken(),
        "utf8",
      );

    const receivedBuffer =
      Buffer.from(
        receivedToken,
        "utf8",
      );

    if (
      expectedBuffer.length !==
      receivedBuffer.length
    ) {
      return false;
    }

    return timingSafeEqual(
      expectedBuffer,
      receivedBuffer,
    );
  } catch (error) {
    console.error(
      "Print bridge authentication failed:",
      error,
    );

    return false;
  }
}
