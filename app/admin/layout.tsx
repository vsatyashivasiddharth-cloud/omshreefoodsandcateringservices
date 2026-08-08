"use client";

import type {
  ReactNode,
} from "react";
import {
  useState,
} from "react";
import Link from "next/link";
import {
  usePathname,
  useRouter,
} from "next/navigation";
import {
  FolderTree,
  LayoutDashboard,
  LogOut,
  PackageSearch,
  ShoppingBag,
} from "lucide-react";

interface AdminLayoutProps {
  children: ReactNode;
}

interface NavigationItem {
  label: string;
  href: string;
  icon: ReactNode;
}

export default function AdminLayout({
  children,
}: AdminLayoutProps) {
  const pathname =
    usePathname();

  const router =
    useRouter();

  const [
    loggingOut,
    setLoggingOut,
  ] = useState(false);

  /*
   * The login page is inside /admin,
   * so this layout also wraps it.
   *
   * Do not render the admin sidebar
   * around the login screen.
   */
  if (
    pathname === "/admin/login"
  ) {
    return <>{children}</>;
  }

  const navigationItems: NavigationItem[] =
    [
      {
        label: "Dashboard",
        href: "/admin/dashboard",
        icon: (
          <LayoutDashboard
            size={19}
            aria-hidden="true"
          />
        ),
      },
      {
        label: "Orders",
        href: "/admin/orders",
        icon: (
          <PackageSearch
            size={19}
            aria-hidden="true"
          />
        ),
      },
      {
        label: "Products",
        href: "/admin/products",
        icon: (
          <ShoppingBag
            size={19}
            aria-hidden="true"
          />
        ),
      },
      {
        label: "Categories",
        href: "/admin/categories",
        icon: (
          <FolderTree
            size={19}
            aria-hidden="true"
          />
        ),
      },
    ];

  function isActive(
    href: string,
  ) {
    return (
      pathname === href ||
      pathname.startsWith(
        `${href}/`,
      )
    );
  }

  async function handleLogout() {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);

    try {
      const response =
        await fetch(
          "/api/admin/logout",
          {
            method: "POST",
            credentials:
              "same-origin",
          },
        );

      if (!response.ok) {
        throw new Error(
          "Unable to log out.",
        );
      }

      router.replace(
        "/admin/login",
      );

      router.refresh();
    } catch (error) {
      console.error(
        "Admin logout error:",
        error,
      );

      /*
       * Even if the request unexpectedly
       * fails, keep the administrator on
       * the current page instead of
       * pretending logout succeeded.
       */
      window.alert(
        "Unable to log out. Please try again.",
      );
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col bg-black text-white">
        <div className="border-b border-gray-800 px-6 py-7">
          <Link
            href="/admin/dashboard"
            className="inline-flex rounded-lg focus:outline-none focus:ring-4 focus:ring-[#C89B3C]/30"
          >
            <span className="text-2xl font-bold leading-tight text-yellow-400">
              Om Shree
              <br />
              Admin
            </span>
          </Link>
        </div>

        <nav
          className="mt-5 flex flex-1 flex-col gap-1 px-3"
          aria-label="Admin navigation"
        >
          {navigationItems.map(
            (item) => {
              const active =
                isActive(
                  item.href,
                );

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={
                    active
                      ? "page"
                      : undefined
                  }
                  className={`flex min-h-12 items-center gap-3 rounded-xl px-4 py-3 font-medium transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-yellow-400/20 ${
                    active
                      ? "bg-[#C89B3C] text-black shadow-lg"
                      : "text-white hover:bg-gray-800"
                  }`}
                >
                  <span
                    className={
                      active
                        ? "text-black"
                        : "text-yellow-400"
                    }
                  >
                    {item.icon}
                  </span>

                  {item.label}
                </Link>
              );
            },
          )}

          <div className="mt-auto border-t border-gray-800 pb-6 pt-5">
            <button
              type="button"
              disabled={loggingOut}
              onClick={
                handleLogout
              }
              className="flex min-h-12 w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-medium text-red-400 transition-colors hover:bg-red-950/40 hover:text-red-300 focus:outline-none focus:ring-4 focus:ring-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <LogOut
                size={19}
                aria-hidden="true"
              />

              {loggingOut
                ? "Logging out..."
                : "Logout"}
            </button>
          </div>
        </nav>
      </aside>

      {/* Content */}
      <main className="min-w-0 flex-1">
        {children}
      </main>
    </div>
  );
}