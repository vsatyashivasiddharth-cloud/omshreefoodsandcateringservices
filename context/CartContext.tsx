"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type {
  CartContextType,
  CartItem,
  Product,
} from "@/types/cart";

const STORAGE_KEY = "cart";

const CartContext = createContext<
  CartContextType | undefined
>(undefined);

interface CartProviderProps {
  children: ReactNode;
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function normalizeString(
  value: unknown,
) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function normalizeNullableString(
  value: unknown,
) {
  const normalized =
    normalizeString(value);

  return normalized || null;
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
    normalizeNonNegativeNumber(value),
  );
}

function createLineId(
  productId: string,
  variantId: string | null,
) {
  return `${productId}:${
    variantId ?? "legacy"
  }`;
}

function normalizeStoredCartItem(
  value: unknown,
): CartItem | null {
  if (!isRecord(value)) {
    return null;
  }

  const category = value.category;

  if (!isRecord(category)) {
    return null;
  }

  /*
   * Old cart entries used `id` as the product ID
   * and did not contain productId, variantId or
   * lineId. Those entries become legacy/default
   * variant lines instead of being discarded.
   */
  const productId =
    normalizeString(
      value.productId,
    ) ||
    normalizeString(value.id);

  const variantId =
    normalizeNullableString(
      value.variantId,
    );

  const lineId =
    normalizeString(value.lineId) ||
    createLineId(
      productId,
      variantId,
    );

  const name =
    normalizeString(value.name);

  const slug =
    normalizeString(value.slug);

  const description =
    typeof value.description ===
    "string"
      ? value.description
      : "";

  const price =
    normalizeNonNegativeNumber(
      value.price,
    );

  const stock =
    normalizeNonNegativeInteger(
      value.stock,
    );

  const quantity =
    normalizeNonNegativeInteger(
      value.quantity,
    );

  const shippingWeightGrams =
    normalizeNonNegativeInteger(
      value.shippingWeightGrams,
    );

  const categoryId =
    normalizeString(
      category.id,
    );

  const categoryName =
    normalizeString(
      category.name,
    );

  if (
    !productId ||
    !lineId ||
    !name ||
    !slug ||
    !categoryId ||
    !categoryName ||
    stock < 1 ||
    quantity < 1
  ) {
    return null;
  }

  return {
    lineId,
    productId,

    /*
     * Keep id as the product ID for compatibility
     * with existing display components.
     */
    id: productId,

    name,
    slug,
    description,
    price,

    image:
      normalizeString(
        value.image,
      ) ||
      "/images/no-image.jpg",

    stock,

    featured:
      value.featured === true,

    shippingWeightGrams,

    categoryId:
      normalizeString(
        value.categoryId,
      ) ||
      categoryId,

    category: {
      id: categoryId,
      name: categoryName,

      slug:
        normalizeString(
          category.slug,
        ) || undefined,

      image:
        typeof category.image ===
          "string" ||
        category.image === null
          ? category.image
          : undefined,
    },

    variantId,

    variantLabel:
      normalizeNullableString(
        value.variantLabel,
      ),

    variantSku:
      normalizeNullableString(
        value.variantSku,
      ),

    variantWeightGrams:
      value.variantWeightGrams ===
        null ||
      value.variantWeightGrams ===
        undefined
        ? null
        : normalizeNonNegativeInteger(
            value.variantWeightGrams,
          ),

    quantity: Math.min(
      quantity,
      stock,
    ),
  };
}

function normalizeStoredCart(
  value: unknown,
): CartItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const itemByLineId =
    new Map<string, CartItem>();

  for (const rawItem of value) {
    const item =
      normalizeStoredCartItem(
        rawItem,
      );

    if (!item) {
      continue;
    }

    const existing =
      itemByLineId.get(
        item.lineId,
      );

    if (!existing) {
      itemByLineId.set(
        item.lineId,
        item,
      );

      continue;
    }

    itemByLineId.set(
      item.lineId,
      {
        ...item,

        quantity: Math.min(
          existing.quantity +
            item.quantity,
          item.stock,
        ),
      },
    );
  }

  return Array.from(
    itemByLineId.values(),
  );
}

function normalizeProduct(
  product: Product,
): CartItem | null {
  const productId =
    normalizeString(product.id);

  const name =
    normalizeString(product.name);

  const slug =
    normalizeString(product.slug);

  const categoryId =
    normalizeString(
      product.category?.id,
    );

  const categoryName =
    normalizeString(
      product.category?.name,
    );

  const price =
    Number(product.price);

  const stock =
    normalizeNonNegativeInteger(
      product.stock,
    );

  const shippingWeightGrams =
    normalizeNonNegativeInteger(
      product.shippingWeightGrams,
    );

  const variantId =
    normalizeNullableString(
      product.variantId,
    );

  if (
    !productId ||
    !name ||
    !slug ||
    !categoryId ||
    !categoryName ||
    !Number.isFinite(price) ||
    price < 0 ||
    stock < 1
  ) {
    return null;
  }

  return {
    lineId: createLineId(
      productId,
      variantId,
    ),

    productId,
    id: productId,

    name,
    slug,

    description:
      product.description || "",

    price,

    image:
      product.image ||
      "/images/no-image.jpg",

    stock,

    featured:
      product.featured,

    shippingWeightGrams,

    categoryId:
      product.categoryId ||
      categoryId,

    category: {
      id: categoryId,
      name: categoryName,

      slug:
        product.category.slug,

      image:
        product.category.image,
    },

    variantId,

    variantLabel:
      normalizeNullableString(
        product.variantLabel,
      ),

    variantSku:
      normalizeNullableString(
        product.variantSku,
      ),

    variantWeightGrams:
      product.variantWeightGrams ===
        null ||
      product.variantWeightGrams ===
        undefined
        ? null
        : normalizeNonNegativeInteger(
            product.variantWeightGrams,
          ),

    quantity: 1,
  };
}

export function CartProvider({
  children,
}: CartProviderProps) {
  const [cart, setCart] =
    useState<CartItem[]>([]);

  const [hydrated, setHydrated] =
    useState(false);

  useEffect(() => {
    try {
      const storedCart =
        window.localStorage.getItem(
          STORAGE_KEY,
        );

      if (storedCart) {
        const parsedCart: unknown =
          JSON.parse(storedCart);

        setCart(
          normalizeStoredCart(
            parsedCart,
          ),
        );
      }
    } catch (error) {
      console.error(
        "Failed to restore cart:",
        error,
      );

      setCart([]);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(cart),
      );
    } catch (error) {
      console.error(
        "Failed to save cart:",
        error,
      );
    }
  }, [
    cart,
    hydrated,
  ]);

  const addToCart =
    useCallback(
      (
        product: Product,
        quantity = 1,
      ) => {
        const normalizedProduct =
          normalizeProduct(
            product,
          );

        if (!normalizedProduct) {
          return;
        }

        const requestedQuantity =
          Math.max(
            1,
            Math.floor(
              Number(quantity) || 1,
            ),
          );

        setCart(
          (previousCart) => {
            const existingItem =
              previousCart.find(
                (item) =>
                  item.lineId ===
                  normalizedProduct.lineId,
              );

            if (existingItem) {
              return previousCart.map(
                (item) => {
                  if (
                    item.lineId !==
                    normalizedProduct.lineId
                  ) {
                    return item;
                  }

                  return {
                    ...item,
                    ...normalizedProduct,

                    quantity:
                      Math.min(
                        item.quantity +
                          requestedQuantity,
                        normalizedProduct.stock,
                      ),
                  };
                },
              );
            }

            return [
              ...previousCart,
              {
                ...normalizedProduct,

                quantity:
                  Math.min(
                    requestedQuantity,
                    normalizedProduct.stock,
                  ),
              },
            ];
          },
        );
      },
      [],
    );

  const removeFromCart =
    useCallback(
      (lineId: string) => {
        setCart(
          (previousCart) =>
            previousCart.filter(
              (item) =>
                item.lineId !==
                lineId,
            ),
        );
      },
      [],
    );

  const increaseQuantity =
    useCallback(
      (lineId: string) => {
        setCart(
          (previousCart) =>
            previousCart.map(
              (item) => {
                if (
                  item.lineId !==
                    lineId ||
                  item.quantity >=
                    item.stock
                ) {
                  return item;
                }

                return {
                  ...item,
                  quantity:
                    item.quantity +
                    1,
                };
              },
            ),
        );
      },
      [],
    );

  const decreaseQuantity =
    useCallback(
      (lineId: string) => {
        setCart(
          (previousCart) =>
            previousCart.flatMap(
              (item) => {
                if (
                  item.lineId !==
                  lineId
                ) {
                  return [item];
                }

                if (
                  item.quantity <= 1
                ) {
                  return [];
                }

                return [
                  {
                    ...item,
                    quantity:
                      item.quantity -
                      1,
                  },
                ];
              },
            ),
        );
      },
      [],
    );

  const clearCart =
    useCallback(() => {
      setCart([]);
    }, []);

  const totalItems =
    useMemo(
      () =>
        cart.reduce(
          (total, item) =>
            total +
            item.quantity,
          0,
        ),
      [cart],
    );

  const totalPrice =
    useMemo(
      () =>
        cart.reduce(
          (total, item) =>
            total +
            item.price *
              item.quantity,
          0,
        ),
      [cart],
    );

  const totalShippingWeightGrams =
    useMemo(
      () =>
        cart.reduce(
          (total, item) =>
            total +
            item
              .shippingWeightGrams *
              item.quantity,
          0,
        ),
      [cart],
    );

  const value =
    useMemo<CartContextType>(
      () => ({
        cart,
        addToCart,
        removeFromCart,
        increaseQuantity,
        decreaseQuantity,
        clearCart,
        totalItems,
        totalPrice,
        totalShippingWeightGrams,
      }),
      [
        cart,
        addToCart,
        removeFromCart,
        increaseQuantity,
        decreaseQuantity,
        clearCart,
        totalItems,
        totalPrice,
        totalShippingWeightGrams,
      ],
    );

  return (
    <CartContext.Provider
      value={value}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context =
    useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart must be used inside CartProvider.",
    );
  }

  return context;
}