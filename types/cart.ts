export interface Product {
  /**
   * Product database ID.
   */
  id: string;

  name: string;
  slug: string;
  description: string;
  price: number;
  image: string;
  stock: number;
  featured: boolean;

  /**
   * Packed contribution of one selected unit.
   */
  shippingWeightGrams: number;

  categoryId?: string;

  category: {
    id: string;
    name: string;
    slug?: string;
    image?: string | null;
  };

  /**
   * Selected variant details.
   * Null represents a legacy/default product line.
   */
  variantId?: string | null;
  variantLabel?: string | null;
  variantSku?: string | null;
  variantWeightGrams?: number | null;
}

export interface CartItem extends Product {
  /**
   * Stable cart identity. Different variants of the
   * same product have different line IDs.
   */
  lineId: string;

  /**
   * Explicit product ID retained separately from
   * the cart line identity.
   */
  productId: string;

  variantId: string | null;
  variantLabel: string | null;
  variantSku: string | null;
  variantWeightGrams: number | null;

  quantity: number;
}

export interface CartContextType {
  cart: CartItem[];

  addToCart: (
    product: Product,
    quantity?: number,
  ) => void;

  removeFromCart: (
    lineId: string,
  ) => void;

  increaseQuantity: (
    lineId: string,
  ) => void;

  decreaseQuantity: (
    lineId: string,
  ) => void;

  clearCart: () => void;

  totalItems: number;
  totalPrice: number;

  /**
   * Combined packed product weight before adding
   * the outer shipping box.
   */
  totalShippingWeightGrams: number;
}