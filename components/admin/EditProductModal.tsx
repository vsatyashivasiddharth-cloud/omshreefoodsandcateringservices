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
  Scale,
  Star,
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
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number | string;
  stock: number;
  shippingWeightGrams: number;
  featured: boolean;
  image: string | null;
  categoryId: string;
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
  price: string;
  stock: string;
  shippingWeightGrams: string;
  categoryId: string;
  featured: boolean;
  image: string;
}

const initialFormData: ProductFormData = {
  name: "",
  slug: "",
  description: "",
  price: "",
  stock: "0",
  shippingWeightGrams: "",
  categoryId: "",
  featured: false,
  image: "",
};

const inputClassName =
  "h-13 w-full rounded-2xl border border-[#E7C98C] bg-[#FFFDF8] px-4 text-[#6D2E00] outline-none transition focus:border-[#C89B3C] focus:bg-white focus:ring-4 focus:ring-[#C89B3C]/15 disabled:cursor-not-allowed disabled:opacity-60";

function createSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function EditProductModal({
  productId,
  open,
  onClose,
  onSuccess,
}: EditProductModalProps) {
  const [formData, setFormData] =
    useState<ProductFormData>(initialFormData);

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [loadingProduct, setLoadingProduct] =
    useState(false);

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
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  }

  const loadCategories =
    useCallback(async () => {
      try {
        setLoadingCategories(true);

        const response = await fetch(
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
            "Failed to load categories.",
          );
        }

        if (!Array.isArray(result)) {
          throw new Error(
            "Invalid categories response.",
          );
        }

        setCategories(
          result as Category[],
        );
      } catch (error) {
        console.error(
          "Category loading error:",
          error,
        );

        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to load categories.",
        );
      } finally {
        setLoadingCategories(false);
      }
    }, []);

  const loadProduct = useCallback(
    async (signal?: AbortSignal) => {
      const normalizedProductId =
        productId.trim();

      if (!normalizedProductId) {
        return;
      }

      try {
        setLoadingProduct(true);
        setLoadError("");

        const response = await fetch(
          `/api/products/${encodeURIComponent(
            normalizedProductId,
          )}`,
          {
            cache: "no-store",
            signal,
          },
        );

        const result:
          | Product
          | {
              error?: string;
              message?: string;
            } = await response
          .json()
          .catch(() => ({}));

        if (!response.ok) {
          const errorResult =
            result as {
              error?: string;
              message?: string;
            };

          throw new Error(
            errorResult.error ||
              errorResult.message ||
              "Failed to load product.",
          );
        }

        const product =
          result as Product;

        setFormData({
          name: product.name,
          slug: product.slug,
          description:
            product.description,
          price: String(product.price),
          stock: String(product.stock),
          shippingWeightGrams: String(
            Math.max(
              0,
              Math.floor(
                Number(
                  product.shippingWeightGrams,
                ) || 0,
              ),
            ),
          ),
          featured:
            product.featured,
          image: product.image || "",
          categoryId:
            product.categoryId,
        });
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        console.error(
          "Product loading error:",
          error,
        );

        const message =
          error instanceof Error
            ? error.message
            : "Failed to load product.";

        setLoadError(message);
        toast.error(message);
      } finally {
        if (!signal?.aborted) {
          setLoadingProduct(false);
        }
      }
    },
    [productId],
  );

  useEffect(() => {
    if (!open || !productId.trim()) {
      return;
    }

    const controller =
      new AbortController();

    void Promise.all([
      loadCategories(),
      loadProduct(controller.signal),
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

  function handleNameChange(value: string) {
    setFormData((current) => {
      const previousGeneratedSlug =
        createSlug(current.name);

      return {
        ...current,
        name: value,
        slug:
          !current.slug ||
          current.slug ===
            previousGeneratedSlug
            ? createSlug(value)
            : current.slug,
      };
    });
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

    if (saving) {
      return;
    }

    const name = formData.name.trim();
    const slug = createSlug(formData.slug);

    const description =
      formData.description.trim();

    const price = Number(formData.price);
    const stock = Number(formData.stock);

    const shippingWeightGrams = Number(
      formData.shippingWeightGrams,
    );

    if (
      !name ||
      !slug ||
      !description ||
      !formData.categoryId
    ) {
      toast.error(
        "Please complete all required fields.",
      );
      return;
    }

    if (
      !Number.isFinite(price) ||
      price <= 0
    ) {
      toast.error(
        "Enter a valid product price greater than zero.",
      );
      return;
    }

    if (
      !Number.isInteger(stock) ||
      stock < 0
    ) {
      toast.error(
        "Stock must be a whole number of zero or more.",
      );
      return;
    }

    if (
      !Number.isInteger(
        shippingWeightGrams,
      ) ||
      shippingWeightGrams < 1
    ) {
      toast.error(
        "Shipping weight must be a whole number greater than zero.",
      );
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `/api/products/${encodeURIComponent(
          productId,
        )}`,
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            name,
            slug,
            description,
            price,
            stock,
            shippingWeightGrams,
            featured:
              formData.featured,
            image:
              formData.image.trim(),
            categoryId:
              formData.categoryId,
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
        "Product updated successfully.",
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
          className="w-full max-w-3xl overflow-hidden bg-white shadow-2xl"
        >
          <form onSubmit={handleUpdate}>
            <div className="flex items-start justify-between gap-5 border-b border-[#F3DFC2] bg-gradient-to-r from-[#FFF8EE] to-white px-6 py-6 sm:px-8">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FFF4DE] text-[#C89B3C]">
                  <Package
                    size={24}
                    aria-hidden="true"
                  />
                </div>

                <div>
                  <h2
                    id="edit-product-title"
                    className="text-2xl font-bold text-[#6D2E00] sm:text-3xl"
                  >
                    Edit Product
                  </h2>

                  <p className="mt-2 leading-7 text-gray-600">
                    Update the product
                    information, stock, shipping
                    weight and image.
                  </p>
                </div>
              </div>

              <button
                type="button"
                aria-label="Close edit product dialog"
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

            {loading ? (
              <div className="flex min-h-80 items-center justify-center">
                <Spinner
                  size="lg"
                  text="Loading product..."
                />
              </div>
            ) : loadError ? (
              <div className="p-6 sm:p-8">
                <Card
                  padding="lg"
                  className="border-red-200 bg-red-50 text-center shadow-none"
                >
                  <h3 className="text-xl font-bold text-red-700">
                    Product unavailable
                  </h3>

                  <p className="mt-3 leading-7 text-red-600">
                    {loadError}
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
                    onClick={() => {
                      void Promise.all([
                        loadCategories(),
                        loadProduct(),
                      ]);
                    }}
                  >
                    Try Again
                  </Button>
                </Card>
              </div>
            ) : (
              <div className="max-h-[calc(100vh-150px)] space-y-6 overflow-y-auto p-6 sm:p-8">
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="edit-product-name"
                      className="mb-2 block text-sm font-semibold text-[#6D2E00]"
                    >
                      Product Name
                    </label>

                    <input
                      id="edit-product-name"
                      value={formData.name}
                      onChange={(event) =>
                        handleNameChange(
                          event.target.value,
                        )
                      }
                      placeholder="Mango Pickle"
                      required
                      disabled={saving}
                      className={inputClassName}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="edit-product-slug"
                      className="mb-2 block text-sm font-semibold text-[#6D2E00]"
                    >
                      Slug
                    </label>

                    <input
                      id="edit-product-slug"
                      value={formData.slug}
                      onChange={(event) =>
                        updateField(
                          "slug",
                          createSlug(
                            event.target.value,
                          ),
                        )
                      }
                      placeholder="mango-pickle"
                      required
                      disabled={saving}
                      className={inputClassName}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="edit-product-price"
                      className="mb-2 block text-sm font-semibold text-[#6D2E00]"
                    >
                      Price
                    </label>

                    <div className="relative">
                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-[#C89B3C]">
                        ₹
                      </span>

                      <input
                        id="edit-product-price"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={formData.price}
                        onChange={(event) =>
                          updateField(
                            "price",
                            event.target.value,
                          )
                        }
                        required
                        disabled={saving}
                        className={`${inputClassName} pl-9`}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="edit-product-stock"
                      className="mb-2 block text-sm font-semibold text-[#6D2E00]"
                    >
                      Stock
                    </label>

                    <input
                      id="edit-product-stock"
                      type="number"
                      min="0"
                      step="1"
                      value={formData.stock}
                      onChange={(event) =>
                        updateField(
                          "stock",
                          event.target.value,
                        )
                      }
                      required
                      disabled={saving}
                      className={inputClassName}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="edit-product-shipping-weight"
                      className="mb-2 block text-sm font-semibold text-[#6D2E00]"
                    >
                      Shipping Weight
                    </label>

                    <div className="relative">
                      <Scale
                        size={18}
                        aria-hidden="true"
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#C89B3C]"
                      />

                      <input
                        id="edit-product-shipping-weight"
                        type="number"
                        min="1"
                        step="1"
                        inputMode="numeric"
                        value={
                          formData.shippingWeightGrams
                        }
                        onChange={(event) =>
                          updateField(
                            "shippingWeightGrams",
                            event.target.value,
                          )
                        }
                        required
                        disabled={saving}
                        className={`${inputClassName} pl-11 pr-16`}
                      />

                      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">
                        grams
                      </span>
                    </div>

                    <p className="mt-2 text-xs leading-5 text-gray-500">
                      Weight of one unit,
                      including the product
                      container and immediate
                      packaging.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="edit-product-category"
                      className="mb-2 block text-sm font-semibold text-[#6D2E00]"
                    >
                      Category
                    </label>

                    <select
                      id="edit-product-category"
                      value={
                        formData.categoryId
                      }
                      onChange={(event) =>
                        updateField(
                          "categoryId",
                          event.target.value,
                        )
                      }
                      required
                      disabled={
                        saving ||
                        categories.length === 0
                      }
                      className={inputClassName}
                    >
                      {categories.length === 0 ? (
                        <option value="">
                          No categories available
                        </option>
                      ) : (
                        categories.map(
                          (category) => (
                            <option
                              key={category.id}
                              value={category.id}
                            >
                              {category.name}
                            </option>
                          ),
                        )
                      )}
                    </select>
                  </div>

                  <div className="flex items-end md:col-span-2">
                    <label className="flex min-h-13 w-full cursor-pointer items-center gap-3 rounded-2xl border border-[#E7C98C] bg-[#FFFDF8] px-4 py-3 transition hover:border-[#C89B3C]">
                      <input
                        type="checkbox"
                        checked={
                          formData.featured
                        }
                        onChange={(event) =>
                          updateField(
                            "featured",
                            event.target.checked,
                          )
                        }
                        disabled={saving}
                        className="h-5 w-5 accent-[#6D2E00]"
                      />

                      <Star
                        size={20}
                        className="shrink-0 text-[#C89B3C]"
                        aria-hidden="true"
                      />

                      <div>
                        <p className="font-semibold text-[#6D2E00]">
                          Featured Product
                        </p>

                        <p className="text-sm text-gray-500">
                          Display this product on
                          the homepage.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="edit-product-description"
                    className="mb-2 block text-sm font-semibold text-[#6D2E00]"
                  >
                    Product Description
                  </label>

                  <textarea
                    id="edit-product-description"
                    value={
                      formData.description
                    }
                    onChange={(event) =>
                      updateField(
                        "description",
                        event.target.value,
                      )
                    }
                    rows={5}
                    placeholder="Write a detailed product description..."
                    required
                    disabled={saving}
                    className="w-full resize-y rounded-2xl border border-[#E7C98C] bg-[#FFFDF8] px-4 py-3 text-[#6D2E00] outline-none transition focus:border-[#C89B3C] focus:bg-white focus:ring-4 focus:ring-[#C89B3C]/15 disabled:cursor-not-allowed disabled:opacity-60"
                  />
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
                        Product Image
                      </h3>

                      <p className="mt-1 text-sm leading-6 text-gray-500">
                        Replace the current image
                        or keep it unchanged.
                      </p>
                    </div>
                  </div>

                  <ImageUploader
                    bucket="products"
                    value={formData.image}
                    onChange={(url) =>
                      updateField("image", url)
                    }
                  />

                  {formData.image && (
                    <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-4">
                      <p className="font-semibold text-green-800">
                        Image ready
                      </p>

                      <p className="mt-1 text-sm leading-6 text-green-700">
                        This image will be saved
                        with the product.
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
                    disabled={
                      categories.length === 0
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