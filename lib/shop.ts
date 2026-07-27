export const shopConfig = {
  currency: "INR",
  currencySymbol: "₹",

  shippingCharge: 50,
  freeShippingAbove: 999,

  estimatedDelivery: "2–5 business days",

  taxRate: 0,

  supportPhone: "7013820854",
  supportWhatsapp: "917013820854",
} as const;

interface OrderTotals {
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
}

function normalizeMoney(value: number): number {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return 0;
  }

  return Math.max(
    0,
    Math.round((amount + Number.EPSILON) * 100) /
      100,
  );
}

export function calculateShipping(
  subtotal: number,
): number {
  const normalizedSubtotal =
    normalizeMoney(subtotal);

  if (
    normalizedSubtotal >=
    shopConfig.freeShippingAbove
  ) {
    return 0;
  }

  return normalizeMoney(
    shopConfig.shippingCharge,
  );
}

export function calculateTax(
  subtotal: number,
): number {
  const normalizedSubtotal =
    normalizeMoney(subtotal);

  return normalizeMoney(
    normalizedSubtotal *
      (shopConfig.taxRate / 100),
  );
}

export function calculateOrderTotal(
  subtotal: number,
): OrderTotals {
  const normalizedSubtotal =
    normalizeMoney(subtotal);

  const shipping = calculateShipping(
    normalizedSubtotal,
  );

  const tax = calculateTax(
    normalizedSubtotal,
  );

  return {
    subtotal: normalizedSubtotal,
    shipping,
    tax,
    total: normalizeMoney(
      normalizedSubtotal + shipping + tax,
    ),
  };
}

export function getFreeShippingRemaining(
  subtotal: number,
): number {
  const normalizedSubtotal =
    normalizeMoney(subtotal);

  return normalizeMoney(
    Math.max(
      0,
      shopConfig.freeShippingAbove -
        normalizedSubtotal,
    ),
  );
}

export function getFreeShippingProgress(
  subtotal: number,
): number {
  const normalizedSubtotal =
    normalizeMoney(subtotal);

  if (shopConfig.freeShippingAbove <= 0) {
    return 100;
  }

  return Math.min(
    100,
    Math.max(
      0,
      (normalizedSubtotal /
        shopConfig.freeShippingAbove) *
        100,
    ),
  );
}

export function formatCurrency(
  amount: number,
): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: shopConfig.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(normalizeMoney(amount));
}