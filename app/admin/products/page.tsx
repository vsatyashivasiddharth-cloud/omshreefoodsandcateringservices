"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import Image from "next/image";
import {
  AlertTriangle,
  Edit3,
  ImageOff,
  Package,
  Scale,
  Star,
  Store,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import AddProductModal from "@/components/admin/AddProductModal";
import EditProductModal from "@/components/admin/EditProductModal";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";

interface ProductVariant {
  id: string;
  label: string;
  weightGrams: number;
  shippingWeightGrams: number;
  price: number;
  stock: number;
  sku: string | null;
  isActive: boolean;
  isDefault: boolean;
  sortOrder: number;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;

  /*
   * These legacy/default fields are
   * still returned by the API and are
   * kept as fallback values.
   */
  price: number;
  stock: number;
  shippingWeightGrams: number;

  featured: boolean;
  image: string | null;
  categoryId: string;

  category: {
    id: string;
    name: string;
  };

  variants: ProductVariant[];
}

interface ApiError {
  error?: string;
  message?: string;
  archived?: boolean;
}

interface StatCardProps {
  title: string;
  value: number;
  icon: ReactNode;
}

function StatCard({
  title,
  value,
  icon,
}: StatCardProps) {
  return (
    <Card
      variant="outlined"
      padding="lg"
      className="shadow-sm"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-wider text-gray-500">
            {title}
          </p>

          <h2 className="mt-3 text-3xl font-bold text-[#6D2E00]">
            {value}
          </h2>
        </div>

        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#FFF4DE] text-[#C89B3C]">
          {icon}
        </div>
      </div>
    </Card>
  );
}

function normalizeNonNegativeNumber(
  value: unknown,
) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.max(0, number);
}

function normalizeNonNegativeInteger(
  value: unknown,
) {
  return Math.floor(
    normalizeNonNegativeNumber(
      value,
    ),
  );
}

function formatPrice(
  price: number,
) {
  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    },
  ).format(price);
}

function formatWeight(
  weightGrams: number,
) {
  if (
    !Number.isFinite(
      weightGrams,
    ) ||
    weightGrams <= 0
  ) {
    return "Not set";
  }

  if (weightGrams >= 1000) {
    const kilograms =
      weightGrams / 1000;

    return `${kilograms.toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      },
    )} kg`;
  }

  return `${weightGrams.toLocaleString(
    "en-IN",
  )} g`;
}

function getActiveVariants(
  product: Product,
) {
  return product.variants
    .filter(
      (variant) =>
        variant.isActive,
    )
    .sort(
      (first, second) =>
        first.sortOrder -
          second.sortOrder ||
        first.weightGrams -
          second.weightGrams,
    );
}

function productHasMissingWeight(
  product: Product,
) {
  const activeVariants =
    getActiveVariants(product);

  /*
   * Legacy fallback:
   * if a product somehow has no
   * active variants yet, use the
   * product-level mirror field.
   */
  if (
    activeVariants.length === 0
  ) {
    return (
      product.shippingWeightGrams <=
      0
    );
  }

  return activeVariants.some(
    (variant) =>
      variant.shippingWeightGrams <=
      0,
  );
}

function productHasLowStock(
  product: Product,
) {
  const activeVariants =
    getActiveVariants(product);

  if (
    activeVariants.length === 0
  ) {
    return (
      product.stock > 0 &&
      product.stock <= 10
    );
  }

  return activeVariants.some(
    (variant) =>
      variant.stock > 0 &&
      variant.stock <= 10,
  );
}

function getPriceSummary(
  product: Product,
) {
  const activeVariants =
    getActiveVariants(product);

  if (
    activeVariants.length === 0
  ) {
    return formatPrice(
      product.price,
    );
  }

  const prices =
    activeVariants.map(
      (variant) =>
        normalizeNonNegativeNumber(
          variant.price,
        ),
    );

  if (
    prices.length === 0
  ) {
    return formatPrice(
      product.price,
    );
  }

  const minimum =
    Math.min(...prices);

  const maximum =
    Math.max(...prices);

  if (minimum === maximum) {
    return formatPrice(
      minimum,
    );
  }

  return `${formatPrice(
    minimum,
  )} – ${formatPrice(
    maximum,
  )}`;
}

function getShippingWeightSummary(
  product: Product,
) {
  const activeVariants =
    getActiveVariants(product);

  if (
    activeVariants.length === 0
  ) {
    if (
      product.shippingWeightGrams <=
      0
    ) {
      return null;
    }

    return formatWeight(
      product.shippingWeightGrams,
    );
  }

  const validWeights =
    activeVariants
      .map(
        (variant) =>
          normalizeNonNegativeInteger(
            variant.shippingWeightGrams,
          ),
      )
      .filter(
        (weight) =>
          weight > 0,
      );

  if (
    validWeights.length === 0
  ) {
    return null;
  }

  const minimum =
    Math.min(
      ...validWeights,
    );

  const maximum =
    Math.max(
      ...validWeights,
    );

  if (minimum === maximum) {
    return formatWeight(
      minimum,
    );
  }

  return `${formatWeight(
    minimum,
  )} – ${formatWeight(
    maximum,
  )}`;
}

function getStockSummary(
  product: Product,
) {
  const activeVariants =
    getActiveVariants(product);

  if (
    activeVariants.length === 0
  ) {
    return {
      totalStock:
        product.stock,

      activeVariantCount: 0,

      outOfStock:
        product.stock <= 0,

      lowStock:
        product.stock > 0 &&
        product.stock <= 10,
    };
  }

  const totalStock =
    activeVariants.reduce(
      (
        total,
        variant,
      ) =>
        total +
        normalizeNonNegativeInteger(
          variant.stock,
        ),
      0,
    );

  const lowStock =
    activeVariants.some(
      (variant) => {
        const stock =
          normalizeNonNegativeInteger(
            variant.stock,
          );

        return (
          stock > 0 &&
          stock <= 10
        );
      },
    );

  return {
    totalStock,

    activeVariantCount:
      activeVariants.length,

    outOfStock:
      totalStock <= 0,

    lowStock,
  };
}

function normalizeProduct(
  product: Product,
): Product {
  return {
    ...product,

    price:
      normalizeNonNegativeNumber(
        product.price,
      ),

    stock:
      normalizeNonNegativeInteger(
        product.stock,
      ),

    shippingWeightGrams:
      normalizeNonNegativeInteger(
        product.shippingWeightGrams,
      ),

    variants:
      Array.isArray(
        product.variants,
      )
        ? product.variants.map(
            (variant) => ({
              ...variant,

              price:
                normalizeNonNegativeNumber(
                  variant.price,
                ),

              stock:
                normalizeNonNegativeInteger(
                  variant.stock,
                ),

              weightGrams:
                normalizeNonNegativeInteger(
                  variant.weightGrams,
                ),

              shippingWeightGrams:
                normalizeNonNegativeInteger(
                  variant.shippingWeightGrams,
                ),

              sortOrder:
                normalizeNonNegativeInteger(
                  variant.sortOrder,
                ),
            }),
          )
        : [],
  };
}

interface ProductThumbnailProps {
  image:
    | string
    | null
    | undefined;

  name: string;
}

function ProductThumbnail({
  image,
  name,
}: ProductThumbnailProps) {
  const normalizedImage =
    image?.trim() ?? "";

  const [
    imageFailed,
    setImageFailed,
  ] = useState(
    !normalizedImage,
  );

  useEffect(() => {
    setImageFailed(
      !normalizedImage,
    );
  }, [normalizedImage]);

  const showPlaceholder =
    !normalizedImage ||
    imageFailed;

  return (
    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-[#F3DFC2] bg-gradient-to-br from-[#FFF8EA] via-[#FFF4DE] to-[#FFE8BF]">
      {!showPlaceholder ? (
        <Image
          src={
            normalizedImage
          }
          alt={name}
          fill
          sizes="64px"
          className="object-cover"
          onError={() => {
            setImageFailed(
              true,
            );
          }}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <ImageOff
            size={25}
            className="text-[#C89B3C]"
            aria-hidden="true"
          />
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  const [
    products,
    setProducts,
  ] = useState<Product[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    deletingId,
    setDeletingId,
  ] = useState("");

  const [
    editingProductId,
    setEditingProductId,
  ] = useState("");

  const [
    editOpen,
    setEditOpen,
  ] = useState(false);

  const loadProducts =
    useCallback(async () => {
      try {
        setLoading(true);

        const response =
          await fetch(
            "/api/products",
            {
              cache:
                "no-store",
            },
          );

        const result:
          | Product[]
          | ApiError =
          await response.json();

        if (!response.ok) {
          throw new Error(
            Array.isArray(
              result,
            )
              ? "Failed to load products."
              : result.error ||
                  "Failed to load products.",
          );
        }

        if (
          !Array.isArray(
            result,
          )
        ) {
          throw new Error(
            "Invalid products response.",
          );
        }

        setProducts(
          result.map(
            normalizeProduct,
          ),
        );
      } catch (error) {
        console.error(
          "Products loading error:",
          error,
        );

        setProducts([]);

        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to load products.",
        );
      } finally {
        setLoading(false);
      }
    }, []);

  async function deleteProduct(
    product: Product,
  ) {
    const confirmed =
      window.confirm(
        `Remove "${product.name}" from the store? If it belongs to an existing order, its historical order data will be preserved.`,
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(
        product.id,
      );

      const response =
        await fetch(
          `/api/products/${product.id}`,
          {
            method:
              "DELETE",
          },
        );

      const result:
        ApiError =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Failed to delete product.",
        );
      }

      setProducts(
        (
          currentProducts,
        ) =>
          currentProducts.filter(
            (
              currentProduct,
            ) =>
              currentProduct.id !==
              product.id,
          ),
      );

      toast.success(
        result.message ||
          "Product removed successfully.",
      );
    } catch (error) {
      console.error(
        "Product deletion error:",
        error,
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete product.",
      );
    } finally {
      setDeletingId("");
    }
  }

  function openEditModal(
    productId: string,
  ) {
    setEditingProductId(
      productId,
    );

    setEditOpen(true);
  }

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const stats =
    useMemo(
      () => ({
        total:
          products.length,

        featured:
          products.filter(
            (product) =>
              product.featured,
          ).length,

        lowStock:
          products.filter(
            productHasLowStock,
          ).length,

        missingWeight:
          products.filter(
            productHasMissingWeight,
          ).length,
      }),
      [products],
    );

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-[#FFFDF8] via-white to-[#FFF6E9]">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
          <div className="mb-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <span className="inline-flex rounded-full bg-[#FFF4DE] px-4 py-2 text-sm font-semibold text-[#A66A00]">
                Products Management
              </span>

              <h1 className="mt-4 text-4xl font-bold text-[#6D2E00]">
                Products
              </h1>

              <p className="mt-2 max-w-2xl text-gray-600">
                Manage inventory,
                variant pricing,
                stock, packed
                shipping weights
                and featured
                products.
              </p>
            </div>

            <AddProductModal
              onSuccess={() =>
                void loadProducts()
              }
            />
          </div>

          {/* Stats */}

          <div className="mb-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Products"
              value={
                stats.total
              }
              icon={
                <Package
                  size={24}
                  aria-hidden="true"
                />
              }
            />

            <StatCard
              title="Featured"
              value={
                stats.featured
              }
              icon={
                <Star
                  size={24}
                  aria-hidden="true"
                />
              }
            />

            <StatCard
              title="Low Stock"
              value={
                stats.lowStock
              }
              icon={
                <AlertTriangle
                  size={24}
                  aria-hidden="true"
                />
              }
            />

            <StatCard
              title="Missing Weight"
              value={
                stats.missingWeight
              }
              icon={
                <Scale
                  size={24}
                  aria-hidden="true"
                />
              }
            />
          </div>

          <Card
            padding="none"
            className="overflow-hidden shadow-sm"
          >
            {loading ? (
              <div className="flex min-h-80 items-center justify-center">
                <Spinner
                  size="lg"
                  text="Loading products..."
                />
              </div>
            ) : products.length ===
              0 ? (
              <div className="p-16 text-center">
                <Package
                  size={52}
                  className="mx-auto mb-4 text-[#C89B3C]"
                  aria-hidden="true"
                />

                <h2 className="text-2xl font-bold text-[#6D2E00]">
                  No Products Found
                </h2>

                <p className="mt-2 text-gray-500">
                  Add your first
                  product to start
                  selling.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1180px]">
                  <thead className="bg-[#FFF8EE]">
                    <tr>
                      <th className="px-6 py-5 text-left text-sm font-semibold uppercase tracking-wider text-gray-500">
                        Product
                      </th>

                      <th className="px-6 py-5 text-left text-sm font-semibold uppercase tracking-wider text-gray-500">
                        Category
                      </th>

                      <th className="px-6 py-5 text-left text-sm font-semibold uppercase tracking-wider text-gray-500">
                        Price
                      </th>

                      <th className="px-6 py-5 text-left text-sm font-semibold uppercase tracking-wider text-gray-500">
                        Packed Weight
                      </th>

                      <th className="px-6 py-5 text-left text-sm font-semibold uppercase tracking-wider text-gray-500">
                        Stock
                      </th>

                      <th className="px-6 py-5 text-left text-sm font-semibold uppercase tracking-wider text-gray-500">
                        Featured
                      </th>

                      <th className="px-6 py-5 text-center text-sm font-semibold uppercase tracking-wider text-gray-500">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#F3DFC2]">
                    {products.map(
                      (product) => {
                        const activeVariants =
                          getActiveVariants(
                            product,
                          );

                        const shippingWeightSummary =
                          getShippingWeightSummary(
                            product,
                          );

                        const hasMissingWeight =
                          productHasMissingWeight(
                            product,
                          );

                        const stockSummary =
                          getStockSummary(
                            product,
                          );

                        return (
                          <tr
                            key={
                              product.id
                            }
                            className="transition hover:bg-[#FFFDF8]"
                          >
                            {/* Product */}

                            <td className="px-6 py-5">
                              <div className="flex min-w-[270px] items-center gap-4">
                                <ProductThumbnail
                                  image={
                                    product.image
                                  }
                                  name={
                                    product.name
                                  }
                                />

                                <div className="min-w-0">
                                  <p className="font-semibold text-[#6D2E00]">
                                    {
                                      product.name
                                    }
                                  </p>

                                  <p className="mt-1 max-w-[240px] truncate text-sm text-gray-500">
                                    {
                                      product.description
                                    }
                                  </p>

                                  <div className="mt-1 flex flex-wrap items-center gap-2">
                                    <p className="text-xs text-gray-400">
                                      /
                                      {
                                        product.slug
                                      }
                                    </p>

                                    {activeVariants.length >
                                      0 && (
                                      <span className="text-xs font-medium text-[#A66A00]">
                                        {
                                          activeVariants.length
                                        }{" "}
                                        active{" "}
                                        {activeVariants.length ===
                                        1
                                          ? "variant"
                                          : "variants"}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Category */}

                            <td className="px-6 py-5">
                              <Badge
                                variant="warning"
                                rounded
                              >
                                {product
                                  .category
                                  ?.name ||
                                  "Uncategorized"}
                              </Badge>
                            </td>

                            {/* Price */}

                            <td className="whitespace-nowrap px-6 py-5">
                              <p className="font-semibold text-[#6D2E00]">
                                {getPriceSummary(
                                  product,
                                )}
                              </p>

                              {activeVariants.length >
                                1 && (
                                <p className="mt-1 text-xs text-gray-500">
                                  Variant range
                                </p>
                              )}
                            </td>

                            {/* Shipping weight */}

                            <td className="whitespace-nowrap px-6 py-5">
                              {shippingWeightSummary ? (
                                <div>
                                  <div className="flex items-center gap-2">
                                    <Scale
                                      size={
                                        17
                                      }
                                      className="text-[#C89B3C]"
                                      aria-hidden="true"
                                    />

                                    <span className="font-semibold text-[#6D2E00]">
                                      {
                                        shippingWeightSummary
                                      }
                                    </span>
                                  </div>

                                  {hasMissingWeight && (
                                    <div className="mt-2">
                                      <Badge
                                        variant="danger"
                                        size="sm"
                                      >
                                        Some
                                        missing
                                      </Badge>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <Badge variant="danger">
                                  Not set
                                </Badge>
                              )}
                            </td>

                            {/* Stock */}

                            <td className="px-6 py-5">
                              {stockSummary.outOfStock ? (
                                <Badge variant="danger">
                                  Out of
                                  stock
                                </Badge>
                              ) : stockSummary.lowStock ? (
                                <div>
                                  <Badge variant="warning">
                                    {
                                      stockSummary.totalStock
                                    }{" "}
                                    total
                                  </Badge>

                                  {stockSummary.activeVariantCount >
                                    1 && (
                                    <p className="mt-1 text-xs text-gray-500">
                                      Across{" "}
                                      {
                                        stockSummary.activeVariantCount
                                      }{" "}
                                      variants
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <div>
                                  <Badge variant="success">
                                    {
                                      stockSummary.totalStock
                                    }{" "}
                                    available
                                  </Badge>

                                  {stockSummary.activeVariantCount >
                                    1 && (
                                    <p className="mt-1 text-xs text-gray-500">
                                      Across{" "}
                                      {
                                        stockSummary.activeVariantCount
                                      }{" "}
                                      variants
                                    </p>
                                  )}
                                </div>
                              )}
                            </td>

                            {/* Featured */}

                            <td className="px-6 py-5">
                              <Badge
                                variant={
                                  product.featured
                                    ? "primary"
                                    : "neutral"
                                }
                              >
                                {product.featured
                                  ? "Featured"
                                  : "Standard"}
                              </Badge>
                            </td>

                            {/* Actions */}

                            <td className="px-6 py-5">
                              <div className="flex items-center justify-center gap-3">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  leftIcon={
                                    <Edit3
                                      size={
                                        16
                                      }
                                      aria-hidden="true"
                                    />
                                  }
                                  onClick={() =>
                                    openEditModal(
                                      product.id,
                                    )
                                  }
                                >
                                  Edit
                                </Button>

                                <Button
                                  type="button"
                                  size="sm"
                                  variant="danger"
                                  loading={
                                    deletingId ===
                                    product.id
                                  }
                                  leftIcon={
                                    <Trash2
                                      size={
                                        16
                                      }
                                      aria-hidden="true"
                                    />
                                  }
                                  onClick={() =>
                                    void deleteProduct(
                                      product,
                                    )
                                  }
                                >
                                  Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      },
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card
            variant="filled"
            padding="md"
            className="mt-6 shadow-none"
          >
            <div className="flex items-start gap-3">
              <Store
                size={20}
                className="mt-0.5 shrink-0 text-[#C89B3C]"
                aria-hidden="true"
              />

              <div>
                <p className="font-semibold text-[#6D2E00]">
                  Variant-aware
                  inventory
                </p>

                <p className="mt-1 text-sm leading-6 text-gray-500">
                  Prices, stock and
                  packed shipping
                  weights shown above
                  are calculated from
                  active package
                  variants. Legacy
                  product fields are
                  used only when a
                  product has no
                  active variants.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <EditProductModal
        productId={
          editingProductId
        }
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          setEditingProductId(
            "",
          );
        }}
        onSuccess={() =>
          void loadProducts()
        }
      />
    </>
  );
}