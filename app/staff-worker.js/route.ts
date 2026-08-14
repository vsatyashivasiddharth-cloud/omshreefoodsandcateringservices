import {
  NextResponse,
} from "next/server";

const workerSource = `
const STAFF_SCOPE = "/staff/";

self.addEventListener(
  "install",
  () => {
    self.skipWaiting();
  },
);

self.addEventListener(
  "activate",
  (event) => {
    event.waitUntil(
      self.clients.claim(),
    );
  },
);

self.addEventListener(
  "fetch",
  (event) => {
    const request =
      event.request;

    if (
      request.mode !==
        "navigate" ||
      request.method !==
        "GET"
    ) {
      return;
    }

    const url =
      new URL(
        request.url,
      );

    if (
      url.origin !==
        self.location.origin ||
      !url.pathname.startsWith(
        STAFF_SCOPE,
      )
    ) {
      return;
    }

    event.respondWith(
      fetch(request).catch(
        () =>
          new Response(
            \`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width,initial-scale=1"
    />
    <meta
      name="theme-color"
      content="#7C3300"
    />
    <title>
      Staff App Offline
    </title>
    <style>
      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 24px;
        background: #fff9ef;
        color: #6d2e00;
        font-family:
          system-ui,
          -apple-system,
          BlinkMacSystemFont,
          "Segoe UI",
          sans-serif;
      }

      main {
        width: min(
          100%,
          420px
        );
        padding: 24px;
        border: 1px solid #ecd7b5;
        border-radius: 20px;
        background: white;
        text-align: center;
        box-shadow:
          0 8px 30px
          rgba(
            109,
            46,
            0,
            0.08
          );
      }

      h1 {
        margin:
          0 0 8px;
        font-size: 24px;
      }

      p {
        margin:
          0 0 20px;
        color: #5f5f5f;
        line-height: 1.5;
      }

      button {
        min-height: 48px;
        width: 100%;
        border: 0;
        border-radius: 12px;
        padding:
          12px 16px;
        background: #6d2e00;
        color: white;
        font: inherit;
        font-weight: 700;
        cursor: pointer;
      }
    </style>
  </head>

  <body>
    <main>
      <h1>
        You&apos;re offline
      </h1>

      <p>
        Connect to the internet,
        then try Staff Orders again.
        No order data has been cached
        on this device.
      </p>

      <button
        type="button"
        onclick="location.reload()"
      >
        Try Again
      </button>
    </main>
  </body>
</html>\`,
            {
              status:
                503,

              headers: {
                "Content-Type":
                  "text/html; charset=utf-8",

                "Cache-Control":
                  "no-store",
              },
            },
          ),
      ),
    );
  },
);
`;

export async function GET() {
  return new NextResponse(
    workerSource,
    {
      headers: {
        "Content-Type":
          "application/javascript; charset=utf-8",

        "Cache-Control":
          "no-cache, no-store, must-revalidate",

        "Service-Worker-Allowed":
          "/staff/",

        "Content-Security-Policy":
          "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'unsafe-inline'",
      },
    },
  );
}
