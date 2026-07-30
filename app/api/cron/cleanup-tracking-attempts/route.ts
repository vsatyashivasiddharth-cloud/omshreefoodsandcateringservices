import {
  NextRequest,
  NextResponse,
} from "next/server";

import prisma from "@/lib/prisma";

const RETENTION_HOURS = 24;

function noStoreHeaders() {
  return {
    "Cache-Control":
      "private, no-store, max-age=0",
    Pragma: "no-cache",
    Expires: "0",
  };
}

function isAuthorized(
  request: NextRequest,
) {
  const cronSecret =
    process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error(
      "CRON_SECRET is not configured.",
    );

    return false;
  }

  const authorization =
    request.headers.get(
      "authorization",
    );

  return (
    authorization ===
    `Bearer ${cronSecret}`
  );
}

export async function GET(
  request: NextRequest,
) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        error: "Unauthorized.",
      },
      {
        status: 401,
        headers: noStoreHeaders(),
      },
    );
  }

  try {
    const deleteBefore = new Date(
      Date.now() -
        RETENTION_HOURS *
          60 *
          60 *
          1000,
    );

    const result =
      await prisma
        .trackingLookupAttempt
        .deleteMany({
          where: {
            createdAt: {
              lt: deleteBefore,
            },
          },
        });

    return NextResponse.json(
      {
        success: true,
        deleted: result.count,
        deleteBefore:
          deleteBefore.toISOString(),
        retentionHours:
          RETENTION_HOURS,
        completedAt:
          new Date().toISOString(),
      },
      {
        status: 200,
        headers: noStoreHeaders(),
      },
    );
  } catch (error) {
    console.error(
      "Tracking-attempt cleanup failed:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to clean tracking attempts.",
      },
      {
        status: 500,
        headers: noStoreHeaders(),
      },
    );
  }
}
