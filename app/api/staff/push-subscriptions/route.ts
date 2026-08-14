import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  requireAdmin,
} from "@/lib/auth";
import prisma from "@/lib/prisma";

interface PushSubscriptionBody {
  endpoint?: unknown;
  keys?: {
    p256dh?: unknown;
    auth?: unknown;
  };
}

function noStoreHeaders() {
  return {
    "Cache-Control":
      "no-store, max-age=0",
  };
}

function json(
  body: unknown,
  status = 200,
) {
  return NextResponse.json(
    body,
    {
      status,
      headers:
        noStoreHeaders(),
    },
  );
}

function getRequiredString(
  value: unknown,
  options: {
    name: string;
    maxLength: number;
  },
) {
  if (
    typeof value !==
    "string"
  ) {
    return {
      ok: false as const,
      error:
        `${options.name} is required.`,
    };
  }

  const normalized =
    value.trim();

  if (!normalized) {
    return {
      ok: false as const,
      error:
        `${options.name} is required.`,
    };
  }

  if (
    normalized.length >
    options.maxLength
  ) {
    return {
      ok: false as const,
      error:
        `${options.name} is too long.`,
    };
  }

  return {
    ok: true as const,
    value:
      normalized,
  };
}

function parseBody(
  body: PushSubscriptionBody,
) {
  const endpoint =
    getRequiredString(
      body.endpoint,
      {
        name:
          "Push endpoint",
        maxLength:
          4096,
      },
    );

  if (!endpoint.ok) {
    return endpoint;
  }

  const p256dh =
    getRequiredString(
      body.keys?.p256dh,
      {
        name:
          "Push encryption key",
        maxLength:
          1024,
      },
    );

  if (!p256dh.ok) {
    return p256dh;
  }

  const auth =
    getRequiredString(
      body.keys?.auth,
      {
        name:
          "Push authentication key",
        maxLength:
          1024,
      },
    );

  if (!auth.ok) {
    return auth;
  }

  return {
    ok: true as const,

    value: {
      endpoint:
        endpoint.value,

      p256dh:
        p256dh.value,

      auth:
        auth.value,
    },
  };
}

export async function POST(
  request: NextRequest,
) {
  const authentication =
    await requireAdmin(
      request,
    );

  if (
    !authentication
      .authenticated
  ) {
    return json(
      {
        error:
          authentication.error,
      },
      authentication.status,
    );
  }

  let body:
    PushSubscriptionBody;

  try {
    body =
      (await request.json()) as
        PushSubscriptionBody;
  } catch {
    return json(
      {
        error:
          "Invalid request body.",
      },
      400,
    );
  }

  const parsed =
    parseBody(body);

  if (!parsed.ok) {
    return json(
      {
        error:
          parsed.error,
      },
      400,
    );
  }

  const userAgent =
    request.headers
      .get("user-agent")
      ?.trim()
      .slice(0, 1024) ??
    null;

  const subscription =
    await prisma
      .pushSubscription
      .upsert({
        where: {
          endpoint:
            parsed.value
              .endpoint,
        },

        update: {
          adminId:
            authentication
              .admin.id,

          p256dh:
            parsed.value
              .p256dh,

          auth:
            parsed.value
              .auth,

          userAgent,
        },

        create: {
          adminId:
            authentication
              .admin.id,

          endpoint:
            parsed.value
              .endpoint,

          p256dh:
            parsed.value
              .p256dh,

          auth:
            parsed.value
              .auth,

          userAgent,
        },

        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
        },
      });

  return json(
    {
      success: true,
      subscription,
    },
  );
}

export async function DELETE(
  request: NextRequest,
) {
  const authentication =
    await requireAdmin(
      request,
    );

  if (
    !authentication
      .authenticated
  ) {
    return json(
      {
        error:
          authentication.error,
      },
      authentication.status,
    );
  }

  let body: {
    endpoint?: unknown;
  };

  try {
    body =
      (await request.json()) as {
        endpoint?: unknown;
      };
  } catch {
    return json(
      {
        error:
          "Invalid request body.",
      },
      400,
    );
  }

  const endpoint =
    getRequiredString(
      body.endpoint,
      {
        name:
          "Push endpoint",
        maxLength:
          4096,
      },
    );

  if (!endpoint.ok) {
    return json(
      {
        error:
          endpoint.error,
      },
      400,
    );
  }

  await prisma
    .pushSubscription
    .deleteMany({
      where: {
        adminId:
          authentication
            .admin.id,

        endpoint:
          endpoint.value,
      },
    });

  return json({
    success: true,
  });
}
