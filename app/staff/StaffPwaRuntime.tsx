"use client";

import {
  useEffect,
  useState,
} from "react";

type NotificationState =
  | "checking"
  | "ready"
  | "enabling"
  | "enabled"
  | "denied"
  | "unsupported"
  | "missing-key"
  | "error";

interface ApiError {
  error?: unknown;
}

const vapidPublicKey =
  process.env
    .NEXT_PUBLIC_STAFF_PUSH_VAPID_PUBLIC_KEY
    ?.trim() ?? "";

function urlBase64ToUint8Array(
  value: string,
) {
  const padding =
    "=".repeat(
      (4 - (value.length % 4)) % 4,
    );

  const base64 =
    (value + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

  const rawData =
    window.atob(base64);

  const outputArray =
    new Uint8Array(
      rawData.length,
    );

  for (
    let index = 0;
    index < rawData.length;
    index += 1
  ) {
    outputArray[index] =
      rawData.charCodeAt(
        index,
      );
  }

  return outputArray;
}

async function ensureStaffWorkerRegistration() {
  const registration =
    await navigator.serviceWorker.register(
      "/staff-worker.js",
      {
        scope:
          "/staff/",

        updateViaCache:
          "none",
      },
    );

  await registration.update();

  return registration;
}

async function savePushSubscription(
  subscription: PushSubscription,
) {
  const serialized =
    subscription.toJSON();

  const p256dh =
    serialized.keys?.p256dh;

  const auth =
    serialized.keys?.auth;

  if (
    !p256dh ||
    !auth
  ) {
    throw new Error(
      "The browser did not provide the required push subscription keys.",
    );
  }

  const response =
    await fetch(
      "/api/staff/push-subscriptions",
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        credentials:
          "same-origin",

        cache:
          "no-store",

        body:
          JSON.stringify({
            endpoint:
              subscription.endpoint,

            keys: {
              p256dh,
              auth,
            },
          }),
      },
    );

  const data: unknown =
    await response
      .json()
      .catch(
        () => null,
      );

  if (!response.ok) {
    const apiError =
      data &&
      typeof data ===
        "object" &&
      !Array.isArray(
        data,
      )
        ? data as ApiError
        : null;

    throw new Error(
      typeof apiError?.error ===
        "string"
        ? apiError.error
        : "Unable to save the push subscription.",
    );
  }
}

function browserSupportsPush() {
  return (
    "serviceWorker" in
      navigator &&
    "PushManager" in
      window &&
    "Notification" in
      window
  );
}

export default function StaffPwaRuntime() {
  const [
    offline,
    setOffline,
  ] =
    useState(false);

  const [
    notificationState,
    setNotificationState,
  ] =
    useState<NotificationState>(
      "checking",
    );

  const [
    notificationError,
    setNotificationError,
  ] =
    useState<string | null>(
      null,
    );

  useEffect(() => {
    const updateNetworkState = () => {
      setOffline(
        !navigator.onLine,
      );
    };

    updateNetworkState();

    window.addEventListener(
      "online",
      updateNetworkState,
    );

    window.addEventListener(
      "offline",
      updateNetworkState,
    );

    if (
      process.env.NODE_ENV ===
        "production" &&
      "serviceWorker" in navigator
    ) {
      const initializeRuntime =
        async () => {
          try {
            const registration =
              await ensureStaffWorkerRegistration();

            if (
              !browserSupportsPush()
            ) {
              setNotificationState(
                "unsupported",
              );

              return;
            }

            if (!vapidPublicKey) {
              console.error(
                "Staff push VAPID public key is not configured.",
              );

              setNotificationState(
                "missing-key",
              );

              return;
            }

            if (
              Notification.permission ===
              "denied"
            ) {
              setNotificationState(
                "denied",
              );

              return;
            }

            if (
              Notification.permission !==
              "granted"
            ) {
              setNotificationState(
                "ready",
              );

              return;
            }

            const existingSubscription =
              await registration
                .pushManager
                .getSubscription();

            if (
              !existingSubscription
            ) {
              setNotificationState(
                "ready",
              );

              return;
            }

            await savePushSubscription(
              existingSubscription,
            );

            setNotificationState(
              "enabled",
            );
          } catch (error) {
            console.error(
              "Staff PWA initialization failed:",
              error,
            );

            setNotificationError(
              error instanceof Error
                ? error.message
                : "Unable to initialize staff notifications.",
            );

            setNotificationState(
              "error",
            );
          }
        };

      void initializeRuntime();
    }

    return () => {
      window.removeEventListener(
        "online",
        updateNetworkState,
      );

      window.removeEventListener(
        "offline",
        updateNetworkState,
      );
    };
  }, []);

  async function enableNotifications() {
    if (
      notificationState ===
      "enabling"
    ) {
      return;
    }

    setNotificationError(null);
    setNotificationState(
      "enabling",
    );

    try {
      if (
        !browserSupportsPush()
      ) {
        setNotificationState(
          "unsupported",
        );

        return;
      }

      if (!vapidPublicKey) {
        throw new Error(
          "Staff push notifications are not configured.",
        );
      }

      const permission =
        Notification.permission ===
        "granted"
          ? "granted"
          : await Notification
              .requestPermission();

      if (
        permission !==
        "granted"
      ) {
        setNotificationState(
          "denied",
        );

        return;
      }

      const registration =
        await ensureStaffWorkerRegistration();

      let subscription =
        await registration
          .pushManager
          .getSubscription();

      if (!subscription) {
        subscription =
          await registration
            .pushManager
            .subscribe({
              userVisibleOnly:
                true,

              applicationServerKey:
                urlBase64ToUint8Array(
                  vapidPublicKey,
                ),
            });
      }

      await savePushSubscription(
        subscription,
      );

      setNotificationState(
        "enabled",
      );
    } catch (error) {
      console.error(
        "Staff notification setup failed:",
        error,
      );

      setNotificationError(
        error instanceof Error
          ? error.message
          : "Unable to enable notifications.",
      );

      setNotificationState(
        "error",
      );
    }
  }

  if (offline) {
    return (
      <div
        role="status"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-amber-300 bg-amber-50 px-4 py-2 text-center text-sm font-semibold text-amber-900 shadow-lg"
      >
        You&apos;re offline. Staff
        orders will update when your
        connection returns.
      </div>
    );
  }

  if (
    notificationState ===
      "checking" ||
    notificationState ===
      "enabled" ||
    notificationState ===
      "unsupported" ||
    notificationState ===
      "missing-key"
  ) {
    return null;
  }

  return (
    <div className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-50 mx-auto max-w-md rounded-2xl border border-[#D8B775] bg-white p-4 shadow-xl">
      {notificationState ===
      "denied" ? (
        <>
          <p className="font-semibold text-[#6D2E00]">
            Notifications are blocked
          </p>

          <p className="mt-1 text-sm leading-5 text-gray-600">
            Allow notifications for
            this Staff app in your
            browser or phone settings.
          </p>
        </>
      ) : (
        <>
          <p className="font-semibold text-[#6D2E00]">
            Staff order notifications
          </p>

          <p className="mt-1 text-sm leading-5 text-gray-600">
            Enable notifications so
            this device can alert you
            when a new paid order is
            ready.
          </p>

          {notificationError && (
            <p
              role="alert"
              className="mt-2 text-sm font-medium text-red-700"
            >
              {notificationError}
            </p>
          )}

          <button
            type="button"
            disabled={
              notificationState ===
              "enabling"
            }
            onClick={() =>
              void enableNotifications()
            }
            className="mt-3 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#6D2E00] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#8B4513] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {notificationState ===
            "enabling"
              ? "Enabling..."
              : "Enable Notifications"}
          </button>
        </>
      )}
    </div>
  );
}
