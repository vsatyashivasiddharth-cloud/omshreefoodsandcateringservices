import "server-only";

import {
  Prisma,
  type ProductVariant,
} from "@prisma/client";

export interface ParsedProductVariant {
  id: string | null;
  label: string;
  weightGrams: number;
  shippingWeightGrams: number;
  price: Prisma.Decimal;
  stock: number;
  sku: string | null;
  isActive: boolean;
  isDefault: boolean;
  sortOrder: number;
}

export type ProductVariantParseResult =
  | {
      success: true;
      variants: ParsedProductVariant[];
      defaultVariant: ParsedProductVariant;
    }
  | {
      success: false;
      error: string;
    };

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function readString(
  value: unknown,
) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function readOptionalString(
  value: unknown,
) {
  const result = readString(value);

  return result || null;
}

function readWholeNumber(
  value: unknown,
) {
  if (
    typeof value !== "string" &&
    typeof value !== "number"
  ) {
    return Number.NaN;
  }

  const number = Number(value);

  return Number.isInteger(number)
    ? number
    : Number.NaN;
}

function readBoolean(
  value: unknown,
  fallback: boolean,
) {
  return typeof value === "boolean"
    ? value
    : fallback;
}

function readPrice(
  value: unknown,
): Prisma.Decimal | null {
  if (
    typeof value !== "string" &&
    typeof value !== "number"
  ) {
    return null;
  }

  const normalized = String(value).trim();

  if (!normalized) {
    return null;
  }

  try {
    const price =
      new Prisma.Decimal(normalized);

    if (
      !price.isFinite() ||
      price.lte(0)
    ) {
      return null;
    }

    return price;
  } catch {
    return null;
  }
}

export function parseProductVariants(
  value: unknown,
): ProductVariantParseResult {
  if (
    !Array.isArray(value) ||
    value.length === 0
  ) {
    return {
      success: false,
      error:
        "Add at least one product variant.",
    };
  }

  if (value.length > 50) {
    return {
      success: false,
      error:
        "A product cannot have more than 50 variants.",
    };
  }

  const parsedVariants:
    ParsedProductVariant[] = [];

  const seenWeights =
    new Set<number>();

  const seenSkus =
    new Set<string>();

  for (
    let index = 0;
    index < value.length;
    index += 1
  ) {
    const rawVariant = value[index];

    if (!isRecord(rawVariant)) {
      return {
        success: false,
        error: `Variant ${
          index + 1
        } is invalid.`,
      };
    }

    const id =
      readOptionalString(
        rawVariant.id,
      );

    const label =
      readString(rawVariant.label);

    const weightGrams =
      readWholeNumber(
        rawVariant.weightGrams,
      );

    const shippingWeightGrams =
      readWholeNumber(
        rawVariant.shippingWeightGrams,
      );

    const price =
      readPrice(rawVariant.price);

    const stock =
      readWholeNumber(
        rawVariant.stock,
      );

    const sku =
      readOptionalString(
        rawVariant.sku,
      );

    const isActive =
      readBoolean(
        rawVariant.isActive,
        true,
      );

    const isDefault =
      readBoolean(
        rawVariant.isDefault,
        false,
      );

    const requestedSortOrder =
      readWholeNumber(
        rawVariant.sortOrder,
      );

    const sortOrder =
      Number.isInteger(
        requestedSortOrder,
      ) &&
      requestedSortOrder >= 0
        ? requestedSortOrder
        : index;

    if (
      label.length < 1 ||
      label.length > 50
    ) {
      return {
        success: false,
        error: `Variant ${
          index + 1
        } must have a label between 1 and 50 characters.`,
      };
    }

    if (
      !Number.isInteger(
        weightGrams,
      ) ||
      weightGrams < 1 ||
      weightGrams > 100_000
    ) {
      return {
        success: false,
        error: `${label}: net weight must be a whole number between 1 and 100000 grams.`,
      };
    }

    if (
      !Number.isInteger(
        shippingWeightGrams,
      ) ||
      shippingWeightGrams < 1 ||
      shippingWeightGrams >
        100_000
    ) {
      return {
        success: false,
        error: `${label}: packed shipping weight must be a whole number between 1 and 100000 grams.`,
      };
    }

    if (
      shippingWeightGrams <
      weightGrams
    ) {
      return {
        success: false,
        error: `${label}: packed shipping weight cannot be less than the net product weight.`,
      };
    }

    if (!price) {
      return {
        success: false,
        error: `${label}: enter a valid price greater than zero.`,
      };
    }

    if (
      !Number.isInteger(stock) ||
      stock < 0 ||
      stock > 1_000_000
    ) {
      return {
        success: false,
        error: `${label}: stock must be a whole number between 0 and 1000000.`,
      };
    }

    if (
      sku &&
      sku.length > 100
    ) {
      return {
        success: false,
        error: `${label}: SKU cannot exceed 100 characters.`,
      };
    }

    if (
      seenWeights.has(
        weightGrams,
      )
    ) {
      return {
        success: false,
        error:
          "Each variant must have a unique net weight.",
      };
    }

    seenWeights.add(
      weightGrams,
    );

    if (sku) {
      const normalizedSku =
        sku.toLowerCase();

      if (
        seenSkus.has(
          normalizedSku,
        )
      ) {
        return {
          success: false,
          error:
            "Each variant SKU must be unique.",
        };
      }

      seenSkus.add(
        normalizedSku,
      );
    }

    parsedVariants.push({
      id,
      label,
      weightGrams,
      shippingWeightGrams,
      price,
      stock,
      sku,
      isActive,
      isDefault,
      sortOrder,
    });
  }

  const activeDefaultVariants =
    parsedVariants.filter(
      (variant) =>
        variant.isActive &&
        variant.isDefault,
    );

  if (
    activeDefaultVariants.length !==
    1
  ) {
    return {
      success: false,
      error:
        "Select exactly one active default variant.",
    };
  }

  const inactiveDefault =
    parsedVariants.find(
      (variant) =>
        variant.isDefault &&
        !variant.isActive,
    );

  if (inactiveDefault) {
    return {
      success: false,
      error:
        "The default variant must be active.",
    };
  }

  return {
    success: true,
    variants:
      parsedVariants.sort(
        (first, second) =>
          first.sortOrder -
            second.sortOrder ||
          first.weightGrams -
            second.weightGrams,
      ),
    defaultVariant:
      activeDefaultVariants[0],
  };
}

export function normalizeVariant<
  T extends {
    price: unknown;
    weightGrams: number;
    shippingWeightGrams: number;
    stock: number;
  },
>(variant: T) {
  return {
    ...variant,
    price: Number(
      variant.price,
    ),
    weightGrams: Math.max(
      0,
      Math.floor(
        Number(
          variant.weightGrams,
        ) || 0,
      ),
    ),
    shippingWeightGrams:
      Math.max(
        0,
        Math.floor(
          Number(
            variant
              .shippingWeightGrams,
          ) || 0,
        ),
      ),
    stock: Math.max(
      0,
      Math.floor(
        Number(variant.stock) ||
          0,
      ),
    ),
  };
}

export function normalizeProductWithVariants<
  T extends {
    price: unknown;
    stock: number;
    shippingWeightGrams: number;
    variants: Array<
      Pick<
        ProductVariant,
        | "id"
        | "productId"
        | "label"
        | "weightGrams"
        | "shippingWeightGrams"
        | "price"
        | "stock"
        | "sku"
        | "isActive"
        | "isDefault"
        | "sortOrder"
        | "createdAt"
        | "updatedAt"
      >
    >;
  },
>(product: T) {
  return {
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
            product
              .shippingWeightGrams,
          ) || 0,
        ),
      ),
    variants:
      product.variants.map(
        normalizeVariant,
      ),
  };
}