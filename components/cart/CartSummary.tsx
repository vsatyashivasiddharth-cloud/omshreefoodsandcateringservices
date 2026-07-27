"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CreditCard,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";

import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { useCart } from "@/context/CartContext";
import {
  calculateOrderTotal,
  formatCurrency,
  getFreeShippingProgress,
  getFreeShippingRemaining,
} from "@/lib/shop";

export default function CartSummary() {
  const { totalPrice } = useCart();

  const {
    subtotal,
    shipping,
    tax,
    total,
  } = calculateOrderTotal(totalPrice);

  const remaining =
    getFreeShippingRemaining(subtotal);

  const progress =
    getFreeShippingProgress(subtotal);

  const qualifiesForFreeShipping =
    shipping === 0;

  return (
    <aside aria-labelledby="order-summary-heading">
      <Card
        padding="lg"
        className="overflow-hidden shadow-2xl"
      >
        <Badge
          variant="neutral"
          className="gap-2"
        >
          <Sparkles
            size={16}
            aria-hidden="true"
          />

          Secure Checkout
        </Badge>

        <h2
          id="order-summary-heading"
          className="mt-5 text-3xl font-bold text-[#6D2E00]"
        >
          Order Summary
        </h2>

        <p className="mt-3 leading-7 text-gray-500">
          Review your order before proceeding to
          payment.
        </p>

        <Card
          variant="filled"
          padding="md"
          className="mt-8 shadow-none"
        >
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-4 text-gray-600">
              <span>Subtotal</span>

              <span className="font-semibold text-[#6D2E00]">
                {formatCurrency(subtotal)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4 text-gray-600">
              <span>Shipping</span>

              <span
                className={
                  qualifiesForFreeShipping
                    ? "font-semibold text-green-700"
                    : "font-semibold text-[#6D2E00]"
                }
              >
                {qualifiesForFreeShipping
                  ? "FREE"
                  : formatCurrency(shipping)}
              </span>
            </div>

            {tax > 0 && (
              <div className="flex items-center justify-between gap-4 text-gray-600">
                <span>Tax</span>

                <span className="font-semibold text-[#6D2E00]">
                  {formatCurrency(tax)}
                </span>
              </div>
            )}

            <div className="border-t border-[#F3DFC2]" />

            <div className="flex items-end justify-between gap-4">
              <span className="text-xl font-bold text-[#6D2E00]">
                Grand Total
              </span>

              <span className="text-4xl font-extrabold text-[#C89B3C]">
                {formatCurrency(total)}
              </span>
            </div>
          </div>
        </Card>

        <Card
          variant="filled"
          padding="md"
          className="mt-8 bg-[#FFF8ED] shadow-none"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm">
              <Truck
                size={20}
                className="text-[#C89B3C]"
                aria-hidden="true"
              />
            </div>

            <div>
              <h3 className="font-semibold text-[#6D2E00]">
                Free Delivery
              </h3>

              <p className="text-sm text-gray-500">
                Unlock free shipping on eligible
                orders.
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

              <p className="mt-1 text-sm text-green-700">
                Your order qualifies for free
                delivery.
              </p>
            </div>
          ) : (
            <>
              <p className="mt-5 text-sm leading-7 text-gray-600">
                Add{" "}
                <span className="font-semibold text-[#6D2E00]">
                  {formatCurrency(remaining)}
                </span>{" "}
                more to enjoy free delivery.
              </p>

              <div
                className="mt-5 h-3 overflow-hidden rounded-full bg-gray-200"
                role="progressbar"
                aria-label="Free shipping progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress)}
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
            <SummaryFeature
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

            <SummaryFeature
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

            <SummaryFeature
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

        <Link
          href="/checkout"
          className="mt-8 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[#6D2E00] px-8 text-lg font-semibold text-white shadow-xl transition-all duration-300 hover:-translate-y-1 hover:bg-[#4E1F00] hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-[#C89B3C]/20 active:scale-95"
        >
          Proceed to Checkout

          <ArrowRight
            size={20}
            aria-hidden="true"
          />
        </Link>
      </Card>
    </aside>
  );
}

interface SummaryFeatureProps {
  icon: ReactNode;
  iconClassName: string;
  title: string;
  description: string;
}

function SummaryFeature({
  icon,
  iconClassName,
  title,
  description,
}: SummaryFeatureProps) {
  return (
    <div className="flex items-center gap-4">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${iconClassName}`}
      >
        {icon}
      </div>

      <div>
        <p className="font-semibold text-[#6D2E00]">
          {title}
        </p>

        <p className="text-sm text-gray-500">
          {description}
        </p>
      </div>
    </div>
  );
}