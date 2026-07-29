import {
  createHmac,
} from "node:crypto";
import {
  Prisma,
} from "@prisma/client";

import prisma from "@/lib/prisma";

const WINDOW_MS =
  10 * 60 * 1000;

const PHONE_ATTEMPT_LIMIT = 5;
const IP_ATTEMPT_LIMIT = 25;

const DATABASE_RETENTION_MS =
  24 * 60 * 60 * 1000;

const MAX_TRANSACTION_RETRIES = 3;

interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

interface RateLimitTransactionResult {
  phoneAttempts: number;
  ipAttempts: number;
  oldestPhoneAttempt: Date | null;
  oldestIpAttempt: Date | null;
}

function getRateLimitSecret() {
  const secret =
    process.env
      .TRACK_ORDER_RATE_LIMIT_SECRET;

  if (!secret) {
    throw new Error(
      "TRACK_ORDER_RATE_LIMIT_SECRET is not configured.",
    );
  }

  return secret;
}

function hashIdentifier(
  type: "phone" | "ip",
  value: string,
) {
  return createHmac(
    "sha256",
    getRateLimitSecret(),
  )
    .update(`${type}:${value}`)
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

async function removeExpiredAttempts() {
  /*
   * Run cleanup occasionally instead
   * of adding a delete query to every
   * tracking request.
   */
  if (Math.random() > 0.02) {
    return;
  }

  const deleteBefore =
    new Date(
      Date.now() -
        DATABASE_RETENTION_MS,
    );

  try {
    await prisma
      .trackingLookupAttempt
      .deleteMany({
        where: {
          createdAt: {
            lt: deleteBefore,
          },
        },
      });
  } catch (error) {
    /*
     * Cleanup failure must not prevent
     * customers from tracking orders.
     */
    console.error(
      "Tracking attempt cleanup failed:",
      error,
    );
  }
}

async function runRateLimitTransaction({
  phoneHash,
  ipHash,
  windowStartedAt,
}: {
  phoneHash: string;
  ipHash: string;
  windowStartedAt: Date;
}): Promise<RateLimitTransactionResult> {
  return prisma.$transaction(
    async (transaction) => {
      await transaction
        .trackingLookupAttempt
        .create({
          data: {
            phoneHash,
            ipHash,
          },
        });

      const [
        phoneAttempts,
        ipAttempts,
        oldestPhoneRecord,
        oldestIpRecord,
      ] = await Promise.all([
        transaction
          .trackingLookupAttempt
          .count({
            where: {
              phoneHash,

              createdAt: {
                gte: windowStartedAt,
              },
            },
          }),

        transaction
          .trackingLookupAttempt
          .count({
            where: {
              ipHash,

              createdAt: {
                gte: windowStartedAt,
              },
            },
          }),

        transaction
          .trackingLookupAttempt
          .findFirst({
            where: {
              phoneHash,

              createdAt: {
                gte: windowStartedAt,
              },
            },

            orderBy: {
              createdAt: "asc",
            },

            select: {
              createdAt: true,
            },
          }),

        transaction
          .trackingLookupAttempt
          .findFirst({
            where: {
              ipHash,

              createdAt: {
                gte: windowStartedAt,
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
        phoneAttempts,
        ipAttempts,

        oldestPhoneAttempt:
          oldestPhoneRecord
            ?.createdAt ?? null,

        oldestIpAttempt:
          oldestIpRecord
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
  phoneHash,
  ipHash,
  windowStartedAt,
}: {
  phoneHash: string;
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
          phoneHash,
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
    "Unable to check tracking rate limit.",
  );
}

export async function checkTrackOrderRateLimit({
  phone,
  ipAddress,
}: {
  phone: string;
  ipAddress: string;
}): Promise<RateLimitResult> {
  const now = new Date();

  const windowStartedAt =
    new Date(
      now.getTime() - WINDOW_MS,
    );

  const phoneHash =
    hashIdentifier(
      "phone",
      phone,
    );

  const ipHash =
    hashIdentifier(
      "ip",
      ipAddress,
    );

  const result =
    await executeWithRetry({
      phoneHash,
      ipHash,
      windowStartedAt,
    });

  void removeExpiredAttempts();

  const phoneLimitExceeded =
    result.phoneAttempts >
    PHONE_ATTEMPT_LIMIT;

  const ipLimitExceeded =
    result.ipAttempts >
    IP_ATTEMPT_LIMIT;

  if (
    !phoneLimitExceeded &&
    !ipLimitExceeded
  ) {
    return {
      allowed: true,
      retryAfterSeconds: 0,
    };
  }

  const phoneRetryAfter =
    phoneLimitExceeded
      ? calculateRetryAfterSeconds(
          result.oldestPhoneAttempt,
          now,
        )
      : 0;

  const ipRetryAfter =
    ipLimitExceeded
      ? calculateRetryAfterSeconds(
          result.oldestIpAttempt,
          now,
        )
      : 0;

  return {
    allowed: false,

    retryAfterSeconds:
      Math.max(
        phoneRetryAfter,
        ipRetryAfter,
        1,
      ),
  };
}