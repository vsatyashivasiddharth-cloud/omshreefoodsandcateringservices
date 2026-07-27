export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  image: string;
  stock: number;
  featured: boolean;

  /**
   * Packed contribution of one product unit in grams.
   * This should include the product container and immediate packaging.
   */
  shippingWeightGrams: number;

  categoryId?: string;

  category: {
    id: string;
    name: string;
    slug?: string;
    image?: string | null;
  };
}

export interface CartItem extends Product {
  quantity: number;
}

export interface CartContextType {
  cart: CartItem[];

  addToCart: (
    product: Product,
    quantity?: number,
  ) => void;

  removeFromCart: (id: string) => void;

  increaseQuantity: (id: string) => void;

  decreaseQuantity: (id: string) => void;

  clearCart: () => void;

  totalItems: number;

  totalPrice: number;

  /**
   * Combined product weight before adding the outer shipping box.
   */
  totalShippingWeightGrams: number;
}