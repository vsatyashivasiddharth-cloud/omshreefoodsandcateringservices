import {
  NextRequest,
  NextResponse,
} from "next/server";
import {
  PrintJobStatus,
} from "@prisma/client";

import prisma from "@/lib/prisma";
import {
  isPrintBridgeAuthorized,
} from "@/lib/staff-print-bridge-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

interface PrintJobResultBody {
  status?: unknown;
  claimedAt?: unknown;
  error?: unknown;
}

const MAX_ERROR_LENGTH = 2000;

function noStoreHeaders() {
  return {
    "Cache-Control":
      "private, no-store, max-age=0",
  };
}

function jsonResponse(
  body: unknown,
  status = 200,
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

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext,
) {
  if (
    !isPrintBridgeAuthorized(
      request,
    )
  ) {
    return jsonResponse(
      {
        success: false,
        error: "Unauthorized.",
      },
      401,
    );
  }

  try {
    const { id } =
      await params;

    const jobId =
      id.trim();

    if (!jobId) {
      return jsonResponse(
        {
          success: false,
          error:
            "Print job ID is required.",
        },
        400,
      );
    }

    const rawBody: unknown =
      await request.json();

    if (!isRecord(rawBody)) {
      return jsonResponse(
        {
          success: false,
          error:
            "Invalid request body.",
        },
        400,
      );
    }

    const body =
      rawBody as PrintJobResultBody;

    if (
      body.status !== "PRINTED" &&
      body.status !== "FAILED"
    ) {
      return jsonResponse(
        {
          success: false,
          error:
            "Print result must be PRINTED or FAILED.",
        },
        400,
      );
    }

    if (
      typeof body.claimedAt !==
      "string"
    ) {
      return jsonResponse(
        {
          success: false,
          error:
            "claimedAt is required.",
        },
        400,
      );
    }

    const claimedAt =
      new Date(
        body.claimedAt,
      );

    if (
      Number.isNaN(
        claimedAt.getTime(),
      )
    ) {
      return jsonResponse(
        {
          success: false,
          error:
            "claimedAt is invalid.",
        },
        400,
      );
    }

    let failureMessage:
      | string
      | null = null;

    if (
      body.status === "FAILED"
    ) {
      if (
        typeof body.error !==
        "string" ||
        !body.error.trim()
      ) {
        return jsonResponse(
          {
            success: false,
            error:
              "An error message is required for a failed print.",
          },
          400,
        );
      }

      failureMessage =
        body.error
          .trim()
          .slice(
            0,
            MAX_ERROR_LENGTH,
          );
    }

    const now =
      new Date();

    const updateResult =
      await prisma
        .printJob.updateMany({
          where: {
            id:
              jobId,

            status:
              PrintJobStatus
                .PRINTING,

            claimedAt,
          },

          data:
            body.status ===
            "PRINTED"
              ? {
                  status:
                    PrintJobStatus
                      .PRINTED,

                  printedAt:
                    now,

                  lastError:
                    null,
                }
              : {
                  status:
                    PrintJobStatus
                      .FAILED,

                  printedAt:
                    null,

                  lastError:
                    failureMessage,
                },
        });

    if (
      updateResult.count !== 1
    ) {
      return jsonResponse(
        {
          success: false,

          error:
            "This print claim is no longer active.",
        },
        409,
      );
    }

    return jsonResponse({
      success: true,

      job: {
        id:
          jobId,

        status:
          body.status,

        claimedAt:
          claimedAt
            .toISOString(),

        printedAt:
          body.status ===
          "PRINTED"
            ? now.toISOString()
            : null,

        error:
          failureMessage,
      },
    });
  } catch (error) {
    console.error(
      "Failed to acknowledge print job:",
      error,
    );

    if (
      error instanceof SyntaxError
    ) {
      return jsonResponse(
        {
          success: false,
          error:
            "Invalid request body.",
        },
        400,
      );
    }

    return jsonResponse(
      {
        success: false,
        error:
          "Unable to update the print job.",
      },
      500,
    );
  }
}
