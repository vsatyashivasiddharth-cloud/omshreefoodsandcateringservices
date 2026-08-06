export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
}

export interface ProductVariant {
  id: string;
  label: string;

  /**
   * Customer-visible net product weight.
   */
  weightGrams: number;

  /**
   * Packed shipping contribution for one unit.
   */
  shippingWeightGrams: number;

  price: number;
  stock: number;
  sku: string | null;

  isActive: boolean;
  isDefault: boolean;
  sortOrder: number;
}

export interface ProductWithCategory {
  id: string;
  name: string;
  slug: string;
  description: string;

  /**
   * Legacy/default variant mirror.
   */
  price: number;

  image: string;

  /**
   * Legacy/default variant mirror.
   */
  stock: number;

  featured: boolean;

  /**
   * Legacy/default variant mirror.
   */
  shippingWeightGrams: number;

  categoryId: string;
  category: ProductCategory;

  /**
   * Active variants are supplied on the product
   * detail page. Product cards may omit this field.
   */
  variants?: ProductVariant[];

  createdAt?: string | Date;
  updatedAt?: string | Date;
}