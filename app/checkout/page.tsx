import type { Metadata } from "next";
import Link from "next/link";
import {
  CheckCircle2,
  ChevronRight,
  CreditCard,
  ShoppingCart,
} from "lucide-react";

import CheckoutContent from "@/components/checkout/CheckoutContent";
import Footer from "@/components/layout/footer";
import Navbar from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "Checkout",
  description:
    "Enter your delivery details, review your order and complete checkout securely.",
};

const checkoutSteps = [
  {
    label: "Cart",
    icon: ShoppingCart,
    active: false,
    completed: true,
  },
  {
    label: "Checkout",
    icon: CreditCard,
    active: true,
    completed: false,
  },
  {
    label: "Complete",
    icon: CheckCircle2,
    active: false,
    completed: false,
  },
] as const;

export default function CheckoutPage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gradient-to-b from-[#FFFDF8] via-[#FFF8EE] to-[#FFF4DE] pt-6">
        <section className="relative overflow-hidden border-b border-[#F3DFC2] bg-gradient-to-br from-[#FFF8EE] via-[#FFFDF8] to-[#FFF4DE]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-[#FFF0D1]/60 blur-3xl"
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[#FFE5B5]/50 blur-3xl"
          />

          <div className="relative mx-auto max-w-7xl px-6 py-16 sm:py-20">
            <nav
              aria-label="Breadcrumb"
              className="mb-8 inline-flex flex-wrap items-center gap-2 rounded-full border border-[#F3DFC2] bg-white/80 px-5 py-3 text-sm text-gray-500 shadow-sm backdrop-blur-sm"
            >
              <Link
                href="/"
                className="rounded transition-colors hover:text-[#C89B3C] focus:outline-none focus:ring-2 focus:ring-[#C89B3C]/30"
              >
                Home
              </Link>

              <ChevronRight
                size={15}
                aria-hidden="true"
              />

              <Link
                href="/cart"
                className="rounded transition-colors hover:text-[#C89B3C] focus:outline-none focus:ring-2 focus:ring-[#C89B3C]/30"
              >
                Shopping Cart
              </Link>

              <ChevronRight
                size={15}
                aria-hidden="true"
              />

              <span
                aria-current="page"
                className="font-semibold text-[#6D2E00]"
              >
                Checkout
              </span>
            </nav>

            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#F3D9A4] bg-[#FFF4DE] px-5 py-2 text-sm font-semibold text-[#A66A00] shadow-sm">
                <CreditCard
                  size={16}
                  aria-hidden="true"
                />

                Secure Checkout
              </div>

              <h1 className="mt-6 text-4xl font-bold tracking-tight text-[#6D2E00] sm:text-5xl md:text-6xl">
                Complete Your Order
              </h1>

              <p className="mt-6 text-lg leading-8 text-gray-600">
                Enter your delivery details, review your
                order and choose your preferred payment
                method.
              </p>
            </div>

            <ol
              aria-label="Checkout progress"
              className="mt-12 flex flex-wrap items-center gap-4"
            >
              {checkoutSteps.map((step, index) => {
                const Icon = step.icon;

                return (
                  <li
                    key={step.label}
                    className="contents"
                  >
                    <div
                      aria-current={
                        step.active
                          ? "step"
                          : undefined
                      }
                      className={
                        step.active
                          ? "flex items-center gap-3 rounded-full bg-[#6D2E00] px-6 py-3 text-white shadow-lg"
                          : step.completed
                            ? "flex items-center gap-3 rounded-full border border-green-200 bg-green-50 px-6 py-3 text-green-700 shadow-sm"
                            : "flex items-center gap-3 rounded-full border border-[#F3DFC2] bg-white/90 px-6 py-3 text-[#6D2E00] shadow-sm backdrop-blur-sm"
                      }
                    >
                      <Icon
                        size={18}
                        className={
                          step.active
                            ? "text-white"
                            : step.completed
                              ? "text-green-600"
                              : "text-[#C89B3C]"
                        }
                        aria-hidden="true"
                      />

                      <span className="font-semibold">
                        {step.label}
                      </span>
                    </div>

                    {index <
                      checkoutSteps.length - 1 && (
                      <div
                        aria-hidden="true"
                        className={
                          index === 0
                            ? "hidden h-0.5 w-12 bg-green-300 sm:block"
                            : "hidden h-0.5 w-12 bg-[#F3DFC2] sm:block"
                        }
                      />
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        <section
          aria-label="Checkout form"
          className="mx-auto max-w-7xl px-6 py-16"
        >
          <CheckoutContent />
        </section>
      </main>

      <Footer />
    </>
  );
}
