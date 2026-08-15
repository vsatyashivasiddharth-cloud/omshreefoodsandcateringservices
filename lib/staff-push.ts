import webPush from "web-push";

import prisma from "@/lib/prisma";

const VAPID_SUBJECT =
  "https://www.omshreefoodsandcaterers.com";

interface PushErrorLike {
  statusCode?: unknown;
}

function getStatusCode(
  error: unknown,
) {
  if (
    !error ||
    typeof error !==
      "object"
  ) {
    return null;
  }

  const statusCode =
    (error as PushErrorLike)
      .statusCode;

  return typeof statusCode ===
    "number"
    ? statusCode
    : null;
}

function configureVapid() {
  const publicKey =
    process.env
      .NEXT_PUBLIC_STAFF_PUSH_VAPID_PUBLIC_KEY
      ?.trim() ??
    "";

  const privateKey =
    process.env
      .STAFF_PUSH_VAPID_PRIVATE_KEY
      ?.trim() ??
    "";

  if (
    !publicKey ||
    !privateKey
  ) {
    throw new Error(
      "STAFF_PUSH_VAPID_NOT_CONFIGURED",
    );
  }

  webPush.setVapidDetails(
    VAPID_SUBJECT,
    publicKey,
    privateKey,
  );
}

export async function sendStaffNewOrderPush() {
  configureVapid();

  const subscriptions =
    await prisma
      .pushSubscription
      .findMany({
        select: {
          id: true,
          endpoint: true,
          p256dh: true,
          auth: true,
        },

        orderBy: {
          createdAt:
            "asc",
        },
      });

  for (
    const subscription of
      subscriptions
  ) {
    try {
      await webPush.sendNotification(
        {
          endpoint:
            subscription.endpoint,

          keys: {
            p256dh:
              subscription.p256dh,

            auth:
              subscription.auth,
          },
        },
      );
    } catch (error) {
      const statusCode =
        getStatusCode(error);

      if (
        statusCode ===
          404 ||
        statusCode ===
          410
      ) {
        try {
          await prisma
            .pushSubscription
            .deleteMany({
              where: {
                id:
                  subscription.id,
              },
            });
        } catch (
          cleanupError
        ) {
          console.error(
            "Unable to remove stale staff push subscription:",
            {
              subscriptionId:
                subscription.id,

              cleanupError,
            },
          );
        }

        continue;
      }

      console.error(
        "Staff push delivery failed:",
        {
          subscriptionId:
            subscription.id,

          statusCode,

          error,
        },
      );
    }
  }
}
