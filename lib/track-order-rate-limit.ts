import { createHash } from "node:crypto";

interface RateLimitEntry {
  attempts: number[];
  blockedUntil: number | null;
}

interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

const WINDOW_MS = 10 * 60 * 1000;
const BLOCK_DURATION_MS = 15 * 60 * 1000;

const PHONE_ATTEMPT_LIMIT = 5;
const IP_ATTEMPT_LIMIT = 25;

const CLEANUP_INTERVAL_MS = 30 * 60 * 1000;

declare global {
  // eslint-disable-next-line no-var
  var trackOrderRateLimitStore:
    | Map<string, RateLimitEntry>
    | undefined;

  // eslint-disable-next-line no-var
  var trackOrderRateLimitLastCleanup:
    | number
    | undefined;
}

const rateLimitStore =
  globalThis.trackOrderRateLimitStore ??
  new Map<string, RateLimitEntry>();

globalThis.trackOrderRateLimitStore =
  rateLimitStore;

function hashIdentifier(
  type: "phone" | "ip",
  value: string,
) {
  return createHash("sha256")
    .update(`${type}:${value}`)
    .digest("hex");
}

function cleanExpiredEntries(
  now: number,
) {
  const lastCleanup =
    globalThis.trackOrderRateLimitLastCleanup ??
    0;

  if (
    now - lastCleanup <
    CLEANUP_INTERVAL_MS
  ) {
    return;
  }

  for (const [key, entry] of rateLimitStore) {
    const activeAttempts =
      entry.attempts.filter(
        (timestamp) =>
          now - timestamp < WINDOW_MS,
      );

    const stillBlocked =
      entry.blockedUntil !== null &&
      entry.blockedUntil > now;

    if (
      activeAttempts.length === 0 &&
      !stillBlocked
    ) {
      rateLimitStore.delete(key);
      continue;
    }

    rateLimitStore.set(key, {
      attempts: activeAttempts,
      blockedUntil: stillBlocked
        ? entry.blockedUntil
        : null,
    });
  }

  globalThis.trackOrderRateLimitLastCleanup =
    now;
}

function checkIdentifier(
  key: string,
  limit: number,
  now: number,
): RateLimitResult {
  const existing =
    rateLimitStore.get(key) ?? {
      attempts: [],
      blockedUntil: null,
    };

  if (
    existing.blockedUntil !== null &&
    existing.blockedUntil > now
  ) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil(
          (existing.blockedUntil - now) /
            1000,
        ),
      ),
    };
  }

  const activeAttempts =
    existing.attempts.filter(
      (timestamp) =>
        now - timestamp < WINDOW_MS,
    );

  if (
    activeAttempts.length >= limit
  ) {
    const blockedUntil =
      now + BLOCK_DURATION_MS;

    rateLimitStore.set(key, {
      attempts: activeAttempts,
      blockedUntil,
    });

    return {
      allowed: false,
      retryAfterSeconds: Math.ceil(
        BLOCK_DURATION_MS / 1000,
      ),
    };
  }

  activeAttempts.push(now);

  rateLimitStore.set(key, {
    attempts: activeAttempts,
    blockedUntil: null,
  });

  return {
    allowed: true,
    retryAfterSeconds: 0,
  };
}

export function checkTrackOrderRateLimit({
  phone,
  ipAddress,
}: {
  phone: string;
  ipAddress: string;
}): RateLimitResult {
  const now = Date.now();

  cleanExpiredEntries(now);

  const phoneKey = hashIdentifier(
    "phone",
    phone,
  );

  const ipKey = hashIdentifier(
    "ip",
    ipAddress,
  );

  const phoneResult =
    checkIdentifier(
      phoneKey,
      PHONE_ATTEMPT_LIMIT,
      now,
    );

  if (!phoneResult.allowed) {
    return phoneResult;
  }

  const ipResult = checkIdentifier(
    ipKey,
    IP_ATTEMPT_LIMIT,
    now,
  );

  if (!ipResult.allowed) {
    return ipResult;
  }

  return {
    allowed: true,
    retryAfterSeconds: 0,
  };
}