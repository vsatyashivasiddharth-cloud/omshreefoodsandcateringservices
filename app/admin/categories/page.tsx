"use client";

import { useEffect, useMemo, useState } from "react";
import AddCategoryModal from "@/components/admin/AddCategoryModal";
import EditCategoryModal from "@/components/admin/EditCategoryModal";
import Image from "next/image";
import { toast } from "sonner";
import {
  FolderTree,
  ImageIcon,
  Shapes,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  image: string | null;
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-[#F3DFC2] bg-white p-6 shadow-sm">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-sm uppercase tracking-wider text-gray-500">
            {title}
          </p>

          <h2 className="mt-3 text-3xl font-bold text-[#6D2E00]">
            {value}
          </h2>

        </div>

        <div className="rounded-2xl bg-[#FFF4DE] p-4 text-[#C89B3C]">
          {icon}
        </div>

      </div>

    </div>
  );
}

export default function CategoriesPage() {
  const [categories, setCategories] =
    useState<Category[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [editingCategoryId, setEditingCategoryId] =
    useState("");

  const [editOpen, setEditOpen] =
    useState(false);

  async function loadCategories() {
    try {
      setLoading(true);

      const res = await fetch("/api/categories");
      const data = await res.json();

      if (Array.isArray(data)) {
        setCategories(data);
      } else {
        setCategories([]);
      }
    } catch (err) {
      console.error(err);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }

  async function deleteCategory(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this category?"
    );

    if (!confirmed) return;

    try {
      const res = await fetch(
        `/api/categories/${id}`,
        {
          method: "DELETE",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error);
        return;
      }

      toast.success("Category deleted successfully.");

      loadCategories();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete category.");
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  const stats = useMemo(
    () => ({
      total: categories.length,
      withImages: categories.filter(
        (c) => !!c.image
      ).length,
      withoutImages: categories.filter(
        (c) => !c.image
      ).length,
    }),
    [categories]
  );
  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-[#FFFDF8] via-white to-[#FFF6E9]">

        <div className="mx-auto max-w-7xl px-6 py-10">

          {/* Header */}

          <div className="mb-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

            <div>

              <span className="inline-flex rounded-full bg-[#FFF4DE] px-4 py-2 text-sm font-semibold text-[#A66A00]">
                Categories Management
              </span>

              <h1 className="mt-4 text-4xl font-bold text-[#6D2E00]">
                Categories
              </h1>

              <p className="mt-2 max-w-2xl text-gray-600">
                Organize your products by creating and managing categories.
              </p>

            </div>

            <AddCategoryModal
              onSuccess={loadCategories}
            />

          </div>

          {/* Stats */}

          <div className="mb-10 grid gap-6 md:grid-cols-3">

            <StatCard
              title="Total Categories"
              value={stats.total}
              icon={<FolderTree size={24} />}
            />

            <StatCard
              title="With Images"
              value={stats.withImages}
              icon={<ImageIcon size={24} />}
            />

            <StatCard
              title="Without Images"
              value={stats.withoutImages}
              icon={<Shapes size={24} />}
            />

          </div>

          {/* Table */}

          <div className="overflow-hidden rounded-3xl border border-[#F3DFC2] bg-white shadow-sm">

            {loading ? (

              <div className="p-16 text-center">

                <div className="text-lg font-semibold text-[#6D2E00]">
                  Loading categories...
                </div>

              </div>

            ) : categories.length === 0 ? (

              <div className="p-16 text-center">

                <FolderTree
                  size={52}
                  className="mx-auto mb-4 text-[#C89B3C]"
                />

                <h2 className="text-2xl font-bold text-[#6D2E00]">
                  No Categories Found
                </h2>

                <p className="mt-2 text-gray-500">
                  Create your first category to organize your products.
                </p>

              </div>

            ) : (

              <div className="overflow-x-auto">

                <table className="min-w-full">

                  <thead className="bg-[#FFF8EE]">

                    <tr>

                      <th className="px-6 py-5 text-left text-sm font-semibold uppercase tracking-wider text-gray-500">
                        Category
                      </th>

                      <th className="px-6 py-5 text-left text-sm font-semibold uppercase tracking-wider text-gray-500">
                        Slug
                      </th>

                      <th className="px-6 py-5 text-center text-sm font-semibold uppercase tracking-wider text-gray-500">
                        Actions
                      </th>

                    </tr>

                  </thead>

                  <tbody>
                  {categories.map((category) => (

                    <tr
                      key={category.id}
                      className="border-t border-[#F3DFC2] transition hover:bg-[#FFFDF8]"
                    >

                      {/* Category */}

                      <td className="px-6 py-5">

                        <div className="flex items-center gap-4">

                          {category.image ? (

                            <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-[#F3DFC2]">

                              <Image
                                src={category.image}
                                alt={category.name}
                                fill
                                className="object-cover"
                              />

                            </div>

                          ) : (

                            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-dashed border-[#E7C98C] bg-[#FFF8EE]">

                              <ImageIcon
                                size={28}
                                className="text-[#C89B3C]"
                              />

                            </div>

                          )}

                          <div>

                            <h3 className="font-bold text-lg text-[#6D2E00]">
                              {category.name}
                            </h3>

                            <p className="mt-1 text-sm text-gray-500">
                              Category ID: #{category.id.slice(0, 8)}
                            </p>

                          </div>

                        </div>

                      </td>

                      {/* Slug */}

                      <td className="px-6 py-5">

                        <span className="inline-flex rounded-full bg-[#FFF4DE] px-4 py-2 text-sm font-medium text-[#A66A00]">
                          {category.slug}
                        </span>

                      </td>

                      {/* Actions */}

                      <td className="px-6 py-5">

                        <div className="flex justify-center gap-3">

                          <button
                            onClick={() => {
                              setEditingCategoryId(category.id);
                              setEditOpen(true);
                            }}
                            className="rounded-xl bg-[#6D2E00] px-5 py-2 font-semibold text-white transition hover:bg-[#8B4513]"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() =>
                              deleteCategory(category.id)
                            }
                            className="rounded-xl bg-red-600 px-5 py-2 font-semibold text-white transition hover:bg-red-700"
                          >
                            Delete
                          </button>

                        </div>

                      </td>

                    </tr>

                  ))}

                  </tbody>

                </table>

              </div>

            )}

          </div>

        </div>

      </div>

      <EditCategoryModal
        categoryId={editingCategoryId}
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          setEditingCategoryId("");
        }}
        onSuccess={loadCategories}
      />

    </>
  );
}