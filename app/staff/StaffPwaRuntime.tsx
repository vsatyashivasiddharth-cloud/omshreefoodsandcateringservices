"use client";

import {
  useEffect,
  useState,
} from "react";

export default function StaffPwaRuntime() {
  const [offline, setOffline] =
    useState(false);

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
      const registerWorker =
        async () => {
          try {
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
          } catch (error) {
            console.error(
              "Staff service worker registration failed:",
              error,
            );
          }
        };

      void registerWorker();
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

  if (!offline) {
    return null;
  }

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
