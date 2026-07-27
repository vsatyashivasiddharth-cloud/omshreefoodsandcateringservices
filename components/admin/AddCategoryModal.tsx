"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { FolderPlus, ImageIcon, Plus, X } from "lucide-react";
import { toast } from "sonner";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

import ImageUploader from "./ImageUploader";

interface AddCategoryModalProps {
  onSuccess: () => void;
}

function createSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AddCategoryModal({
  onSuccess,
}: AddCategoryModalProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [image, setImage] = useState("");
  const [loading, setLoading] = useState(false);

  function resetForm() {
    setName("");
    setSlug("");
    setImage("");
  }

  function closeModal() {
    if (loading) {
      return;
    }

    setOpen(false);
    resetForm();
  }

  function handleNameChange(value: string) {
    setName(value);

    setSlug((currentSlug) =>
      currentSlug === createSlug(name) || currentSlug.length === 0
        ? createSlug(value)
        : currentSlug,
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedName = name.trim();
    const normalizedSlug = createSlug(slug);

    if (!normalizedName || !normalizedSlug) {
      toast.error("Category name and slug are required.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: normalizedName,
          slug: normalizedSlug,
          image: image || null,
        }),
      });

      const result: {
        error?: string;
      } = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Failed to create category.",
        );
      }

      toast.success("Category created successfully.");

      resetForm();
      setOpen(false);
      onSuccess();
    } catch (error) {
      console.error("Category creation error:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Something went wrong while creating the category.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="primary"
        leftIcon={
          <Plus
            size={18}
            aria-hidden="true"
          />
        }
        onClick={() => setOpen(true)}
      >
        Add Category
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-[9999] overflow-y-auto bg-black/60 p-4 backdrop-blur-sm sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-category-title"
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
              <form onSubmit={handleSubmit}>
                <div className="flex items-start justify-between gap-5 border-b border-[#F3DFC2] bg-gradient-to-r from-[#FFF8EE] to-white px-6 py-6 sm:px-8">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FFF4DE] text-[#C89B3C]">
                      <FolderPlus
                        size={24}
                        aria-hidden="true"
                      />
                    </div>

                    <div>
                      <h2
                        id="add-category-title"
                        className="text-2xl font-bold text-[#6D2E00] sm:text-3xl"
                      >
                        Add Category
                      </h2>

                      <p className="mt-2 leading-7 text-gray-600">
                        Create a new category for your products.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    aria-label="Close add category dialog"
                    onClick={closeModal}
                    disabled={loading}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-gray-500 transition hover:bg-[#FFF4DE] hover:text-[#6D2E00] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <X
                      size={21}
                      aria-hidden="true"
                    />
                  </button>
                </div>

                <div className="space-y-6 p-6 sm:p-8">
                  <div>
                    <label
                      htmlFor="category-name"
                      className="mb-2 block text-sm font-semibold text-[#6D2E00]"
                    >
                      Category Name
                    </label>

                    <input
                      id="category-name"
                      value={name}
                      onChange={(event) =>
                        handleNameChange(event.target.value)
                      }
                      placeholder="Traditional Snacks"
                      required
                      disabled={loading}
                      className="h-13 w-full rounded-2xl border border-[#E7C98C] bg-[#FFFDF8] px-4 text-[#6D2E00] outline-none transition focus:border-[#C89B3C] focus:bg-white focus:ring-4 focus:ring-[#C89B3C]/15 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="category-slug"
                      className="mb-2 block text-sm font-semibold text-[#6D2E00]"
                    >
                      Slug
                    </label>

                    <input
                      id="category-slug"
                      value={slug}
                      onChange={(event) =>
                        setSlug(createSlug(event.target.value))
                      }
                      placeholder="traditional-snacks"
                      required
                      disabled={loading}
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
                          Upload an image that clearly represents this category.
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
                          Image uploaded successfully
                        </p>

                        <p className="mt-1 text-sm leading-6 text-green-700">
                          The uploaded image will be saved with this category.
                        </p>
                      </div>
                    )}
                  </Card>

                  <div className="flex flex-col-reverse gap-3 border-t border-[#F3DFC2] pt-6 sm:flex-row sm:justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={loading}
                      onClick={closeModal}
                    >
                      Cancel
                    </Button>

                    <Button
                      type="submit"
                      variant="primary"
                      loading={loading}
                    >
                      Save Category
                    </Button>
                  </div>
                </div>
              </form>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}