import Link from "next/link";
import { ReactNode } from "react";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({
  children,
}: AdminLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-black text-white">
        <div className="border-b border-gray-700 p-6">
          <h1 className="text-2xl font-bold text-yellow-500">
            Om Shree Admin
          </h1>
        </div>

        <nav className="mt-6 flex flex-col">
          <Link
            href="/admin/dashboard"
            className="px-6 py-3 hover:bg-gray-800"
          >
            Dashboard
          </Link>

          <Link
            href="/admin/products"
            className="px-6 py-3 hover:bg-gray-800"
          >
            Products
          </Link>

          <Link
            href="/admin/categories"
            className="px-6 py-3 hover:bg-gray-800"
          >
            Categories
          </Link>

          <button className="mt-6 px-6 py-3 text-left text-red-400 hover:bg-gray-800">
            Logout
          </button>
        </nav>
      </aside>

      {/* Content */}
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}