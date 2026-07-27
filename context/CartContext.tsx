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

function isStoredCartItem(
  value: unknown,
): value is CartItem {
  if (!isRecord(value)) {
    return false;
  }

  const category = value.category;

  if (!isRecord(category)) {
    return false;
  }

  const price = Number(value.price);
  const stock = Number(value.stock);
  const quantity = Number(value.quantity);

  const shippingWeightGrams =
    value.shippingWeightGrams === undefined
      ? 0
      : Number(value.shippingWeightGrams);

  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.slug === "string" &&
    typeof value.description === "string" &&
    Number.isFinite(price) &&
    price >= 0 &&
    typeof value.image === "string" &&
    Number.isFinite(stock) &&
    stock >= 0 &&
    typeof value.featured === "boolean" &&
    Number.isFinite(quantity) &&
    quantity >= 1 &&
    Number.isFinite(shippingWeightGrams) &&
    shippingWeightGrams >= 0 &&
    typeof category.id === "string" &&
    typeof category.name === "string"
  );
}

function normalizeStoredCart(
  value: unknown,
): CartItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isStoredCartItem)
    .map((item) => {
      const stock =
        normalizeNonNegativeInteger(
          item.stock,
        );

      return {
        id: item.id,
        name: item.name,
        slug: item.slug,
        description: item.description,
        price: normalizeNonNegativeNumber(
          item.price,
        ),
        image:
          item.image ||
          "/images/no-image.jpg",
        stock,
        featured: item.featured,
        shippingWeightGrams:
          normalizeNonNegativeInteger(
            item.shippingWeightGrams,
          ),
        categoryId: item.categoryId,
        category: {
          id: item.category.id,
          name: item.category.name,
          slug: item.category.slug,
          image: item.category.image,
        },
        quantity: Math.min(
          Math.max(
            1,
            Math.floor(
              Number(item.quantity) || 1,
            ),
          ),
          Math.max(1, stock),
        ),
      };
    })
    .filter((item) => item.stock > 0);
}

function normalizeProduct(
  product: Product,
): Product | null {
  const price = Number(product.price);

  const stock =
    normalizeNonNegativeInteger(
      product.stock,
    );

  const shippingWeightGrams =
    normalizeNonNegativeInteger(
      product.shippingWeightGrams,
    );

  if (
    !product.id ||
    !product.name ||
    !product.slug ||
    !product.category?.id ||
    !product.category?.name ||
    !Number.isFinite(price) ||
    price < 0 ||
    stock === 0
  ) {
    return null;
  }

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price,
    image:
      product.image ||
      "/images/no-image.jpg",
    stock,
    featured: product.featured,
    shippingWeightGrams,
    categoryId: product.categoryId,
    category: {
      id: product.category.id,
      name: product.category.name,
      slug: product.category.slug,
      image: product.category.image,
    },
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
          normalizeStoredCart(parsedCart),
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
  }, [cart, hydrated]);

  const addToCart = useCallback(
    (
      product: Product,
      quantity = 1,
    ) => {
      const normalizedProduct =
        normalizeProduct(product);

      if (!normalizedProduct) {
        return;
      }

      const requestedQuantity = Math.max(
        1,
        Math.floor(Number(quantity) || 1),
      );

      setCart((previousCart) => {
        const existingItem =
          previousCart.find(
            (item) =>
              item.id ===
              normalizedProduct.id,
          );

        if (existingItem) {
          return previousCart.map(
            (item) => {
              if (
                item.id !==
                normalizedProduct.id
              ) {
                return item;
              }

              return {
                ...item,
                ...normalizedProduct,
                quantity: Math.min(
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
            quantity: Math.min(
              requestedQuantity,
              normalizedProduct.stock,
            ),
          },
        ];
      });
    },
    [],
  );

  const removeFromCart = useCallback(
    (id: string) => {
      setCart((previousCart) =>
        previousCart.filter(
          (item) => item.id !== id,
        ),
      );
    },
    [],
  );

  const increaseQuantity = useCallback(
    (id: string) => {
      setCart((previousCart) =>
        previousCart.map((item) => {
          if (
            item.id !== id ||
            item.quantity >= item.stock
          ) {
            return item;
          }

          return {
            ...item,
            quantity:
              item.quantity + 1,
          };
        }),
      );
    },
    [],
  );

  const decreaseQuantity = useCallback(
    (id: string) => {
      setCart((previousCart) =>
        previousCart.flatMap(
          (item) => {
            if (item.id !== id) {
              return [item];
            }

            if (item.quantity <= 1) {
              return [];
            }

            return [
              {
                ...item,
                quantity:
                  item.quantity - 1,
              },
            ];
          },
        ),
      );
    },
    [],
  );

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const totalItems = useMemo(
    () =>
      cart.reduce(
        (total, item) =>
          total + item.quantity,
        0,
      ),
    [cart],
  );

  const totalPrice = useMemo(
    () =>
      cart.reduce(
        (total, item) =>
          total +
          item.price * item.quantity,
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
            item.shippingWeightGrams *
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
    <CartContext.Provider value={value}>
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