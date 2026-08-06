"use client";

import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";
import {
  ImageIcon,
  Package,
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
  createVariantRow,
  serializeVariantRows,
  validateVariantRows,
  type ProductVariantFormData,
} from "./ProductVariantFields";

interface Category {
  id: string;
  name: string;
}

interface ProductVariantResponse {
  id: string;
  label: string;
  weightGrams: number;
  shippingWeightGrams: number;
  price: number | string;
  stock: number;
  sku: string | null;
  isActive: boolean;
  isDefault: boolean;
  sortOrder: number;
}

interface ProductResponse {
  id: string;
  name: string;
  slug: string;
  description: string;
  featured: boolean;
  image: string | null;
  categoryId: string;
  variants: ProductVariantResponse[];
}

interface EditProductModalProps {
  productId: string;
  open: boolean;
  onClose: () => void;
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

export default function EditProductModal({
  productId,
  open,
  onClose,
  onSuccess,
}: EditProductModalProps) {
  const [formData, setFormData] =
    useState<ProductFormData>(
      initialFormData,
    );

  const [variants, setVariants] =
    useState<
      ProductVariantFormData[]
    >([]);

  const [
    legacyProductWarning,
    setLegacyProductWarning,
  ] = useState(false);

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [
    loadingProduct,
    setLoadingProduct,
  ] = useState(false);

  const [
    loadingCategories,
    setLoadingCategories,
  ] = useState(false);

  const [saving, setSaving] =
    useState(false);

  const [loadError, setLoadError] =
    useState("");

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

  const loadCategories =
    useCallback(async () => {
      try {
        setLoadingCategories(
          true,
        );

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

        if (
          !response.ok ||
          !Array.isArray(result)
        ) {
          throw new Error(
            "Failed to load categories.",
          );
        }

        setCategories(
          result as Category[],
        );
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to load categories.",
        );
      } finally {
        setLoadingCategories(
          false,
        );
      }
    }, []);

  const loadProduct =
    useCallback(
      async (
        signal?: AbortSignal,
      ) => {
        const normalizedId =
          productId.trim();

        if (!normalizedId) {
          return;
        }

        try {
          setLoadingProduct(
            true,
          );

          setLoadError("");

          const response =
            await fetch(
              `/api/products/${encodeURIComponent(
                normalizedId,
              )}`,
              {
                cache:
                  "no-store",
                signal,
              },
            );

          const result:
            | ProductResponse
            | {
                error?: string;
                message?: string;
              } =
            await response
              .json()
              .catch(() => ({}));

          if (!response.ok) {
            const failure =
              result as {
                error?: string;
                message?: string;
              };

            throw new Error(
              failure.error ||
                failure.message ||
                "Failed to load product.",
            );
          }

          const product =
            result as ProductResponse;

          setFormData({
            name: product.name,
            slug: product.slug,
            description:
              product.description,
            featured:
              product.featured,
            image:
              product.image ||
              "",
            categoryId:
              product.categoryId,
          });

          if (
            product.variants
              .length === 0
          ) {
            setLegacyProductWarning(
              true,
            );

            setVariants(
              createInitialVariantRows(),
            );
          } else {
            setLegacyProductWarning(
              false,
            );

            setVariants(
              product.variants.map(
                (
                  variant,
                  index,
                ) => ({
                  ...createVariantRow(),
                  id:
                    variant.id,
                  label:
                    variant.label,
                  weightGrams:
                    String(
                      variant.weightGrams,
                    ),
                  shippingWeightGrams:
                    String(
                      variant.shippingWeightGrams,
                    ),
                  price:
                    String(
                      variant.price,
                    ),
                  stock:
                    String(
                      variant.stock,
                    ),
                  sku:
                    variant.sku ||
                    "",
                  isActive:
                    variant.isActive,
                  isDefault:
                    variant.isDefault,
                  sortOrder:
                    variant.sortOrder ??
                    index,
                }),
              ),
            );
          }
        } catch (error) {
          if (
            error instanceof
              DOMException &&
            error.name ===
              "AbortError"
          ) {
            return;
          }

          const message =
            error instanceof Error
              ? error.message
              : "Failed to load product.";

          setLoadError(message);
          toast.error(message);
        } finally {
          if (!signal?.aborted) {
            setLoadingProduct(
              false,
            );
          }
        }
      },
      [productId],
    );

  useEffect(() => {
    if (
      !open ||
      !productId.trim()
    ) {
      return;
    }

    const controller =
      new AbortController();

    void Promise.all([
      loadCategories(),
      loadProduct(
        controller.signal,
      ),
    ]);

    return () => {
      controller.abort();
    };
  }, [
    open,
    productId,
    loadCategories,
    loadProduct,
  ]);

  function handleNameChange(
    value: string,
  ) {
    setFormData(
      (current) => {
        const previousSlug =
          createSlug(
            current.name,
          );

        return {
          ...current,
          name: value,
          slug:
            !current.slug ||
            current.slug ===
              previousSlug
              ? createSlug(value)
              : current.slug,
        };
      },
    );
  }

  function closeModal() {
    if (!saving) {
      onClose();
    }
  }

  async function handleUpdate(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (saving) {
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

    try {
      setSaving(true);

      const response =
        await fetch(
          `/api/products/${encodeURIComponent(
            productId,
          )}`,
          {
            method: "PUT",

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
            "Failed to update product.",
        );
      }

      toast.success(
        "Product and variants updated successfully.",
      );

      onSuccess();
      onClose();
    } catch (error) {
      console.error(
        "Product update error:",
        error,
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update product.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return null;
  }

  const loading =
    loadingProduct ||
    loadingCategories;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-product-title"
      className="fixed inset-0 z-[9999] overflow-y-auto bg-black/60 p-4 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
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
              handleUpdate
            }
          >
            <div className="flex items-start justify-between gap-5 border-b border-[#F3DFC2] bg-gradient-to-r from-[#FFF8EE] to-white px-6 py-6 sm:px-8">
              <div className="flex items-start gap-4">
                <Package
                  size={28}
                  className="text-[#C89B3C]"
                />

                <div>
                  <h2
                    id="edit-product-title"
                    className="text-2xl font-bold text-[#6D2E00] sm:text-3xl"
                  >
                    Edit Product
                  </h2>

                  <p className="mt-2 text-gray-600">
                    Update product
                    information and
                    package variants.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={
                  closeModal
                }
                disabled={saving}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 hover:bg-[#FFF4DE]"
              >
                <X size={21} />
              </button>
            </div>

            {loading ? (
              <div className="flex min-h-80 items-center justify-center">
                <Spinner
                  size="lg"
                  text="Loading product..."
                />
              </div>
            ) : loadError ? (
              <div className="p-8 text-center">
                <p className="font-semibold text-red-700">
                  {loadError}
                </p>

                <Button
                  type="button"
                  variant="primary"
                  leftIcon={
                    <RefreshCw
                      size={17}
                    />
                  }
                  className="mt-5"
                  onClick={() =>
                    void loadProduct()
                  }
                >
                  Try Again
                </Button>
              </div>
            ) : (
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
                          event.target
                            .value,
                        )
                      }
                      required
                      disabled={
                        saving
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
                            event.target
                              .value,
                          ),
                        )
                      }
                      required
                      disabled={
                        saving
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

                    <select
                      value={
                        formData.categoryId
                      }
                      onChange={(
                        event,
                      ) =>
                        updateField(
                          "categoryId",
                          event.target
                            .value,
                        )
                      }
                      required
                      disabled={
                        saving ||
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
                            event.target
                              .checked,
                          )
                        }
                        disabled={
                          saving
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
                      saving
                    }
                    className="w-full resize-y rounded-2xl border border-[#E7C98C] bg-[#FFFDF8] px-4 py-3 text-[#6D2E00] outline-none focus:border-[#C89B3C] focus:ring-4 focus:ring-[#C89B3C]/15"
                  />
                </div>

                <ProductVariantFields
                  variants={
                    variants
                  }
                  disabled={
                    saving
                  }
                  legacyProductWarning={
                    legacyProductWarning
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
                  <div className="mb-5 flex items-center gap-3">
                    <ImageIcon
                      size={20}
                      className="text-[#C89B3C]"
                    />

                    <h3 className="font-semibold text-[#6D2E00]">
                      Product Image
                    </h3>
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
                      saving
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
                      saving
                    }
                    disabled={
                      categories.length ===
                      0
                    }
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