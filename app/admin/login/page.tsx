"use client";

import type {
  FormEvent,
} from "react";
import {
  useState,
} from "react";
import {
  useRouter,
} from "next/navigation";
import {
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
} from "lucide-react";

interface LoginResponse {
  success?: boolean;
  message?: string;
  error?: string;
}

function getSafeDestination() {
  if (
    typeof window === "undefined"
  ) {
    return "/admin/dashboard";
  }

  const searchParams =
    new URLSearchParams(
      window.location.search,
    );

  const next =
    searchParams.get("next");

  if (
    !next ||
    next.startsWith("//") ||
    next.startsWith(
      "/admin/login",
    )
  ) {
    return "/admin/dashboard";
  }

  if (
    next.startsWith("/admin/") ||
    next.startsWith("/staff/")
  ) {
    return next;
  }

  return "/admin/dashboard";
}

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] =
    useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  );

  async function handleLogin(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (loading) {
      return;
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    if (
      !normalizedEmail ||
      !password
    ) {
      setError(
        "Enter your email and password.",
      );

      return;
    }

    setLoading(true);
    setError(null);

    try {
      /*
       * Determine the authenticated area
       * before creating the session.
       *
       * Staff receives its persistent
       * device session while Admin keeps
       * its existing short-lived session.
       */
      const destination =
        getSafeDestination();

      const sessionType =
        destination.startsWith(
          "/staff/",
        )
          ? "STAFF_DEVICE"
          : "ADMIN";

      const response =
        await fetch(
          "/api/admin/login",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              email:
                normalizedEmail,
              password,
              sessionType,
            }),

            credentials:
              "same-origin",
          },
        );

      const data: LoginResponse =
        await response
          .json()
          .catch(() => ({
            error:
              "Unable to read the server response.",
          }));

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to sign in.",
        );
      }

      /*
       * The server has now created either:
       *
       * - the normal Admin session, or
       * - the persistent Staff device session.
       *
       * Continue to the exact protected route
       * originally requested.
       */
      router.replace(destination);
      router.refresh();
    } catch (loginError) {
      console.error(
        "Admin login error:",
        loginError,
      );

      setError(
        loginError instanceof Error
          ? loginError.message
          : "Unable to sign in.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#FFFDF8] via-[#FFF8EE] to-[#FFF4DE]">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6 py-12">
        <div className="grid w-full overflow-hidden rounded-[36px] bg-white shadow-2xl lg:grid-cols-2">
          {/* Left side */}
          <div className="hidden bg-gradient-to-br from-[#6D2E00] via-[#8B4513] to-[#C89B3C] p-12 text-white lg:flex lg:flex-col lg:justify-between">
            <div>
              <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20">
                <ShieldCheck
                  size={34}
                  aria-hidden="true"
                />
              </div>

              <h1 className="text-4xl font-bold leading-tight">
                Om Shree Foods
                <br />
                Admin Panel
              </h1>

              <p className="mt-6 text-lg leading-8 text-white/90">
                Manage products,
                categories, customer
                orders and your entire
                store from one secure
                dashboard.
              </p>
            </div>

            <div className="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur">
              <h3 className="font-semibold">
                Secure Administration
              </h3>

              <p className="mt-2 text-sm leading-6 text-white/80">
                Only authorized
                administrators can
                access this dashboard.
              </p>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center justify-center p-8 md:p-12">
            <div className="w-full max-w-md">
              <span className="inline-flex rounded-full bg-[#FFF4DE] px-4 py-2 text-sm font-semibold text-[#A66A00]">
                Admin Login
              </span>

              <h2 className="mt-5 text-4xl font-bold text-[#6D2E00]">
                Welcome Back
              </h2>

              <p className="mt-2 leading-7 text-gray-600">
                Sign in to access
                the requested admin
                page.
              </p>

              {error && (
                <div
                  role="alert"
                  className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-red-700"
                >
                  <AlertCircle
                    size={20}
                    className="mt-0.5 shrink-0"
                    aria-hidden="true"
                  />

                  <p className="text-sm leading-6">
                    {error}
                  </p>
                </div>
              )}

              <form
                onSubmit={
                  handleLogin
                }
                className="mt-8 space-y-6"
              >
                {/* Email */}
                <div>
                  <label
                    htmlFor="admin-email"
                    className="mb-2 block font-medium text-gray-700"
                  >
                    Email Address
                  </label>

                  <div className="flex items-center rounded-xl border border-[#E7C98C] bg-white px-4 transition focus-within:border-[#C89B3C] focus-within:ring-4 focus-within:ring-[#C89B3C]/15">
                    <Mail
                      size={20}
                      className="shrink-0 text-[#C89B3C]"
                      aria-hidden="true"
                    />

                    <input
                      id="admin-email"
                      type="email"
                      autoComplete="email"
                      placeholder="Enter your email"
                      className="w-full bg-transparent px-3 py-4 outline-none"
                      value={email}
                      disabled={loading}
                      onChange={(
                        event,
                      ) =>
                        setEmail(
                          event.target
                            .value,
                        )
                      }
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="admin-password"
                    className="mb-2 block font-medium text-gray-700"
                  >
                    Password
                  </label>

                  <div className="flex items-center rounded-xl border border-[#E7C98C] bg-white px-4 transition focus-within:border-[#C89B3C] focus-within:ring-4 focus-within:ring-[#C89B3C]/15">
                    <Lock
                      size={20}
                      className="shrink-0 text-[#C89B3C]"
                      aria-hidden="true"
                    />

                    <input
                      id="admin-password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      className="w-full bg-transparent px-3 py-4 outline-none"
                      value={password}
                      disabled={loading}
                      onChange={(
                        event,
                      ) =>
                        setPassword(
                          event.target
                            .value,
                        )
                      }
                      required
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (
                            current,
                          ) =>
                            !current,
                        )
                      }
                      disabled={loading}
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-gray-500 transition hover:bg-[#FFF4DE] hover:text-[#6D2E00] focus:outline-none focus:ring-4 focus:ring-[#C89B3C]/15 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {showPassword ? (
                        <EyeOff
                          size={20}
                          aria-hidden="true"
                        />
                      ) : (
                        <Eye
                          size={20}
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex min-h-13 w-full items-center justify-center rounded-xl bg-[#6D2E00] px-6 py-4 font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#8B4513] hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-[#6D2E00]/20 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-50"
                >
                  {loading
                    ? "Signing In..."
                    : "Login to Admin"}
                </button>
              </form>

              <div className="mt-8 flex items-center justify-center gap-2 text-sm text-gray-500">
                <ShieldCheck
                  size={16}
                  className="text-[#C89B3C]"
                  aria-hidden="true"
                />

                Secure administrator
                access
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}