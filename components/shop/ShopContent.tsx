"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import {
  Package2,
  PackageSearch,
  RefreshCw,
} from "lucide-react";

import type {
  ProductVariant,
  ProductWithCategory,
} from "@/types/product";

import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import SectionHeader from "@/components/ui/SectionHeader";
import Spinner from "@/components/ui/Spinner";

import ProductFilters from "./ProductFilters";
import ProductGrid from "./ProductGrid";
import SearchBar from "./SearchBar";
import SortDropdown from "./SortDropdown";

const PRODUCTS_PER_PAGE = 6;

interface ApiError {
  error?: string;
  message?: string;
}

interface RawCategory {
  id: string;
  name: string;
  slug: string;
  image: string | null;
}

interface RawVariant {
  id: string;
  label: string;
  weightGrams: unknown;
  shippingWeightGrams: unknown;
  price: unknown;
  stock: unknown;
  sku: string | null;
  isActive: boolean;
  isDefault: boolean;
  sortOrder: unknown;
}

interface RawProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: unknown;
  image: string | null;
  stock: unknown;
  featured: boolean;
  shippingWeightGrams: unknown;
  categoryId: string;
  category: RawCategory;
  variants?: RawVariant[];
  createdAt?: string;
  updatedAt?: string;
}

interface CategoryRecord {
  id: string;
  name: string;
  slug: string;
}

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

function isRecord(
  value: unknown,
): value is Record<
  string,
  unknown
> {
  return (
    value !== null &&
    typeof value ===
      "object" &&
    !Array.isArray(value)
  );
}

function isRawCategory(
  value: unknown,
): value is RawCategory {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id ===
      "string" &&
    typeof value.name ===
      "string" &&
    typeof value.slug ===
      "string" &&
    (typeof value.image ===
      "string" ||
      value.image === null)
  );
}

function isRawVariant(
  value: unknown,
): value is RawVariant {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id ===
      "string" &&
    typeof value.label ===
      "string" &&
    (typeof value.sku ===
      "string" ||
      value.sku === null) &&
    typeof value.isActive ===
      "boolean" &&
    typeof value.isDefault ===
      "boolean"
  );
}

function isRawProduct(
  value: unknown,
): value is RawProduct {
  if (!isRecord(value)) {
    return false;
  }

  const variants =
    value.variants;

  return (
    typeof value.id ===
      "string" &&
    typeof value.name ===
      "string" &&
    typeof value.slug ===
      "string" &&
    typeof value.description ===
      "string" &&
    typeof value.featured ===
      "boolean" &&
    typeof value.categoryId ===
      "string" &&
    isRawCategory(
      value.category,
    ) &&
    (variants === undefined ||
      (Array.isArray(variants) &&
        variants.every(
          isRawVariant,
        )))
  );
}

function normalizeNonNegativeNumber(
  value: unknown,
) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.max(
    0,
    number,
  );
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

function normalizeVariant(
  variant: RawVariant,
): ProductVariant {
  return {
    id: variant.id,
    label:
      variant.label.trim(),

    weightGrams:
      normalizeNonNegativeInteger(
        variant.weightGrams,
      ),

    shippingWeightGrams:
      normalizeNonNegativeInteger(
        variant
          .shippingWeightGrams,
      ),

    price:
      normalizeNonNegativeNumber(
        variant.price,
      ),

    stock:
      normalizeNonNegativeInteger(
        variant.stock,
      ),

    sku: variant.sku,

    isActive:
      variant.isActive,

    isDefault:
      variant.isDefault,

    sortOrder:
      normalizeNonNegativeInteger(
        variant.sortOrder,
      ),
  };
}

function normalizeProduct(
  product: RawProduct,
): ProductWithCategory {
  const variants =
    (product.variants ?? [])
      .filter(
        (variant) =>
          variant.isActive,
      )
      .map(
        normalizeVariant,
      )
      .sort(
        (first, second) =>
          first.sortOrder -
            second.sortOrder ||
          first.weightGrams -
            second.weightGrams,
      );

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,

    description:
      product.description,

    price:
      normalizeNonNegativeNumber(
        product.price,
      ),

    image:
      product.image ||
      "/images/no-image.jpg",

    stock:
      normalizeNonNegativeInteger(
        product.stock,
      ),

    featured:
      product.featured,

    shippingWeightGrams:
      normalizeNonNegativeInteger(
        product
          .shippingWeightGrams,
      ),

    categoryId:
      product.categoryId,

    category: {
      id:
        product.category.id,

      name:
        product.category.name,

      slug:
        product.category.slug ||
        createSlug(
          product.category.name,
        ),

      image:
        product.category.image,
    },

    variants,

    createdAt:
      product.createdAt,

    updatedAt:
      product.updatedAt,
  };
}

function getLowestPrice(
  product: ProductWithCategory,
) {
  const prices =
    (product.variants ?? [])
      .filter(
        (variant) =>
          variant.isActive,
      )
      .map(
        (variant) =>
          Number(
            variant.price,
          ),
      )
      .filter(
        (price) =>
          Number.isFinite(
            price,
          ) &&
          price >= 0,
      );

  if (prices.length === 0) {
    return product.price;
  }

  return Math.min(...prices);
}

export default function ShopContent() {
  const router =
    useRouter();

  const pathname =
    usePathname();

  const searchParams =
    useSearchParams();

  const [
    products,
    setProducts,
  ] = useState<
    ProductWithCategory[]
  >([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    loadError,
    setLoadError,
  ] = useState<
    string | null
  >(null);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    category,
    setCategory,
  ] = useState("All");

  const [
    sort,
    setSort,
  ] = useState("default");

  const [
    visible,
    setVisible,
  ] = useState(
    PRODUCTS_PER_PAGE,
  );

  const loadMoreStartRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  const productsSectionRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  const pendingLoadMoreScrollTopRef =
    useRef<number | null>(null);

  const requestedCategorySlug =
    searchParams
      .get("category")
      ?.trim()
      .toLowerCase() ?? "";

  const loadProducts =
    useCallback(
      async (
        signal?: AbortSignal,
      ) => {
        setLoading(true);
        setLoadError(null);

        try {
          const response =
            await fetch(
              "/api/home/products",
              {
                method: "GET",
                cache: "no-store",
                signal,
              },
            );

          const data: unknown =
            await response
              .json()
              .catch(
                () => null,
              );

          if (!response.ok) {
            const apiError =
              isRecord(data)
                ? (data as ApiError)
                : null;

            throw new Error(
              apiError?.error ||
                apiError?.message ||
                "Failed to fetch products.",
            );
          }

          if (
            !Array.isArray(data)
          ) {
            throw new Error(
              "The products response was invalid.",
            );
          }

          setProducts(
            data
              .filter(
                isRawProduct,
              )
              .map(
                normalizeProduct,
              ),
          );
        } catch (error) {
          if (
            error instanceof
              DOMException &&
            error.name ===
              "AbortError"
          ) {
            return;
          }

          console.error(
            "Failed to load shop products:",
            error,
          );

          setProducts([]);

          setLoadError(
            error instanceof Error
              ? error.message
              : "Failed to load products.",
          );
        } finally {
          if (
            !signal?.aborted
          ) {
            setLoading(false);
          }
        }
      },
      [],
    );

  useEffect(() => {
    const controller =
      new AbortController();

    void loadProducts(
      controller.signal,
    );

    return () => {
      controller.abort();
    };
  }, [loadProducts]);

  const categoryRecords =
    useMemo<
      CategoryRecord[]
    >(() => {
      const categoryMap =
        new Map<
          string,
          CategoryRecord
        >();

      for (
        const product of
        products
      ) {
        const slug =
          product.category
            .slug ||
          createSlug(
            product.category
              .name,
          );

        if (
          !categoryMap.has(
            slug,
          )
        ) {
          categoryMap.set(
            slug,
            {
              id:
                product.category
                  .id,

              name:
                product.category
                  .name,

              slug,
            },
          );
        }
      }

      return Array.from(
        categoryMap.values(),
      ).sort(
        (
          firstCategory,
          secondCategory,
        ) =>
          firstCategory.name.localeCompare(
            secondCategory.name,
          ),
      );
    }, [products]);

  const categories =
    useMemo(
      () => [
        "All",

        ...categoryRecords.map(
          (
            categoryRecord,
          ) =>
            categoryRecord.name,
        ),
      ],
      [categoryRecords],
    );

  useEffect(() => {
    if (loading) {
      return;
    }

    if (
      !requestedCategorySlug
    ) {
      setCategory("All");

      setVisible(
        PRODUCTS_PER_PAGE,
      );

      return;
    }

    const matchingCategory =
      categoryRecords.find(
        (
          categoryRecord,
        ) =>
          categoryRecord.slug ===
          requestedCategorySlug,
      );

    setCategory(
      matchingCategory?.name ||
        "All",
    );

    setVisible(
      PRODUCTS_PER_PAGE,
    );
  }, [
    categoryRecords,
    loading,
    requestedCategorySlug,
  ]);

  function handleCategoryChange(
    value: string,
  ) {
    setCategory(value);

    setVisible(
      PRODUCTS_PER_PAGE,
    );

    const nextSearchParams =
      new URLSearchParams(
        searchParams.toString(),
      );

    if (value === "All") {
      nextSearchParams.delete(
        "category",
      );
    } else {
      const selectedCategory =
        categoryRecords.find(
          (
            categoryRecord,
          ) =>
            categoryRecord.name ===
            value,
        );

      nextSearchParams.set(
        "category",

        selectedCategory?.slug ||
          createSlug(value),
      );
    }

    const queryString =
      nextSearchParams.toString();

    router.replace(
      queryString
        ? `${pathname}?${queryString}`
        : pathname,
      {
        scroll: false,
      },
    );
  }

  function handleSearchChange(
    value: string,
  ) {
    setSearch(value);

    setVisible(
      PRODUCTS_PER_PAGE,
    );
  }

  function handleSearchSubmit() {
    if (!search.trim()) {
      return;
    }

    setVisible(
      PRODUCTS_PER_PAGE,
    );

    window.requestAnimationFrame(
      () => {
        productsSectionRef.current?.scrollIntoView({
          behavior: "auto",
          block: "start",
        });
      },
    );
  }

  function handleSortChange(
    value: string,
  ) {
    setSort(value);

    setVisible(
      PRODUCTS_PER_PAGE,
    );
  }

  const filteredProducts =
    useMemo(() => {
      const filteredList =
        products.filter(
          (product) => {
            if (
              category !==
                "All" &&
              product.category
                .name !==
                category
            ) {
              return false;
            }

            const normalizedSearch =
              search
                .trim()
                .toLowerCase();

            if (
              !normalizedSearch
            ) {
              return true;
            }

            return (
              product.name
                .toLowerCase()
                .includes(
                  normalizedSearch,
                ) ||
              product.description
                .toLowerCase()
                .includes(
                  normalizedSearch,
                ) ||
              product.category.name
                .toLowerCase()
                .includes(
                  normalizedSearch,
                )
            );
          },
        );

      switch (sort) {
        case "price-low":
          filteredList.sort(
            (
              firstProduct,
              secondProduct,
            ) =>
              getLowestPrice(
                firstProduct,
              ) -
              getLowestPrice(
                secondProduct,
              ),
          );

          break;

        case "price-high":
          filteredList.sort(
            (
              firstProduct,
              secondProduct,
            ) =>
              getLowestPrice(
                secondProduct,
              ) -
              getLowestPrice(
                firstProduct,
              ),
          );

          break;

        case "name":
          filteredList.sort(
            (
              firstProduct,
              secondProduct,
            ) =>
              firstProduct.name.localeCompare(
                secondProduct.name,
              ),
          );

          break;

        default:
          break;
      }

      return filteredList;
    }, [
      category,
      products,
      search,
      sort,
    ]);

  const displayedProducts =
    filteredProducts.slice(
      0,
      visible,
    );

  function handleLoadMore() {
    const loadMoreStart =
      loadMoreStartRef.current;

    if (loadMoreStart) {
      pendingLoadMoreScrollTopRef.current =
        window.scrollY +
        loadMoreStart.getBoundingClientRect()
          .top;
    } else {
      pendingLoadMoreScrollTopRef.current =
        null;
    }

    setVisible(
      (currentVisible) =>
        Math.min(
          currentVisible +
            PRODUCTS_PER_PAGE,
          filteredProducts.length,
        ),
    );
  }

  useEffect(() => {
    const targetScrollTop =
      pendingLoadMoreScrollTopRef.current;

    if (targetScrollTop === null) {
      return;
    }

    pendingLoadMoreScrollTopRef.current =
      null;

    window.requestAnimationFrame(
      () => {
        window.scrollTo({
          top: Math.max(
            0,
            targetScrollTop - 24,
          ),
          behavior: "smooth",
        });
      },
    );
  }, [visible]);

  const selectedCategoryMissing =
    Boolean(
      requestedCategorySlug,
    ) &&
    category === "All" &&
    !categoryRecords.some(
      (
        categoryRecord,
      ) =>
        categoryRecord.slug ===
        requestedCategorySlug,
    );

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner
          size="lg"
          text="Loading our delicious products..."
        />
      </div>
    );
  }

  if (loadError) {
    return (
      <Card
        variant="outlined"
        padding="lg"
        className="text-center"
      >
        <PackageSearch
          size={48}
          className="mx-auto text-[#C89B3C]"
          aria-hidden="true"
        />

        <h2 className="mt-4 text-2xl font-bold text-[#6D2E00]">
          Unable to Load
          Products
        </h2>

        <p className="mt-2 text-gray-600">
          {loadError}
        </p>

        <Button
          type="button"
          variant="primary"
          leftIcon={
            <RefreshCw
              size={17}
              aria-hidden="true"
            />
          }
          className="mt-6"
          onClick={() =>
            void loadProducts()
          }
        >
          Try Again
        </Button>
      </Card>
    );
  }

  return (
    <section className="space-y-10">
      <Card padding="md">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <SearchBar
            value={search}
            onChange={
              handleSearchChange
            }
            onSubmit={
              handleSearchSubmit
            }
          />

          <SortDropdown
            value={sort}
            onChange={
              handleSortChange
            }
          />
        </div>
      </Card>

      <ProductFilters
        categories={
          categories
        }
        selected={category}
        onChange={
          handleCategoryChange
        }
      />

      <div
        ref={productsSectionRef}
        className="scroll-mt-28 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
      >
        <SectionHeader
          title={
            category === "All"
              ? "Explore Our Products"
              : category
          }
          description={
            category === "All"
              ? "Authentic homemade snacks, sweets, pickles and more."
              : `Explore all products available in ${category}.`
          }
          align="left"
        />

        <Badge
          variant="secondary"
          className="inline-flex self-start gap-2 px-5 py-3 text-base md:self-auto"
        >
          <Package2
            size={18}
            aria-hidden="true"
          />

          {
            filteredProducts.length
          }{" "}
          {filteredProducts.length ===
          1
            ? "Product"
            : "Products"}
        </Badge>
      </div>

      {displayedProducts.length >
      0 ? (
        <>
          <ProductGrid
            products={
              displayedProducts
            }
          />

          <div
            ref={loadMoreStartRef}
            aria-hidden="true"
            className="h-px"
          />
        </>
      ) : (
        <EmptyState
          icon={
            <PackageSearch
              size={48}
              aria-hidden="true"
            />
          }
          title="No Products Found"
          description={
            selectedCategoryMissing
              ? "The selected category could not be found."
              : "Try changing your search or selecting a different category."
          }
        />
      )}

      {visible <
        filteredProducts.length && (
        <div className="pt-6 text-center">
          <Button
            type="button"
            variant="primary"
            onClick={
              handleLoadMore
            }
          >
            Load More Products
          </Button>
        </div>
      )}
    </section>
  );
}