export const shopConfig = {
  currency: "INR",
  currencySymbol: "₹",

  estimatedDelivery:
    "2–5 business days",

  taxRate: 0,

  shippingDiscounts: {
    tierOne: {
      threshold: 999,
      amount: 99,
    },

    tierTwo: {
      threshold: 1499,
      amount: 199,
    },
  },

  supportPhone: "7013820854",
  supportWhatsapp:
    "917013820854",
} as const;

interface OrderTotals {
  subtotal: number;
  shipping: number;
  shippingDiscount: number;
  tax: number;
  total: number;
}

export interface ShippingDiscountDetails {
  threshold: number | null;
  discountCap: number;
  appliedDiscount: number;
  chargedShipping: number;
}

function normalizeMoney(
  value: number,
): number {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return 0;
  }

  return Math.max(
    0,
    Math.round(
      (amount + Number.EPSILON) *
        100,
    ) / 100,
  );
}

export function getShippingDiscountCap(
  subtotal: number,
): number {
  const normalizedSubtotal =
    normalizeMoney(subtotal);

  if (
    normalizedSubtotal >=
    shopConfig.shippingDiscounts
      .tierTwo.threshold
  ) {
    return shopConfig
      .shippingDiscounts.tierTwo
      .amount;
  }

  if (
    normalizedSubtotal >=
    shopConfig.shippingDiscounts
      .tierOne.threshold
  ) {
    return shopConfig
      .shippingDiscounts.tierOne
      .amount;
  }

  return 0;
}

export function calculateShippingDiscount(
  subtotal: number,
  estimatedShipping: number,
): ShippingDiscountDetails {
  const normalizedSubtotal =
    normalizeMoney(subtotal);

  const normalizedShipping =
    normalizeMoney(
      estimatedShipping,
    );

  const discountCap =
    getShippingDiscountCap(
      normalizedSubtotal,
    );

  const appliedDiscount =
    normalizeMoney(
      Math.min(
        normalizedShipping,
        discountCap,
      ),
    );

  const chargedShipping =
    normalizeMoney(
      Math.max(
        0,
        normalizedShipping -
          appliedDiscount,
      ),
    );

  const threshold =
    discountCap >=
    shopConfig.shippingDiscounts
      .tierTwo.amount
      ? shopConfig
          .shippingDiscounts
          .tierTwo.threshold
      : discountCap >=
          shopConfig
            .shippingDiscounts
            .tierOne.amount
        ? shopConfig
            .shippingDiscounts
            .tierOne.threshold
        : null;

  return {
    threshold,
    discountCap,
    appliedDiscount,
    chargedShipping,
  };
}

export function getNextShippingDiscount(
  subtotal: number,
) {
  const normalizedSubtotal =
    normalizeMoney(subtotal);

  if (
    normalizedSubtotal >=
    shopConfig.shippingDiscounts
      .tierTwo.threshold
  ) {
    return null;
  }

  if (
    normalizedSubtotal >=
    shopConfig.shippingDiscounts
      .tierOne.threshold
  ) {
    return {
      threshold:
        shopConfig
          .shippingDiscounts
          .tierTwo.threshold,

      amount:
        shopConfig
          .shippingDiscounts
          .tierTwo.amount,

      remaining:
        normalizeMoney(
          shopConfig
            .shippingDiscounts
            .tierTwo.threshold -
            normalizedSubtotal,
        ),
    };
  }

  return {
    threshold:
      shopConfig.shippingDiscounts
        .tierOne.threshold,

    amount:
      shopConfig.shippingDiscounts
        .tierOne.amount,

    remaining:
      normalizeMoney(
        shopConfig
          .shippingDiscounts
          .tierOne.threshold -
          normalizedSubtotal,
      ),
  };
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
  estimatedShipping = 0,
): OrderTotals {
  const normalizedSubtotal =
    normalizeMoney(subtotal);

  const {
    appliedDiscount,
    chargedShipping,
  } = calculateShippingDiscount(
    normalizedSubtotal,
    estimatedShipping,
  );

  const tax = calculateTax(
    normalizedSubtotal,
  );

  return {
    subtotal:
      normalizedSubtotal,

    shipping:
      chargedShipping,

    shippingDiscount:
      appliedDiscount,

    tax,

    total:
      normalizeMoney(
        normalizedSubtotal +
          chargedShipping +
          tax,
      ),
  };
}

export function formatCurrency(
  amount: number,
): string {
  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency:
        shopConfig.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    },
  ).format(
    normalizeMoney(amount),
  );
}