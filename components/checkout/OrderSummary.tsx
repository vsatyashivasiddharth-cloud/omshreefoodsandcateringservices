"use client";

import {
  useState,
  type ReactNode,
} from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  LoaderCircle,
  Package,
  ShieldCheck,
  ShoppingBag,
  Tag,
  Truck,
} from "lucide-react";
import { toast } from "sonner";

import Card from "@/components/ui/Card";
import { useCart } from "@/context/CartContext";
import {
  formatCurrency,
} from "@/lib/shop";

import type {
  AppliedCoupon,
  ShippingQuoteState,
} from "./CheckoutContent";

interface CouponValidationResponse {
  valid: true;

  coupon: {
    code: string;
    discountPercent: number;
  };

  preview: {
    subtotalAmount: number;
    productDiscountAmount: number;
    discountedSubtotalAmount: number;
  };
}

interface CouponErrorResponse {
  error?: string;
  message?: string;
}

interface OrderSummaryProps {
  phone: string;

  appliedCoupon:
    | AppliedCoupon
    | null;

  couponLocked: boolean;

  couponContextKey: string;

  onCouponApplied: (
    coupon: AppliedCoupon,
    validationContextKey: string,
  ) => void;

  onCouponRemoved: () => void;

  onCouponValidationChange: (
    pending: boolean,
  ) => void;

  shippingQuoteState: ShippingQuoteState;
}

const SHIPPING_DISCOUNT_TIER_ONE_THRESHOLD = 999;
const SHIPPING_DISCOUNT_TIER_TWO_THRESHOLD = 1499;

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function isFiniteNumber(
  value: unknown,
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value)
  );
}

function getCouponErrorMessage(
  value: unknown,
) {
  if (!isRecord(value)) {
    return "Unable to validate this coupon right now.";
  }

  const data =
    value as CouponErrorResponse;

  return (
    data.error ||
    data.message ||
    "Unable to validate this coupon right now."
  );
}

function isCouponValidationResponse(
  value: unknown,
): value is CouponValidationResponse {
  if (
    !isRecord(value) ||
    value.valid !== true ||
    !isRecord(value.coupon) ||
    !isRecord(value.preview)
  ) {
    return false;
  }

  return (
    typeof value.coupon.code ===
      "string" &&
    value.coupon.code.length > 0 &&
    isFiniteNumber(
      value.coupon.discountPercent,
    ) &&
    isFiniteNumber(
      value.preview.subtotalAmount,
    ) &&
    isFiniteNumber(
      value.preview
        .productDiscountAmount,
    ) &&
    isFiniteNumber(
      value.preview
        .discountedSubtotalAmount,
    )
  );
}

function getNextShippingDiscountMessage(
  subtotal: number,
) {
  if (
    subtotal >=
    SHIPPING_DISCOUNT_TIER_TWO_THRESHOLD
  ) {
    return {
      title: "₹199 shipping discount unlocked",
      description:
        "You qualify for up to ₹199 off the Delhivery shipping charge.",
      remaining: 0,
    };
  }

  if (
    subtotal >=
    SHIPPING_DISCOUNT_TIER_ONE_THRESHOLD
  ) {
    return {
      title: "₹99 shipping discount unlocked",
      description:
        "You qualify for up to ₹99 off shipping. Add more to unlock the ₹199 shipping discount.",
      remaining:
        SHIPPING_DISCOUNT_TIER_TWO_THRESHOLD -
        subtotal,
    };
  }

  return {
    title: "Save on shipping",
    description:
      "Orders of ₹999 or more receive up to ₹99 off the shipping charge.",
    remaining:
      SHIPPING_DISCOUNT_TIER_ONE_THRESHOLD -
      subtotal,
  };
}

export default function OrderSummary({
  phone,
  appliedCoupon,
  couponLocked,
  couponContextKey,
  onCouponApplied,
  onCouponRemoved,
  onCouponValidationChange,
  shippingQuoteState,
}: OrderSummaryProps) {
  const {
    cart,
    totalItems,
    totalPrice,
  } = useCart();

  const [
    couponCode,
    setCouponCode,
  ] = useState("");

  const [
    couponLoading,
    setCouponLoading,
  ] = useState(false);

  const quote =
    shippingQuoteState.status ===
    "success"
      ? shippingQuoteState.data
          .quote
      : null;

  const packageDetails =
    shippingQuoteState.status ===
    "success"
      ? shippingQuoteState.data
          .package
      : null;

  const subtotal =
    quote?.subtotalAmount ??
    totalPrice;

  const shipping =
    quote?.estimatedShippingAmount ??
    0;

  const originalTotal =
    quote?.totalAmount ??
    subtotal;

  const couponDiscount =
    appliedCoupon
      ?.productDiscountAmount ??
    0;

  const total =
    Math.max(
      0,
      originalTotal -
        couponDiscount,
    );

  const shippingSavings =
    getNextShippingDiscountMessage(
      subtotal,
    );

  async function handleApplyCoupon() {
    if (
      couponLoading ||
      couponLocked
    ) {
      return;
    }

    const code =
      couponCode.trim();

    if (!code) {
      toast.error(
        "Enter a coupon code.",
      );

      return;
    }

    const validationContextKey =
      couponContextKey;

    setCouponLoading(true);
    onCouponValidationChange(true);

    try {
      const response = await fetch(
        "/api/coupons/validate",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            couponCode: code,
            phone,

            items: cart.map(
              (item) => ({
                productId:
                  item.productId,

                variantId:
                  item.variantId ??
                  null,

                quantity:
                  item.quantity,
              }),
            ),
          }),

          cache: "no-store",
        },
      );

      const data: unknown =
        await response
          .json()
          .catch(() => null);

      if (!response.ok) {
        throw new Error(
          getCouponErrorMessage(
            data,
          ),
        );
      }

      if (
        !isCouponValidationResponse(
          data,
        )
      ) {
        throw new Error(
          "The coupon response was invalid.",
        );
      }

      const applied: AppliedCoupon = {
        code:
          data.coupon.code,

        discountPercent:
          data.coupon
            .discountPercent,

        subtotalAmount:
          data.preview
            .subtotalAmount,

        productDiscountAmount:
          data.preview
            .productDiscountAmount,

        discountedSubtotalAmount:
          data.preview
            .discountedSubtotalAmount,
      };

      setCouponCode(
        applied.code,
      );

      onCouponApplied(
        applied,
        validationContextKey,
      );

      toast.success(
        `Coupon ${applied.code} applied.`,
      );
    } catch (error) {
      onCouponRemoved();

      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to validate this coupon right now.",
      );
    } finally {
      setCouponLoading(false);
      onCouponValidationChange(false);
    }
  }

  function handleCouponCodeChange(
    value: string,
  ) {
    setCouponCode(value);

    if (
      appliedCoupon &&
      value !== appliedCoupon.code
    ) {
      onCouponRemoved();
    }
  }

  function handleRemoveCoupon() {
    if (couponLocked) {
      return;
    }

    onCouponRemoved();
    setCouponCode("");
  }

  if (cart.length === 0) {
    return (
      <aside aria-labelledby="checkout-order-summary">
        <Card
          padding="lg"
          className="overflow-hidden text-center shadow-xl"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFF4DE]">
            <ShoppingBag
              size={28}
              className="text-[#C89B3C]"
              aria-hidden="true"
            />
          </div>

          <h2
            id="checkout-order-summary"
            className="mt-5 text-2xl font-bold text-[#6D2E00]"
          >
            Your Cart Is Empty
          </h2>

          <p className="mt-3 leading-7 text-gray-500">
            Add products to your
            cart before continuing
            with checkout.
          </p>

          <Link
            href="/shop"
            className="mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#6D2E00] px-6 font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#4E1F00] focus:outline-none focus:ring-4 focus:ring-[#C89B3C]/20"
          >
            <ArrowLeft
              size={18}
              aria-hidden="true"
            />

            Return to Shop
          </Link>
        </Card>
      </aside>
    );
  }

  return (
    <aside aria-labelledby="checkout-order-summary">
      <Card
        padding="lg"
        className="overflow-hidden shadow-xl"
      >
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h2
              id="checkout-order-summary"
              className="text-3xl font-bold text-[#6D2E00]"
            >
              Order Summary
            </h2>

            <p className="mt-2 leading-7 text-gray-500">
              Review your items and
              delivery charges.
            </p>
          </div>

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FFF4DE]">
            <ShoppingBag
              size={22}
              className="text-[#C89B3C]"
              aria-hidden="true"
            />
          </div>
        </div>

        <div className="mb-5 flex items-center justify-between gap-4 border-b border-[#F3DFC2] pb-4 text-sm">
          <span className="text-gray-500">
            {cart.length}{" "}
            {cart.length === 1
              ? "cart line"
              : "cart lines"}
          </span>

          <span className="font-semibold text-[#6D2E00]">
            {totalItems}{" "}
            {totalItems === 1
              ? "item"
              : "items"}
          </span>
        </div>

        <div className="max-h-[420px] space-y-4 overflow-y-auto pr-1">
          {cart.map((item) => {
            const unitPrice =
              Number.isFinite(
                Number(item.price),
              )
                ? Math.max(
                    0,
                    Number(item.price),
                  )
                : 0;

            const quantity =
              Math.max(
                1,
                Math.floor(
                  Number(
                    item.quantity,
                  ) || 1,
                ),
              );

            const lineTotal =
              unitPrice * quantity;

            return (
              <Card
                key={item.lineId}
                variant="filled"
                padding="sm"
                className="shadow-none"
              >
                <div className="flex items-start gap-4">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-[#FFF4DE]">
                    <Image
                      src={
                        item.image ||
                        "/images/no-image.jpg"
                      }
                      alt={item.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="line-clamp-2 font-semibold text-[#6D2E00]">
                          {item.name}
                        </h3>

                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-[#C89B3C]">
                          <span>
                            {
                              item.category
                                .name
                            }
                          </span>

                          {item.variantLabel && (
                            <>
                              <span aria-hidden="true">
                                •
                              </span>

                              <span className="font-semibold text-[#6D2E00]">
                                {
                                  item.variantLabel
                                }
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <p className="shrink-0 font-bold text-[#6D2E00]">
                        {formatCurrency(
                          lineTotal,
                        )}
                      </p>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                      <span>
                        Qty: {quantity}
                      </span>

                      <span aria-hidden="true">
                        •
                      </span>

                      <span>
                        {formatCurrency(
                          unitPrice,
                        )}{" "}
                        each
                      </span>

                      {item.variantWeightGrams !==
                        null && (
                        <>
                          <span aria-hidden="true">
                            •
                          </span>

                          <span>
                            Net weight:{" "}
                            {
                              item.variantWeightGrams
                            }{" "}
                            g
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <Card
          variant="filled"
          padding="md"
          className="mt-6 shadow-none"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FFF4DE] text-[#C89B3C]">
              <Tag
                size={20}
                aria-hidden="true"
              />
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-[#6D2E00]">
                Have a coupon?
              </h3>

              <p className="mt-1 text-sm leading-6 text-gray-500">
                Enter your coupon code
                exactly as provided.
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={couponCode}
              onChange={(event) =>
                handleCouponCodeChange(
                  event.target.value,
                )
              }
              disabled={
                couponLoading ||
                couponLocked
              }
              onKeyDown={(event) => {
                if (
                  event.key ===
                  "Enter"
                ) {
                  event.preventDefault();

                  handleApplyCoupon();
                }
              }}
              placeholder="Enter coupon code"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              maxLength={50}
              className="h-12 min-w-0 flex-1 rounded-2xl border border-[#E8D9BF] bg-white px-4 font-mono text-[#6D2E00] outline-none transition-all duration-200 placeholder:font-sans placeholder:text-gray-400 hover:border-[#C89B3C]/60 focus:border-[#C89B3C] focus:ring-4 focus:ring-[#F8E7C3]"
            />

            <button
              type="button"
              onClick={
                handleApplyCoupon
              }
              disabled={
                couponLoading ||
                couponLocked
              }
              className="h-12 shrink-0 rounded-2xl bg-[#6D2E00] px-5 font-semibold text-white shadow-sm transition hover:bg-[#4E1F00] focus:outline-none focus:ring-4 focus:ring-[#C89B3C]/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {couponLoading ? (
                <span className="inline-flex items-center gap-2">
                  <LoaderCircle
                    size={16}
                    className="animate-spin"
                    aria-hidden="true"
                  />

                  Applying
                </span>
              ) : (
                "Apply"
              )}
            </button>
          </div>

          {appliedCoupon && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-3">
              <div>
                <p className="font-semibold text-green-800">
                  {appliedCoupon.code} applied
                </p>

                <p className="mt-1 text-xs text-green-700">
                  {appliedCoupon.discountPercent}% off product subtotal
                </p>
              </div>

              {!couponLocked && (
                <button
                  type="button"
                  onClick={
                    handleRemoveCoupon
                  }
                  className="text-sm font-semibold text-[#6D2E00] underline underline-offset-4"
                >
                  Remove
                </button>
              )}
            </div>
          )}

          <p className="mt-3 text-xs leading-5 text-gray-500">
            {couponLocked
              ? "Coupon selection is locked for this payment attempt."
              : "Coupon codes are case-sensitive."}
          </p>
        </Card>

        <Card
          variant="filled"
          padding="md"
          className="mt-6 shadow-none"
        >
          <div className="space-y-4">
            <SummaryRow
              label="Subtotal"
              value={formatCurrency(
                subtotal,
              )}
            />

            {appliedCoupon &&
              couponDiscount > 0 && (
                <SummaryRow
                  label="Coupon discount"
                  value={
                    <span className="text-green-700">
                      -
                      {formatCurrency(
                        couponDiscount,
                      )}
                    </span>
                  }
                />
              )}

            <SummaryRow
              label="Shipping"
              value={
                shippingQuoteState.status ===
                "loading" ? (
                  <span className="inline-flex items-center gap-2 text-blue-600">
                    <LoaderCircle
                      size={15}
                      className="animate-spin"
                      aria-hidden="true"
                    />

                    Calculating
                  </span>
                ) : quote ? (
                  formatCurrency(
                    shipping,
                  )
                ) : (
                  <span className="text-gray-400">
                    Enter pincode
                  </span>
                )
              }
            />

            {quote &&
              quote.shippingDiscountAmount >
                0 && (
                <SummaryRow
                  label="Shipping discount"
                  value={
                    <span className="text-green-700">
                      -
                      {formatCurrency(
                        quote.shippingDiscountAmount,
                      )}
                    </span>
                  }
                />
              )}

            <SummaryRow
              label="Payment"
              value="Prepaid"
            />

            <div className="border-t border-[#F3DFC2]" />

            <div className="flex items-end justify-between gap-4">
              <span className="text-xl font-bold text-[#6D2E00]">
                Grand Total
              </span>

              <span className="text-3xl font-bold text-[#C89B3C]">
                {formatCurrency(
                  total,
                )}
              </span>
            </div>
          </div>
        </Card>

        {packageDetails && (
          <Card
            variant="filled"
            padding="md"
            className="mt-6 bg-[#FFF8ED] shadow-none"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#C89B3C] shadow-sm">
                <Package
                  size={21}
                  aria-hidden="true"
                />
              </div>

              <div>
                <h3 className="font-semibold text-[#6D2E00]">
                  Standard Delivery
                </h3>

                <p className="mt-1 text-sm leading-6 text-gray-500">
                  Packed using{" "}
                  {packageDetails.name}.
                  Chargeable weight:{" "}
                  {Math.ceil(
                    quote
                      ?.chargeableWeightGrams ??
                      packageDetails
                        .packedWeightGrams,
                  )}{" "}
                  grams.
                </p>
              </div>
            </div>
          </Card>
        )}

        <Card
          variant="filled"
          padding="md"
          className="mt-6 bg-[#FFF8ED] shadow-none"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm">
              <Truck
                size={22}
                className="text-[#C89B3C]"
                aria-hidden="true"
              />
            </div>

            <div className="min-w-0">
              <h3 className="font-semibold text-[#6D2E00]">
                Shipping Savings
              </h3>

              <p className="mt-1 text-sm leading-6 text-gray-500">
                ₹99 OFF shipping on orders ₹999+ and
                ₹199 OFF shipping on orders ₹1,499+.
                The discount applies only to shipping.
              </p>
            </div>
          </div>

          <div
            role="status"
            className="mt-5 rounded-2xl border border-[#E7C98C] bg-white/80 p-4"
          >
            <p className="font-semibold text-[#6D2E00]">
              {shippingSavings.title}
            </p>

            <p className="mt-1 text-sm leading-6 text-gray-600">
              {shippingSavings.description}
            </p>

            {shippingSavings.remaining > 0 && (
              <p className="mt-2 text-sm font-medium text-[#8A3B00]">
                Add{" "}
                {formatCurrency(
                  shippingSavings.remaining,
                )}{" "}
                more for the next shipping offer.
              </p>
            )}

            {quote &&
              quote.shippingDiscountAmount > 0 && (
                <p className="mt-3 text-sm font-semibold text-green-700">
                  Applied shipping saving:{" "}
                  {formatCurrency(
                    quote.shippingDiscountAmount,
                  )}
                </p>
              )}
          </div>
        </Card>

        <Card
          variant="filled"
          padding="md"
          className="mt-8 shadow-none"
        >
          <div className="space-y-5">
            <TrustItem
              icon={
                <ShieldCheck
                  size={20}
                  className="text-green-600"
                  aria-hidden="true"
                />
              }
              iconClassName="bg-[#EEF9F0]"
              text="Secure order processing"
            />

            <TrustItem
              icon={
                <Truck
                  size={20}
                  className="text-[#C89B3C]"
                  aria-hidden="true"
                />
              }
              iconClassName="bg-[#FFF4DE]"
              text="Reliable doorstep delivery"
            />

            <TrustItem
              icon={
                <BadgeCheck
                  size={20}
                  className="text-[#C89B3C]"
                  aria-hidden="true"
                />
              }
              iconClassName="bg-[#FFF4DE]"
              text="Freshly prepared on order"
            />
          </div>
        </Card>
      </Card>
    </aside>
  );
}

interface SummaryRowProps {
  label: string;
  value: ReactNode;
}

function SummaryRow({
  label,
  value,
}: SummaryRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 text-gray-600">
      <span>{label}</span>

      <span className="text-right font-semibold text-[#6D2E00]">
        {value}
      </span>
    </div>
  );
}

interface TrustItemProps {
  icon: ReactNode;
  iconClassName: string;
  text: string;
}

function TrustItem({
  icon,
  iconClassName,
  text,
}: TrustItemProps) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}
      >
        {icon}
      </div>

      <span className="text-gray-700">
        {text}
      </span>
    </div>
  );
}