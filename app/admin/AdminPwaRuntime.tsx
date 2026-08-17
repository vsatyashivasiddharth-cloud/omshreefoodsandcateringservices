"use client";

import {
  useEffect,
  useState,
} from "react";

async function ensureAdminWorkerRegistration() {
  const registration =
    await navigator.serviceWorker.register(
      "/admin-worker.js",
      {
        scope:
          "/admin/",

        updateViaCache:
          "none",
      },
    );

  await registration.update();

  return registration;
}

export default function AdminPwaRuntime() {
  const [
    offline,
    setOffline,
  ] = useState(false);

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
            await ensureAdminWorkerRegistration();
          } catch (error) {
            console.error(
              "Admin PWA initialization failed:",
              error,
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

  if (!offline) {
    return null;
  }

  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-amber-300 bg-amber-50 px-4 py-2 text-center text-sm font-semibold text-amber-900 shadow-lg"
    >
      You&apos;re offline. Admin data will
      update when your connection returns.
    </div>
  );
}
