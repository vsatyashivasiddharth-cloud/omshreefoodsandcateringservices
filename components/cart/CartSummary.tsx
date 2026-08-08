"use client";

import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CreditCard,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";

import Card from "@/components/ui/Card";
import { useCart } from "@/context/CartContext";
import { formatCurrency } from "@/lib/shop";

const SHIPPING_DISCOUNT_TIER_ONE_THRESHOLD = 999;
const SHIPPING_DISCOUNT_TIER_TWO_THRESHOLD = 1499;

interface ShippingOffer {
  title: string;
  description: string;
  remaining: number;
  unlocked: boolean;
}

function getShippingOffer(
  subtotal: number,
): ShippingOffer {
  if (
    subtotal >=
    SHIPPING_DISCOUNT_TIER_TWO_THRESHOLD
  ) {
    return {
      title:
        "₹199 shipping discount unlocked",
      description:
        "You qualify for up to ₹199 off the shipping charge. Final shipping is calculated at checkout.",
      remaining: 0,
      unlocked: true,
    };
  }

  if (
    subtotal >=
    SHIPPING_DISCOUNT_TIER_ONE_THRESHOLD
  ) {
    return {
      title:
        "₹99 shipping discount unlocked",
      description:
        "You qualify for up to ₹99 off the shipping charge.",
      remaining: Math.max(
        0,
        SHIPPING_DISCOUNT_TIER_TWO_THRESHOLD -
          subtotal,
      ),
      unlocked: true,
    };
  }

  return {
    title: "Save ₹99 on shipping",
    description:
      "Orders of ₹999 or more receive up to ₹99 off the shipping charge.",
    remaining: Math.max(
      0,
      SHIPPING_DISCOUNT_TIER_ONE_THRESHOLD -
        subtotal,
    ),
    unlocked: false,
  };
}

export default function CartSummary() {
  const {
    cart,
    totalItems,
    totalPrice,
  } = useCart();

  const subtotal = Math.max(
    0,
    Number(totalPrice) || 0,
  );

  const shippingOffer =
    getShippingOffer(subtotal);

  const isCartEmpty =
    cart.length === 0 ||
    totalItems === 0;

  return (
    <aside aria-labelledby="cart-order-summary">
      <Card
        padding="lg"
        className="overflow-hidden shadow-xl"
      >
        <div className="mb-7">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#FFF4DE] px-4 py-2 text-sm font-semibold text-[#6D2E00]">
            <Sparkles
              size={16}
              className="text-[#C89B3C]"
              aria-hidden="true"
            />

            Secure Checkout
          </div>

          <h2
            id="cart-order-summary"
            className="mt-5 text-3xl font-bold text-[#6D2E00]"
          >
            Order Summary
          </h2>

          <p className="mt-3 leading-7 text-gray-500">
            Review your order before
            proceeding to payment.
          </p>
        </div>

        <Card
          variant="filled"
          padding="md"
          className="shadow-none"
        >
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-600">
                Subtotal
              </span>

              <span className="font-semibold text-[#6D2E00]">
                {formatCurrency(
                  subtotal,
                )}
              </span>
            </div>

            <div className="flex items-start justify-between gap-4">
              <span className="text-gray-600">
                Shipping
              </span>

              <span className="max-w-[170px] text-right text-sm font-semibold text-gray-500">
                Calculated at checkout
              </span>
            </div>

            <div className="border-t border-[#F3DFC2]" />

            <div className="flex items-end justify-between gap-4">
              <span className="text-xl font-bold text-[#6D2E00]">
                Cart Subtotal
              </span>

              <span className="text-3xl font-bold text-[#C89B3C]">
                {formatCurrency(
                  subtotal,
                )}
              </span>
            </div>

            <p className="text-xs leading-5 text-gray-500">
              Your final total will be
              calculated after entering
              your delivery pincode at
              checkout.
            </p>
          </div>
        </Card>

        <Card
          variant="filled"
          padding="md"
          className="mt-6 bg-[#FFF8ED] shadow-none"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm">
              <Truck
                size={21}
                className="text-[#C89B3C]"
                aria-hidden="true"
              />
            </div>

            <div className="min-w-0">
              <h3 className="font-semibold text-[#6D2E00]">
                Shipping Savings
              </h3>

              <p className="mt-1 text-sm leading-6 text-gray-500">
                Get up to ₹99 OFF
                shipping on orders ₹999+
                and up to ₹199 OFF
                shipping on orders
                ₹1,499+.
              </p>
            </div>
          </div>

          <div
            role="status"
            className={`mt-5 rounded-2xl border p-4 ${
              shippingOffer.unlocked
                ? "border-green-200 bg-green-50"
                : "border-[#E7C98C] bg-white/80"
            }`}
          >
            <p
              className={`font-semibold ${
                shippingOffer.unlocked
                  ? "text-green-700"
                  : "text-[#6D2E00]"
              }`}
            >
              {shippingOffer.title}
            </p>

            <p
              className={`mt-1 text-sm leading-6 ${
                shippingOffer.unlocked
                  ? "text-green-700"
                  : "text-gray-600"
              }`}
            >
              {
                shippingOffer.description
              }
            </p>

            {shippingOffer.remaining >
              0 && (
              <p className="mt-3 text-sm font-semibold text-[#8A3B00]">
                Add{" "}
                {formatCurrency(
                  shippingOffer.remaining,
                )}{" "}
                more to unlock{" "}
                {subtotal >=
                SHIPPING_DISCOUNT_TIER_ONE_THRESHOLD
                  ? "up to ₹199 OFF shipping."
                  : "up to ₹99 OFF shipping."}
              </p>
            )}

            {subtotal >=
              SHIPPING_DISCOUNT_TIER_TWO_THRESHOLD && (
              <p className="mt-3 text-sm font-medium text-green-700">
                Your highest shipping
                discount tier is now
                active.
              </p>
            )}
          </div>

          <p className="mt-4 text-xs leading-5 text-gray-500">
            The promotion applies only
            to shipping charges. If the
            courier charge is lower than
            the available discount, the
            shipping charge becomes ₹0.
          </p>
        </Card>

        <Card
          variant="filled"
          padding="md"
          className="mt-6 shadow-none"
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
              title="Secure Checkout"
              description="Safe and encrypted payment."
            />

            <TrustItem
              icon={
                <CreditCard
                  size={20}
                  className="text-[#C89B3C]"
                  aria-hidden="true"
                />
              }
              iconClassName="bg-[#FFF4DE]"
              title="Flexible Payments"
              description="UPI, cards and net banking."
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
              title="Freshly Prepared"
              description="Hygienically packed using premium ingredients."
            />
          </div>
        </Card>

        {isCartEmpty ? (
          <div
            aria-disabled="true"
            className="mt-7 flex h-14 cursor-not-allowed items-center justify-center rounded-full bg-gray-200 px-6 font-semibold text-gray-500"
          >
            Cart Is Empty
          </div>
        ) : (
          <Link
            href="/checkout"
            className="mt-7 flex h-14 w-full items-center justify-center gap-3 rounded-full bg-[#8A3700] px-6 text-base font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#6D2E00] hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-[#C89B3C]/25"
          >
            Proceed to Checkout

            <ArrowRight
              size={19}
              aria-hidden="true"
            />
          </Link>
        )}
      </Card>
    </aside>
  );
}

interface TrustItemProps {
  icon: React.ReactNode;
  iconClassName: string;
  title: string;
  description: string;
}

function TrustItem({
  icon,
  iconClassName,
  title,
  description,
}: TrustItemProps) {
  return (
    <div className="flex items-start gap-4">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}
      >
        {icon}
      </div>

      <div className="min-w-0">
        <p className="font-semibold text-[#6D2E00]">
          {title}
        </p>

        <p className="mt-1 text-sm leading-5 text-gray-500">
          {description}
        </p>
      </div>
    </div>
  );
}