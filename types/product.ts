export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
}

export interface ProductWithCategory {
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

  categoryId: string;
  category: ProductCategory;

  createdAt?: string | Date;
  updatedAt?: string | Date;
}