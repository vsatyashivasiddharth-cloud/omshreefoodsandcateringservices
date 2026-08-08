import {
  NextRequest,
  NextResponse,
} from "next/server";
import { Prisma } from "@prisma/client";

import prisma from "@/lib/prisma";
import { contactSchema } from "@/lib/validations/contact";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RATE_LIMIT_WINDOW_MS =
  10 * 60 * 1000;

const MAX_SUBMISSIONS_PER_EMAIL = 3;

function noStoreHeaders() {
  return {
    "Cache-Control":
      "private, no-store, max-age=0",
    Pragma: "no-cache",
    Expires: "0",
  };
}

function jsonResponse(
  body: unknown,
  status: number,
  additionalHeaders?: Record<
    string,
    string
  >,
) {
  return NextResponse.json(
    body,
    {
      status,

      headers: {
        ...noStoreHeaders(),
        ...additionalHeaders,
      },
    },
  );
}

export async function POST(
  request: NextRequest,
) {
  try {
    const rawBody: unknown =
      await request.json();

    const result =
      contactSchema.safeParse(
        rawBody,
      );

    if (!result.success) {
      return jsonResponse(
        {
          success: false,

          message:
            result.error.issues[0]
              ?.message ??
            "Invalid contact form data.",
        },
        400,
      );
    }

    const data = result.data;

    /*
     * Persistent database-backed limit.
     *
     * This prevents one email address
     * from repeatedly submitting the
     * form and works across Vercel
     * serverless instances.
     */
    const windowStartedAt =
      new Date(
        Date.now() -
          RATE_LIMIT_WINDOW_MS,
      );

    const recentSubmissions =
      await prisma.contactInquiry.count({
        where: {
          email: data.email,

          createdAt: {
            gte: windowStartedAt,
          },
        },
      });

    if (
      recentSubmissions >=
      MAX_SUBMISSIONS_PER_EMAIL
    ) {
      return jsonResponse(
        {
          success: false,

          message:
            "Too many messages were submitted recently. Please wait a few minutes and try again.",
        },
        429,
        {
          "Retry-After": String(
            Math.ceil(
              RATE_LIMIT_WINDOW_MS /
                1000,
            ),
          ),
        },
      );
    }

    await prisma.contactInquiry.create({
      data: {
        name: data.name,
        email: data.email,

        phone:
          data.phone ?? null,

        subject:
          data.subject ?? null,

        message: data.message,
      },
    });

    /*
     * Do not return the database record.
     * It contains customer PII and
     * internal fields the browser does
     * not need.
     */
    return jsonResponse(
      {
        success: true,

        message:
          "Thank you! We'll get back to you soon.",
      },
      201,
    );
  } catch (error) {
    if (
      error instanceof SyntaxError
    ) {
      return jsonResponse(
        {
          success: false,
          message:
            "Invalid request body.",
        },
        400,
      );
    }

    if (
      error instanceof
        Prisma
          .PrismaClientKnownRequestError
    ) {
      console.error(
        "Contact database error:",
        error.code,
      );

      return jsonResponse(
        {
          success: false,

          message:
            "Unable to submit your message right now.",
        },
        500,
      );
    }

    console.error(
      "Contact API Error:",
      error,
    );

    return jsonResponse(
      {
        success: false,

        message:
          "Unable to submit your message right now.",
      },
      500,
    );
  }
}