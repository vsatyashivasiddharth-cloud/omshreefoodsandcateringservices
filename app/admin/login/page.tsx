"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [showPassword, setShowPassword] =
    useState(false);

  async function handleLogin(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error);
        return;
      }

      router.push("/admin/dashboard");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#FFFDF8] via-white to-[#FFF6E9]">

      <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6 py-12">

        <div className="grid w-full overflow-hidden rounded-[36px] bg-white shadow-2xl lg:grid-cols-2">

          {/* Left Side */}

          <div className="hidden bg-gradient-to-br from-[#6D2E00] via-[#8B4513] to-[#C89B3C] p-12 text-white lg:flex lg:flex-col lg:justify-between">

            <div>

              <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20">

                <ShieldCheck size={34} />

              </div>

              <h1 className="text-4xl font-bold leading-tight">
                Om Shree Foods
                <br />
                Admin Panel
              </h1>

              <p className="mt-6 text-lg text-white/90">
                Manage products, categories, customer
                orders and your entire store from one
                secure dashboard.
              </p>

            </div>

            <div className="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur">

              <h3 className="font-semibold">
                Secure Administration
              </h3>

              <p className="mt-2 text-sm text-white/80">
                Only authorized administrators can
                access this dashboard.
              </p>

            </div>

          </div>

          {/* Right Side */}

          <div className="flex items-center justify-center p-8 md:p-12">

            <div className="w-full max-w-md">

              <span className="inline-flex rounded-full bg-[#FFF4DE] px-4 py-2 text-sm font-semibold text-[#A66A00]">
                Admin Login
              </span>

              <h2 className="mt-5 text-4xl font-bold text-[#6D2E00]">
                Welcome Back
              </h2>

              <p className="mt-2 text-gray-600">
                Sign in to access the admin dashboard.
              </p>

              <form
                onSubmit={handleLogin}
                className="mt-10 space-y-6"
              >

                {/* Email */}

                <div>

                  <label className="mb-2 block font-medium text-gray-700">
                    Email Address
                  </label>

                  <div className="flex items-center rounded-xl border border-[#E7C98C] bg-white px-4">

                    <Mail
                      size={20}
                      className="text-[#C89B3C]"
                    />

                    <input
                      type="email"
                      placeholder="Enter your email"
                      className="w-full bg-transparent px-3 py-4 outline-none"
                      value={email}
                      onChange={(e) =>
                        setEmail(e.target.value)
                      }
                      required
                    />

                  </div>

                </div>

                {/* Password */}

                <div>

                  <label className="mb-2 block font-medium text-gray-700">
                    Password
                  </label>

                  <div className="flex items-center rounded-xl border border-[#E7C98C] bg-white px-4">

                    <Lock
                      size={20}
                      className="text-[#C89B3C]"
                    />

                    <input
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      placeholder="Enter your password"
                      className="w-full bg-transparent px-3 py-4 outline-none"
                      value={password}
                      onChange={(e) =>
                        setPassword(
                          e.target.value
                        )
                      }
                      required
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          !showPassword
                        )
                      }
                      className="text-gray-500 transition hover:text-[#6D2E00]"
                    >
                      {showPassword ? (
                        <EyeOff size={20} />
                      ) : (
                        <Eye size={20} />
                      )}
                    </button>

                  </div>

                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-[#6D2E00] py-4 font-semibold text-white transition hover:bg-[#8B4513] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading
                    ? "Signing In..."
                    : "Login to Dashboard"}
                </button>

              </form>

            </div>

          </div>

        </div>

      </div>

    </main>
  );
}