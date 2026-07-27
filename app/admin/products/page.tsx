"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Image from "next/image";
import {
  AlertTriangle,
  Edit3,
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

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  featured: boolean;
  image: string | null;
  shippingWeightGrams: number;
  categoryId: string;
  category: {
    id: string;
    name: string;
  };
}

interface ApiError {
  error?: string;
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
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

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
}

function formatWeight(
  weightGrams: number,
) {
  if (
    !Number.isFinite(weightGrams) ||
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

export default function ProductsPage() {
  const [products, setProducts] =
    useState<Product[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [deletingId, setDeletingId] =
    useState("");

  const [
    editingProductId,
    setEditingProductId,
  ] = useState("");

  const [editOpen, setEditOpen] =
    useState(false);

  const loadProducts =
    useCallback(async () => {
      try {
        setLoading(true);

        const response = await fetch(
          "/api/products",
          {
            cache: "no-store",
          },
        );

        const result:
          | Product[]
          | ApiError =
          await response.json();

        if (!response.ok) {
          throw new Error(
            Array.isArray(result)
              ? "Failed to load products."
              : result.error ||
                  "Failed to load products.",
          );
        }

        if (!Array.isArray(result)) {
          throw new Error(
            "Invalid products response.",
          );
        }

        setProducts(
          result.map((product) => ({
            ...product,
            price: Number(
              product.price,
            ),
            stock: Math.max(
              0,
              Math.floor(
                Number(product.stock) ||
                  0,
              ),
            ),
            shippingWeightGrams:
              Math.max(
                0,
                Math.floor(
                  Number(
                    product.shippingWeightGrams,
                  ) || 0,
                ),
              ),
          })),
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
        `Delete "${product.name}"? This action cannot be undone.`,
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(product.id);

      const response = await fetch(
        `/api/products/${product.id}`,
        {
          method: "DELETE",
        },
      );

      const result: ApiError =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Failed to delete product.",
        );
      }

      setProducts(
        (currentProducts) =>
          currentProducts.filter(
            (currentProduct) =>
              currentProduct.id !==
              product.id,
          ),
      );

      toast.success(
        "Product deleted successfully.",
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
    setEditingProductId(productId);
    setEditOpen(true);
  }

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const stats = useMemo(
    () => ({
      total: products.length,

      featured: products.filter(
        (product) =>
          product.featured,
      ).length,

      lowStock: products.filter(
        (product) =>
          product.stock > 0 &&
          product.stock <= 10,
      ).length,

      missingWeight:
        products.filter(
          (product) =>
            product.shippingWeightGrams <=
            0,
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
                pricing, stock,
                shipping weights and
                featured products.
              </p>
            </div>

            <AddProductModal
              onSuccess={() =>
                void loadProducts()
              }
            />
          </div>

          <div className="mb-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Products"
              value={stats.total}
              icon={
                <Package
                  size={24}
                  aria-hidden="true"
                />
              }
            />

            <StatCard
              title="Featured"
              value={stats.featured}
              icon={
                <Star
                  size={24}
                  aria-hidden="true"
                />
              }
            />

            <StatCard
              title="Low Stock"
              value={stats.lowStock}
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
                <table className="w-full min-w-[1120px]">
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
                        Shipping
                        Weight
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
                      (product) => (
                        <tr
                          key={
                            product.id
                          }
                          className="transition hover:bg-[#FFFDF8]"
                        >
                          <td className="px-6 py-5">
                            <div className="flex min-w-[250px] items-center gap-4">
                              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-[#F3DFC2] bg-[#FFF4DE]">
                                {product.image ? (
                                  <Image
                                    src={
                                      product.image
                                    }
                                    alt={
                                      product.name
                                    }
                                    fill
                                    sizes="64px"
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full items-center justify-center text-[#C89B3C]">
                                    <Package
                                      size={
                                        26
                                      }
                                      aria-hidden="true"
                                    />
                                  </div>
                                )}
                              </div>

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

                                <p className="mt-1 text-xs text-gray-400">
                                  /
                                  {
                                    product.slug
                                  }
                                </p>
                              </div>
                            </div>
                          </td>

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

                          <td className="whitespace-nowrap px-6 py-5 font-semibold text-[#6D2E00]">
                            {formatPrice(
                              product.price,
                            )}
                          </td>

                          <td className="whitespace-nowrap px-6 py-5">
                            {product.shippingWeightGrams >
                            0 ? (
                              <div className="flex items-center gap-2">
                                <Scale
                                  size={
                                    17
                                  }
                                  className="text-[#C89B3C]"
                                  aria-hidden="true"
                                />

                                <span className="font-semibold text-[#6D2E00]">
                                  {formatWeight(
                                    product.shippingWeightGrams,
                                  )}
                                </span>
                              </div>
                            ) : (
                              <Badge variant="danger">
                                Not set
                              </Badge>
                            )}
                          </td>

                          <td className="px-6 py-5">
                            {product.stock ===
                            0 ? (
                              <Badge variant="danger">
                                Out of
                                stock
                              </Badge>
                            ) : product.stock <=
                              10 ? (
                              <Badge variant="warning">
                                {
                                  product.stock
                                }{" "}
                                left
                              </Badge>
                            ) : (
                              <Badge variant="success">
                                {
                                  product.stock
                                }{" "}
                                available
                              </Badge>
                            )}
                          </td>

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
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            )}
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
          setEditingProductId("");
        }}
        onSuccess={() =>
          void loadProducts()
        }
      />
    </>
  );
}