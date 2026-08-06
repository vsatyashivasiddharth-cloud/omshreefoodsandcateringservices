"use client";

import {
  Plus,
  Scale,
  Star,
  Trash2,
} from "lucide-react";

import Button from "@/components/ui/Button";

export interface ProductVariantFormData {
  clientId: string;
  id?: string;
  label: string;
  weightGrams: string;
  shippingWeightGrams: string;
  price: string;
  stock: string;
  sku: string;
  isActive: boolean;
  isDefault: boolean;
  sortOrder: number;
}

interface ProductVariantFieldsProps {
  variants: ProductVariantFormData[];
  disabled?: boolean;
  legacyProductWarning?: boolean;
  onChange: (
    variants: ProductVariantFormData[],
  ) => void;
}

const inputClassName =
  "h-12 w-full rounded-xl border border-[#E7C98C] bg-white px-3 text-sm text-[#6D2E00] outline-none transition focus:border-[#C89B3C] focus:ring-4 focus:ring-[#C89B3C]/15 disabled:cursor-not-allowed disabled:opacity-60";

function createClientId() {
  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

export function createVariantRow({
  label = "",
  weightGrams = "",
  shippingWeightGrams = "",
  price = "",
  stock = "0",
  sku = "",
  isActive = true,
  isDefault = false,
  sortOrder = 0,
}: Partial<
  Omit<
    ProductVariantFormData,
    "clientId"
  >
> = {}): ProductVariantFormData {
  return {
    clientId: createClientId(),
    label,
    weightGrams,
    shippingWeightGrams,
    price,
    stock,
    sku,
    isActive,
    isDefault,
    sortOrder,
  };
}

export function createInitialVariantRows() {
  return [
    createVariantRow({
      label: "250 g",
      weightGrams: "250",
      shippingWeightGrams: "",
      price: "",
      stock: "0",
      isDefault: true,
      sortOrder: 0,
    }),

    createVariantRow({
      label: "500 g",
      weightGrams: "500",
      shippingWeightGrams: "",
      price: "",
      stock: "0",
      sortOrder: 1,
    }),

    createVariantRow({
      label: "1 kg",
      weightGrams: "1000",
      shippingWeightGrams: "",
      price: "",
      stock: "0",
      sortOrder: 2,
    }),
  ];
}

export function validateVariantRows(
  variants: ProductVariantFormData[],
): string | null {
  if (variants.length === 0) {
    return "Add at least one product variant.";
  }

  const activeDefaults =
    variants.filter(
      (variant) =>
        variant.isActive &&
        variant.isDefault,
    );

  if (activeDefaults.length !== 1) {
    return "Select exactly one active default variant.";
  }

  const weights = new Set<number>();
  const skus = new Set<string>();

  for (
    let index = 0;
    index < variants.length;
    index += 1
  ) {
    const variant = variants[index];

    const label =
      variant.label.trim();

    const weightGrams =
      Number(variant.weightGrams);

    const shippingWeightGrams =
      Number(
        variant.shippingWeightGrams,
      );

    const price =
      Number(variant.price);

    const stock =
      Number(variant.stock);

    const sku =
      variant.sku
        .trim()
        .toLowerCase();

    if (!label) {
      return `Variant ${
        index + 1
      } needs a label.`;
    }

    if (
      !Number.isInteger(
        weightGrams,
      ) ||
      weightGrams < 1
    ) {
      return `${label}: enter a valid net weight in grams.`;
    }

    if (
      !Number.isInteger(
        shippingWeightGrams,
      ) ||
      shippingWeightGrams < 1
    ) {
      return `${label}: enter a valid packed shipping weight.`;
    }

    if (
      shippingWeightGrams <
      weightGrams
    ) {
      return `${label}: packed shipping weight cannot be less than net weight.`;
    }

    if (
      !Number.isFinite(price) ||
      price <= 0
    ) {
      return `${label}: enter a valid price greater than zero.`;
    }

    if (
      !Number.isInteger(stock) ||
      stock < 0
    ) {
      return `${label}: stock must be a whole number of zero or more.`;
    }

    if (
      weights.has(weightGrams)
    ) {
      return "Each variant must have a unique net weight.";
    }

    weights.add(weightGrams);

    if (sku) {
      if (skus.has(sku)) {
        return "Each variant SKU must be unique.";
      }

      skus.add(sku);
    }
  }

  return null;
}

export function serializeVariantRows(
  variants: ProductVariantFormData[],
) {
  return variants.map(
    (variant, index) => ({
      id: variant.id,
      label:
        variant.label.trim(),

      weightGrams:
        Number(
          variant.weightGrams,
        ),

      shippingWeightGrams:
        Number(
          variant
            .shippingWeightGrams,
        ),

      price:
        Number(variant.price),

      stock:
        Number(variant.stock),

      sku:
        variant.sku.trim() ||
        null,

      isActive:
        variant.isActive,

      isDefault:
        variant.isDefault,

      sortOrder: index,
    }),
  );
}

export default function ProductVariantFields({
  variants,
  disabled = false,
  legacyProductWarning = false,
  onChange,
}: ProductVariantFieldsProps) {
  function updateVariant<
    K extends keyof ProductVariantFormData,
  >(
    clientId: string,
    field: K,
    value: ProductVariantFormData[K],
  ) {
    onChange(
      variants.map((variant) => {
        if (
          variant.clientId !==
          clientId
        ) {
          return variant;
        }

        return {
          ...variant,
          [field]: value,
        };
      }),
    );
  }

  function selectDefault(
    clientId: string,
  ) {
    onChange(
      variants.map((variant) => ({
        ...variant,
        isDefault:
          variant.clientId ===
          clientId,
        isActive:
          variant.clientId ===
          clientId
            ? true
            : variant.isActive,
      })),
    );
  }

  function removeVariant(
    clientId: string,
  ) {
    if (variants.length <= 1) {
      return;
    }

    const removedVariant =
      variants.find(
        (variant) =>
          variant.clientId ===
          clientId,
      );

    const remaining =
      variants.filter(
        (variant) =>
          variant.clientId !==
          clientId,
      );

    if (
      removedVariant?.isDefault &&
      remaining.length > 0
    ) {
      remaining[0] = {
        ...remaining[0],
        isDefault: true,
        isActive: true,
      };
    }

    onChange(
      remaining.map(
        (variant, index) => ({
          ...variant,
          sortOrder: index,
        }),
      ),
    );
  }

  function addVariant() {
    onChange([
      ...variants,
      createVariantRow({
        stock: "0",
        isActive: true,
        isDefault:
          variants.length === 0,
        sortOrder:
          variants.length,
      }),
    ]);
  }

  return (
    <section className="rounded-2xl border border-[#E7C98C] bg-[#FFFDF8] p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Scale
              size={20}
              className="text-[#C89B3C]"
              aria-hidden="true"
            />

            <h3 className="text-lg font-bold text-[#6D2E00]">
              Weight Variants
            </h3>
          </div>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
            Enter price, stock, net
            product weight and packed
            shipping weight separately
            for each package size.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          leftIcon={
            <Plus
              size={17}
              aria-hidden="true"
            />
          }
          disabled={disabled}
          onClick={addVariant}
        >
          Add Variant
        </Button>
      </div>

      {legacyProductWarning && (
        <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4">
          <p className="font-semibold text-amber-900">
            This product has no saved
            variants yet.
          </p>

          <p className="mt-1 text-sm leading-6 text-amber-800">
            Enter verified prices,
            stock and packed weights
            before saving. Existing
            product values have not been
            automatically converted.
          </p>
        </div>
      )}

      <div className="mt-5 space-y-4">
        {variants.map(
          (variant, index) => (
            <div
              key={
                variant.clientId
              }
              className="rounded-2xl border border-[#EFDDBB] bg-white p-4 shadow-sm"
            >
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <p className="font-bold text-[#6D2E00]">
                    Variant{" "}
                    {index + 1}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Customer package
                    option
                  </p>
                </div>

                <button
                  type="button"
                  aria-label={`Remove variant ${
                    index + 1
                  }`}
                  disabled={
                    disabled ||
                    variants.length <=
                      1
                  }
                  onClick={() =>
                    removeVariant(
                      variant.clientId,
                    )
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Trash2
                    size={18}
                    aria-hidden="true"
                  />
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#6D2E00]">
                    Label
                  </label>

                  <input
                    value={
                      variant.label
                    }
                    onChange={(
                      event,
                    ) =>
                      updateVariant(
                        variant.clientId,
                        "label",
                        event.target
                          .value,
                      )
                    }
                    placeholder="250 g"
                    required
                    disabled={disabled}
                    className={
                      inputClassName
                    }
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#6D2E00]">
                    Net Weight
                  </label>

                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={
                        variant.weightGrams
                      }
                      onChange={(
                        event,
                      ) =>
                        updateVariant(
                          variant.clientId,
                          "weightGrams",
                          event.target
                            .value,
                        )
                      }
                      placeholder="250"
                      required
                      disabled={
                        disabled
                      }
                      className={`${inputClassName} pr-14`}
                    />

                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500">
                      grams
                    </span>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#6D2E00]">
                    Packed Weight
                  </label>

                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={
                        variant.shippingWeightGrams
                      }
                      onChange={(
                        event,
                      ) =>
                        updateVariant(
                          variant.clientId,
                          "shippingWeightGrams",
                          event.target
                            .value,
                        )
                      }
                      placeholder="275"
                      required
                      disabled={
                        disabled
                      }
                      className={`${inputClassName} pr-14`}
                    />

                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500">
                      grams
                    </span>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#6D2E00]">
                    Price
                  </label>

                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-semibold text-[#C89B3C]">
                      ₹
                    </span>

                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={
                        variant.price
                      }
                      onChange={(
                        event,
                      ) =>
                        updateVariant(
                          variant.clientId,
                          "price",
                          event.target
                            .value,
                        )
                      }
                      placeholder="199.00"
                      required
                      disabled={
                        disabled
                      }
                      className={`${inputClassName} pl-8`}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#6D2E00]">
                    Stock
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={
                      variant.stock
                    }
                    onChange={(
                      event,
                    ) =>
                      updateVariant(
                        variant.clientId,
                        "stock",
                        event.target
                          .value,
                      )
                    }
                    required
                    disabled={disabled}
                    className={
                      inputClassName
                    }
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#6D2E00]">
                    SKU
                  </label>

                  <input
                    value={
                      variant.sku
                    }
                    onChange={(
                      event,
                    ) =>
                      updateVariant(
                        variant.clientId,
                        "sku",
                        event.target
                          .value,
                      )
                    }
                    placeholder="PICKLE-250"
                    disabled={disabled}
                    className={
                      inputClassName
                    }
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-3 border-t border-[#F3E6CF] pt-4 sm:flex-row">
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#E7C98C] bg-[#FFFDF8] px-4 py-3">
                  <input
                    type="checkbox"
                    checked={
                      variant.isActive
                    }
                    onChange={(
                      event,
                    ) => {
                      const active =
                        event.target
                          .checked;

                      updateVariant(
                        variant.clientId,
                        "isActive",
                        active,
                      );

                      if (
                        !active &&
                        variant.isDefault
                      ) {
                        const replacement =
                          variants.find(
                            (item) =>
                              item.clientId !==
                                variant.clientId &&
                              item.isActive,
                          );

                        if (
                          replacement
                        ) {
                          selectDefault(
                            replacement.clientId,
                          );
                        }
                      }
                    }}
                    disabled={
                      disabled ||
                      variant.isDefault
                    }
                    className="h-5 w-5 accent-[#6D2E00]"
                  />

                  <span className="text-sm font-semibold text-[#6D2E00]">
                    Active
                  </span>
                </label>

                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#E7C98C] bg-[#FFFDF8] px-4 py-3">
                  <input
                    type="radio"
                    name="default-product-variant"
                    checked={
                      variant.isDefault
                    }
                    onChange={() =>
                      selectDefault(
                        variant.clientId,
                      )
                    }
                    disabled={
                      disabled ||
                      !variant.isActive
                    }
                    className="h-5 w-5 accent-[#6D2E00]"
                  />

                  <Star
                    size={17}
                    className="text-[#C89B3C]"
                    aria-hidden="true"
                  />

                  <span className="text-sm font-semibold text-[#6D2E00]">
                    Default variant
                  </span>
                </label>
              </div>
            </div>
          ),
        )}
      </div>
    </section>
  );
}