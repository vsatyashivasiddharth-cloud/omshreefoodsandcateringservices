"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  LoaderCircle,
  Package,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from "lucide-react";

import Card from "@/components/ui/Card";
import { useCart } from "@/context/CartContext";
import {
  formatCurrency,
  getFreeShippingProgress,
  getFreeShippingRemaining,
} from "@/lib/shop";

import type {
  ShippingQuoteState,
} from "./CheckoutContent";

interface OrderSummaryProps {
  shippingQuoteState: ShippingQuoteState;
}

export default function OrderSummary({
  shippingQuoteState,
}: OrderSummaryProps) {
  const {
    cart,
    totalItems,
    totalPrice,
  } = useCart();

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
    quote?.chargedShippingAmount ??
    0;

  const total =
    quote?.totalAmount ??
    subtotal;

  const remaining =
    getFreeShippingRemaining(
      subtotal,
    );

  const progress =
    getFreeShippingProgress(
      subtotal,
    );

  const qualifiesForFreeShipping =
    quote?.freeShipping === true;

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
          className="mt-8 shadow-none"
        >
          <div className="space-y-4">
            <SummaryRow
              label="Subtotal"
              value={formatCurrency(
                subtotal,
              )}
            />

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
                  qualifiesForFreeShipping ? (
                    <span className="text-green-700">
                      FREE
                    </span>
                  ) : (
                    formatCurrency(
                      shipping,
                    )
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
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm">
              <Truck
                size={22}
                className="text-[#C89B3C]"
                aria-hidden="true"
              />
            </div>

            <div>
              <h3 className="font-semibold text-[#6D2E00]">
                Free Delivery
              </h3>

              <p className="text-sm text-gray-500">
                Unlock free shipping
                on eligible orders.
              </p>
            </div>
          </div>

          {qualifiesForFreeShipping ? (
            <div
              role="status"
              className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-4"
            >
              <p className="font-semibold text-green-700">
                Congratulations!
              </p>

              <p className="mt-1 text-sm leading-6 text-green-700">
                Your order qualifies
                for free delivery.
              </p>
            </div>
          ) : (
            <>
              <p className="mt-5 text-sm leading-7 text-gray-600">
                Add{" "}
                <span className="font-semibold text-[#6D2E00]">
                  {formatCurrency(
                    remaining,
                  )}
                </span>{" "}
                more to unlock free
                delivery.
              </p>

              <div
                className="mt-5 h-3 overflow-hidden rounded-full bg-gray-200"
                role="progressbar"
                aria-label="Free shipping progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(
                  progress,
                )}
              >
                <div
                  className="h-full rounded-full bg-[#C89B3C] transition-all duration-500"
                  style={{
                    width: `${progress}%`,
                  }}
                />
              </div>
            </>
          )}
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