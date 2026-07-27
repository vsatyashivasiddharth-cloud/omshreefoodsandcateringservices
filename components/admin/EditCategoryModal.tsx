"use client";

import type { FormEvent } from "react";
import { useCallback, useEffect, useState } from "react";
import {
  FolderPen,
  ImageIcon,
  RefreshCw,
  X,
} from "lucide-react";
import { toast } from "sonner";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";

import ImageUploader from "./ImageUploader";

interface Category {
  id: string;
  name: string;
  slug: string;
  image: string | null;
}

interface EditCategoryModalProps {
  categoryId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function createSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function EditCategoryModal({
  categoryId,
  open,
  onClose,
  onSuccess,
}: EditCategoryModalProps) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [image, setImage] = useState("");

  const [loadingCategory, setLoadingCategory] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadCategory = useCallback(async () => {
    if (!categoryId) {
      return;
    }

    try {
      setLoadingCategory(true);
      setError("");

      const response = await fetch(
        `/api/categories/${categoryId}`,
        {
          cache: "no-store",
        },
      );

      const result: Category | { error?: string } =
        await response.json();

      if (!response.ok) {
        throw new Error(
          "error" in result && result.error
            ? result.error
            : "Failed to load category.",
        );
      }

      const category = result as Category;

      setName(category.name);
      setSlug(category.slug);
      setImage(category.image || "");
    } catch (error) {
      console.error("Category loading error:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Failed to load category.";

      setError(message);
      toast.error(message);
    } finally {
      setLoadingCategory(false);
    }
  }, [categoryId]);

  useEffect(() => {
    if (open && categoryId) {
      void loadCategory();
    }
  }, [open, categoryId, loadCategory]);

  function handleNameChange(value: string) {
    setName(value);

    setSlug((currentSlug) =>
      !currentSlug || currentSlug === createSlug(name)
        ? createSlug(value)
        : currentSlug,
    );
  }

  function closeModal() {
    if (saving) {
      return;
    }

    onClose();
  }

  async function handleUpdate(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const normalizedName = name.trim();
    const normalizedSlug = createSlug(slug);

    if (!normalizedName || !normalizedSlug) {
      toast.error("Category name and slug are required.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `/api/categories/${categoryId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: normalizedName,
            slug: normalizedSlug,
            image: image || null,
          }),
        },
      );

      const result: {
        error?: string;
      } = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Failed to update category.",
        );
      }

      toast.success("Category updated successfully.");

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Category update error:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update category.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-category-title"
      className="fixed inset-0 z-[9999] overflow-y-auto bg-black/60 p-4 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          closeModal();
        }
      }}
    >
      <div className="flex min-h-full items-center justify-center">
        <Card
          padding="none"
          className="w-full max-w-xl overflow-hidden bg-white shadow-2xl"
        >
          <form onSubmit={handleUpdate}>
            <div className="flex items-start justify-between gap-5 border-b border-[#F3DFC2] bg-gradient-to-r from-[#FFF8EE] to-white px-6 py-6 sm:px-8">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FFF4DE] text-[#C89B3C]">
                  <FolderPen
                    size={24}
                    aria-hidden="true"
                  />
                </div>

                <div>
                  <h2
                    id="edit-category-title"
                    className="text-2xl font-bold text-[#6D2E00] sm:text-3xl"
                  >
                    Edit Category
                  </h2>

                  <p className="mt-2 leading-7 text-gray-600">
                    Update this category&apos;s information and image.
                  </p>
                </div>
              </div>

              <button
                type="button"
                aria-label="Close edit category dialog"
                onClick={closeModal}
                disabled={saving}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-gray-500 transition hover:bg-[#FFF4DE] hover:text-[#6D2E00] focus:outline-none focus:ring-4 focus:ring-[#C89B3C]/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X
                  size={21}
                  aria-hidden="true"
                />
              </button>
            </div>

            {loadingCategory ? (
              <div className="flex min-h-72 items-center justify-center">
                <Spinner
                  size="lg"
                  text="Loading category..."
                />
              </div>
            ) : error ? (
              <div className="p-6 sm:p-8">
                <Card
                  padding="lg"
                  className="border-red-200 bg-red-50 text-center shadow-none"
                >
                  <h3 className="text-xl font-bold text-red-700">
                    Category unavailable
                  </h3>

                  <p className="mt-3 leading-7 text-red-600">
                    {error}
                  </p>

                  <Button
                    type="button"
                    variant="primary"
                    leftIcon={
                      <RefreshCw
                        size={18}
                        aria-hidden="true"
                      />
                    }
                    className="mt-6"
                    onClick={() => void loadCategory()}
                  >
                    Try Again
                  </Button>
                </Card>
              </div>
            ) : (
              <div className="space-y-6 p-6 sm:p-8">
                <div>
                  <label
                    htmlFor="edit-category-name"
                    className="mb-2 block text-sm font-semibold text-[#6D2E00]"
                  >
                    Category Name
                  </label>

                  <input
                    id="edit-category-name"
                    value={name}
                    onChange={(event) =>
                      handleNameChange(event.target.value)
                    }
                    placeholder="Traditional Snacks"
                    required
                    disabled={saving}
                    className="h-13 w-full rounded-2xl border border-[#E7C98C] bg-[#FFFDF8] px-4 text-[#6D2E00] outline-none transition focus:border-[#C89B3C] focus:bg-white focus:ring-4 focus:ring-[#C89B3C]/15 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>

                <div>
                  <label
                    htmlFor="edit-category-slug"
                    className="mb-2 block text-sm font-semibold text-[#6D2E00]"
                  >
                    Slug
                  </label>

                  <input
                    id="edit-category-slug"
                    value={slug}
                    onChange={(event) =>
                      setSlug(createSlug(event.target.value))
                    }
                    placeholder="traditional-snacks"
                    required
                    disabled={saving}
                    className="h-13 w-full rounded-2xl border border-[#E7C98C] bg-[#FFFDF8] px-4 text-[#6D2E00] outline-none transition focus:border-[#C89B3C] focus:bg-white focus:ring-4 focus:ring-[#C89B3C]/15 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                  <p className="mt-2 text-xs leading-5 text-gray-500">
                    Used in category URLs. Lowercase letters, numbers and
                    hyphens are supported.
                  </p>
                </div>

                <Card
                  variant="filled"
                  padding="md"
                  className="shadow-none"
                >
                  <div className="mb-5 flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#C89B3C] shadow-sm">
                      <ImageIcon
                        size={20}
                        aria-hidden="true"
                      />
                    </div>

                    <div>
                      <h3 className="font-semibold text-[#6D2E00]">
                        Category Image
                      </h3>

                      <p className="mt-1 text-sm leading-6 text-gray-500">
                        Replace the existing image or keep it unchanged.
                      </p>
                    </div>
                  </div>

                  <ImageUploader
                    bucket="categories"
                    value={image}
                    onChange={setImage}
                  />

                  {image && (
                    <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-4">
                      <p className="font-semibold text-green-800">
                        Image ready
                      </p>

                      <p className="mt-1 text-sm leading-6 text-green-700">
                        This image will be saved with the category.
                      </p>
                    </div>
                  )}
                </Card>

                <div className="flex flex-col-reverse gap-3 border-t border-[#F3DFC2] pt-6 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={saving}
                    onClick={closeModal}
                  >
                    Cancel
                  </Button>

                  <Button
                    type="submit"
                    variant="primary"
                    loading={saving}
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            )}
          </form>
        </Card>
      </div>
    </div>
  );
}