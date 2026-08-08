import {
  createHmac,
} from "node:crypto";
import {
  Prisma,
} from "@prisma/client";

import prisma from "@/lib/prisma";

const WINDOW_MS =
  10 * 60 * 1000;

const IP_ATTEMPT_LIMIT = 30;

const MAX_TRANSACTION_RETRIES = 3;

interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

interface RateLimitTransactionResult {
  attempts: number;
  oldestAttempt: Date | null;
}

function getRateLimitSecret() {
  const secret =
    process.env
      .SHIPPING_QUOTE_RATE_LIMIT_SECRET
      ?.trim();

  if (!secret) {
    throw new Error(
      "SHIPPING_QUOTE_RATE_LIMIT_SECRET is not configured.",
    );
  }

  return secret;
}

function hashIpAddress(
  ipAddress: string,
) {
  return createHmac(
    "sha256",
    getRateLimitSecret(),
  )
    .update(`shipping-quote-ip:${ipAddress}`)
    .digest("hex");
}

function calculateRetryAfterSeconds(
  oldestAttempt: Date | null,
  now: Date,
) {
  if (!oldestAttempt) {
    return Math.ceil(
      WINDOW_MS / 1000,
    );
  }

  const expiresAt =
    oldestAttempt.getTime() +
    WINDOW_MS;

  return Math.max(
    1,
    Math.ceil(
      (expiresAt - now.getTime()) /
        1000,
    ),
  );
}

async function runRateLimitTransaction({
  ipHash,
  windowStartedAt,
}: {
  ipHash: string;
  windowStartedAt: Date;
}): Promise<RateLimitTransactionResult> {
  return prisma.$transaction(
    async (transaction) => {
      await transaction
        .shippingQuoteAttempt
        .create({
          data: {
            ipHash,
          },
        });

      const [
        attempts,
        oldestRecord,
      ] = await Promise.all([
        transaction
          .shippingQuoteAttempt
          .count({
            where: {
              ipHash,

              createdAt: {
                gte:
                  windowStartedAt,
              },
            },
          }),

        transaction
          .shippingQuoteAttempt
          .findFirst({
            where: {
              ipHash,

              createdAt: {
                gte:
                  windowStartedAt,
              },
            },

            orderBy: {
              createdAt: "asc",
            },

            select: {
              createdAt: true,
            },
          }),
      ]);

      return {
        attempts,

        oldestAttempt:
          oldestRecord
            ?.createdAt ?? null,
      };
    },
    {
      isolationLevel:
        Prisma
          .TransactionIsolationLevel
          .Serializable,

      maxWait: 5000,
      timeout: 10000,
    },
  );
}

async function executeWithRetry({
  ipHash,
  windowStartedAt,
}: {
  ipHash: string;
  windowStartedAt: Date;
}) {
  let attempt = 0;

  while (
    attempt <
    MAX_TRANSACTION_RETRIES
  ) {
    try {
      return await runRateLimitTransaction(
        {
          ipHash,
          windowStartedAt,
        },
      );
    } catch (error) {
      attempt += 1;

      const isRetryableConflict =
        error instanceof
          Prisma
            .PrismaClientKnownRequestError &&
        error.code === "P2034";

      if (
        !isRetryableConflict ||
        attempt >=
          MAX_TRANSACTION_RETRIES
      ) {
        throw error;
      }
    }
  }

  throw new Error(
    "Unable to check shipping quote rate limit.",
  );
}

export async function checkShippingQuoteRateLimit(
  ipAddress: string,
): Promise<RateLimitResult> {
  const now = new Date();

  const windowStartedAt =
    new Date(
      now.getTime() -
        WINDOW_MS,
    );

  const ipHash =
    hashIpAddress(
      ipAddress,
    );

  const result =
    await executeWithRetry({
      ipHash,
      windowStartedAt,
    });

  if (
    result.attempts <=
    IP_ATTEMPT_LIMIT
  ) {
    return {
      allowed: true,
      retryAfterSeconds: 0,
    };
  }

  return {
    allowed: false,

    retryAfterSeconds:
      calculateRetryAfterSeconds(
        result.oldestAttempt,
        now,
      ),
  };
}