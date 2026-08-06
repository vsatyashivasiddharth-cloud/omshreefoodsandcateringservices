"use client";

import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";
import {
  ImageIcon,
  PackagePlus,
  Plus,
  RefreshCw,
  Star,
  X,
} from "lucide-react";
import { toast } from "sonner";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";

import ImageUploader from "./ImageUploader";
import ProductVariantFields, {
  createInitialVariantRows,
  serializeVariantRows,
  validateVariantRows,
  type ProductVariantFormData,
} from "./ProductVariantFields";

interface Category {
  id: string;
  name: string;
}

interface AddProductModalProps {
  onSuccess: () => void;
}

interface ProductFormData {
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  featured: boolean;
  image: string;
}

const initialFormData: ProductFormData = {
  name: "",
  slug: "",
  description: "",
  categoryId: "",
  featured: false,
  image: "",
};

const inputClassName =
  "h-13 w-full rounded-2xl border border-[#E7C98C] bg-[#FFFDF8] px-4 text-[#6D2E00] outline-none transition focus:border-[#C89B3C] focus:bg-white focus:ring-4 focus:ring-[#C89B3C]/15 disabled:cursor-not-allowed disabled:opacity-60";

function createSlug(
  value: string,
) {
  return value
    .toLowerCase()
    .trim()
    .replace(
      /[^a-z0-9]+/g,
      "-",
    )
    .replace(
      /^-+|-+$/g,
      "",
    );
}

export default function AddProductModal({
  onSuccess,
}: AddProductModalProps) {
  const [open, setOpen] =
    useState(false);

  const [formData, setFormData] =
    useState<ProductFormData>(
      initialFormData,
    );

  const [variants, setVariants] =
    useState<
      ProductVariantFormData[]
    >(() =>
      createInitialVariantRows(),
    );

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [
    categoriesLoading,
    setCategoriesLoading,
  ] = useState(false);

  const [
    categoriesError,
    setCategoriesError,
  ] = useState("");

  const [loading, setLoading] =
    useState(false);

  const loadCategories =
    useCallback(async () => {
      try {
        setCategoriesLoading(
          true,
        );

        setCategoriesError("");

        const response =
          await fetch(
            "/api/categories",
            {
              cache: "no-store",
            },
          );

        const result: unknown =
          await response
            .json()
            .catch(() => null);

        if (!response.ok) {
          throw new Error(
            "Unable to load categories.",
          );
        }

        if (
          !Array.isArray(result)
        ) {
          throw new Error(
            "Invalid categories response.",
          );
        }

        const loadedCategories =
          result as Category[];

        setCategories(
          loadedCategories,
        );

        setFormData(
          (current) => ({
            ...current,
            categoryId:
              current.categoryId ||
              loadedCategories[0]
                ?.id ||
              "",
          }),
        );
      } catch (error) {
        console.error(
          "Category loading error:",
          error,
        );

        setCategoriesError(
          error instanceof Error
            ? error.message
            : "Something went wrong while loading categories.",
        );
      } finally {
        setCategoriesLoading(
          false,
        );
      }
    }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  function resetForm() {
    setFormData({
      ...initialFormData,
      categoryId:
        categories[0]?.id ||
        "",
    });

    setVariants(
      createInitialVariantRows(),
    );
  }

  function closeModal() {
    if (loading) {
      return;
    }

    setOpen(false);
    resetForm();
  }

  function updateField<
    K extends keyof ProductFormData,
  >(
    field: K,
    value: ProductFormData[K],
  ) {
    setFormData(
      (current) => ({
        ...current,
        [field]: value,
      }),
    );
  }

  function handleNameChange(
    value: string,
  ) {
    setFormData(
      (current) => {
        const generatedSlug =
          createSlug(
            current.name,
          );

        return {
          ...current,
          name: value,
          slug:
            !current.slug ||
            current.slug ===
              generatedSlug
              ? createSlug(value)
              : current.slug,
        };
      },
    );
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (loading) {
      return;
    }

    const name =
      formData.name.trim();

    const slug =
      createSlug(formData.slug);

    const description =
      formData.description.trim();

    if (
      !name ||
      !slug ||
      !description ||
      !formData.categoryId
    ) {
      toast.error(
        "Please complete all required product fields.",
      );

      return;
    }

    const variantError =
      validateVariantRows(
        variants,
      );

    if (variantError) {
      toast.error(
        variantError,
      );

      return;
    }

    setLoading(true);

    try {
      const response =
        await fetch(
          "/api/products",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                name,
                slug,
                description,
                featured:
                  formData.featured,
                image:
                  formData.image.trim(),
                categoryId:
                  formData.categoryId,
                variants:
                  serializeVariantRows(
                    variants,
                  ),
              }),
          },
        );

      const result: {
        error?: string;
        message?: string;
      } = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.error ||
            result.message ||
            "Failed to create product.",
        );
      }

      toast.success(
        "Product and variants created successfully.",
      );

      resetForm();
      setOpen(false);
      onSuccess();
    } catch (error) {
      console.error(
        "Product creation error:",
        error,
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create product.",
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
        onClick={() =>
          setOpen(true)
        }
      >
        Add Product
      </Button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-product-title"
          className="fixed inset-0 z-[9999] overflow-y-auto bg-black/60 p-4 backdrop-blur-sm sm:p-6"
          onMouseDown={(
            event,
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeModal();
            }
          }}
        >
          <div className="flex min-h-full items-center justify-center">
            <Card
              padding="none"
              className="w-full max-w-5xl overflow-hidden bg-white shadow-2xl"
            >
              <form
                onSubmit={
                  handleSubmit
                }
              >
                <div className="flex items-start justify-between gap-5 border-b border-[#F3DFC2] bg-gradient-to-r from-[#FFF8EE] to-white px-6 py-6 sm:px-8">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FFF4DE] text-[#C89B3C]">
                      <PackagePlus
                        size={24}
                        aria-hidden="true"
                      />
                    </div>

                    <div>
                      <h2
                        id="add-product-title"
                        className="text-2xl font-bold text-[#6D2E00] sm:text-3xl"
                      >
                        Add Product
                      </h2>

                      <p className="mt-2 leading-7 text-gray-600">
                        Create a
                        product with
                        separate weight,
                        price and stock
                        variants.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    aria-label="Close add product dialog"
                    onClick={
                      closeModal
                    }
                    disabled={loading}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-gray-500 transition hover:bg-[#FFF4DE] hover:text-[#6D2E00] disabled:opacity-50"
                  >
                    <X
                      size={21}
                      aria-hidden="true"
                    />
                  </button>
                </div>

                <div className="max-h-[calc(100vh-150px)] space-y-6 overflow-y-auto p-6 sm:p-8">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[#6D2E00]">
                        Product Name
                      </label>

                      <input
                        value={
                          formData.name
                        }
                        onChange={(
                          event,
                        ) =>
                          handleNameChange(
                            event
                              .target
                              .value,
                          )
                        }
                        required
                        disabled={
                          loading
                        }
                        className={
                          inputClassName
                        }
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[#6D2E00]">
                        Slug
                      </label>

                      <input
                        value={
                          formData.slug
                        }
                        onChange={(
                          event,
                        ) =>
                          updateField(
                            "slug",
                            createSlug(
                              event
                                .target
                                .value,
                            ),
                          )
                        }
                        required
                        disabled={
                          loading
                        }
                        className={
                          inputClassName
                        }
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[#6D2E00]">
                        Category
                      </label>

                      {categoriesLoading ? (
                        <div className="flex h-13 items-center rounded-2xl border border-[#E7C98C] bg-[#FFFDF8] px-4">
                          <Spinner size="sm" />
                          <span className="ml-3 text-sm text-gray-500">
                            Loading
                            categories...
                          </span>
                        </div>
                      ) : categoriesError ? (
                        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                          <p className="text-sm text-red-600">
                            {
                              categoriesError
                            }
                          </p>

                          <button
                            type="button"
                            onClick={() =>
                              void loadCategories()
                            }
                            className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-red-700"
                          >
                            <RefreshCw
                              size={
                                15
                              }
                            />
                            Try Again
                          </button>
                        </div>
                      ) : (
                        <select
                          value={
                            formData.categoryId
                          }
                          onChange={(
                            event,
                          ) =>
                            updateField(
                              "categoryId",
                              event
                                .target
                                .value,
                            )
                          }
                          required
                          disabled={
                            loading ||
                            categories.length ===
                              0
                          }
                          className={
                            inputClassName
                          }
                        >
                          {categories.map(
                            (
                              category,
                            ) => (
                              <option
                                key={
                                  category.id
                                }
                                value={
                                  category.id
                                }
                              >
                                {
                                  category.name
                                }
                              </option>
                            ),
                          )}
                        </select>
                      )}
                    </div>

                    <div className="flex items-end">
                      <label className="flex min-h-13 w-full cursor-pointer items-center gap-3 rounded-2xl border border-[#E7C98C] bg-[#FFFDF8] px-4 py-3">
                        <input
                          type="checkbox"
                          checked={
                            formData.featured
                          }
                          onChange={(
                            event,
                          ) =>
                            updateField(
                              "featured",
                              event
                                .target
                                .checked,
                            )
                          }
                          disabled={
                            loading
                          }
                          className="h-5 w-5 accent-[#6D2E00]"
                        />

                        <Star
                          size={20}
                          className="text-[#C89B3C]"
                        />

                        <span className="font-semibold text-[#6D2E00]">
                          Featured
                          Product
                        </span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#6D2E00]">
                      Product
                      Description
                    </label>

                    <textarea
                      value={
                        formData.description
                      }
                      onChange={(
                        event,
                      ) =>
                        updateField(
                          "description",
                          event.target
                            .value,
                        )
                      }
                      rows={5}
                      required
                      disabled={
                        loading
                      }
                      className="w-full resize-y rounded-2xl border border-[#E7C98C] bg-[#FFFDF8] px-4 py-3 text-[#6D2E00] outline-none transition focus:border-[#C89B3C] focus:ring-4 focus:ring-[#C89B3C]/15"
                    />
                  </div>

                  <ProductVariantFields
                    variants={
                      variants
                    }
                    disabled={
                      loading
                    }
                    onChange={
                      setVariants
                    }
                  />

                  <Card
                    variant="filled"
                    padding="md"
                    className="shadow-none"
                  >
                    <div className="mb-5 flex items-start gap-3">
                      <ImageIcon
                        size={20}
                        className="text-[#C89B3C]"
                      />

                      <div>
                        <h3 className="font-semibold text-[#6D2E00]">
                          Product
                          Image
                        </h3>

                        <p className="mt-1 text-sm text-gray-500">
                          Upload a
                          clear product
                          image.
                        </p>
                      </div>
                    </div>

                    <ImageUploader
                      bucket="products"
                      value={
                        formData.image
                      }
                      onChange={(
                        url,
                      ) =>
                        updateField(
                          "image",
                          url,
                        )
                      }
                    />
                  </Card>

                  <div className="flex flex-col-reverse gap-3 border-t border-[#F3DFC2] pt-6 sm:flex-row sm:justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={
                        loading
                      }
                      onClick={
                        closeModal
                      }
                    >
                      Cancel
                    </Button>

                    <Button
                      type="submit"
                      variant="primary"
                      loading={
                        loading
                      }
                      disabled={
                        categoriesLoading ||
                        categories.length ===
                          0
                      }
                    >
                      Save Product
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