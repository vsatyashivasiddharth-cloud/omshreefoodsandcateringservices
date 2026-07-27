"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  ChefHat,
  Clock3,
  PackageCheck,
  Phone,
  ShoppingBag,
  Truck,
} from "lucide-react";

import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";

const orderSteps = [
  {
    title: "Order Received",
    description:
      "We have successfully received your order and delivery details.",
    icon: PackageCheck,
  },
  {
    title: "Fresh Preparation",
    description:
      "Our team will begin preparing your order using fresh ingredients.",
    icon: ChefHat,
  },
  {
    title: "Delivery",
    description:
      "We will contact you before your order is dispatched for delivery.",
    icon: Truck,
  },
];

export default function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("id");

  return (
    <section className="relative overflow-hidden py-14 sm:py-20">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-10 h-80 w-80 rounded-full bg-[#FFF0D1]/70 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[#FFE5B5]/60 blur-3xl"
      />

      <div className="relative mx-auto max-w-6xl px-6">
        <Card
          padding="none"
          className="overflow-hidden rounded-[40px] shadow-2xl"
        >
          <div className="bg-gradient-to-br from-white via-[#FFFDF9] to-[#FFF4DE] px-6 py-12 text-center sm:px-10 sm:py-16">
            <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-green-50 ring-8 ring-green-100/70">
              <CheckCircle2
                size={64}
                className="text-green-600"
                aria-hidden="true"
              />
            </div>

            <Badge
              variant="neutral"
              className="mt-8 gap-2"
            >
              <BadgeCheck
                size={17}
                aria-hidden="true"
              />

              Order Confirmed
            </Badge>

            <h1 className="mt-6 text-4xl font-bold tracking-tight text-[#6D2E00] sm:text-5xl md:text-6xl">
              Thank You for Your Order!
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600">
              Your order has been placed successfully. Our team has received
              your request and will begin preparing it shortly.
            </p>

            <div
              role="status"
              className="mx-auto mt-8 max-w-md rounded-3xl border border-green-200 bg-green-50 px-6 py-5"
            >
              <div className="flex items-center justify-center gap-3">
                <CheckCircle2
                  size={22}
                  className="text-green-600"
                  aria-hidden="true"
                />

                <span className="font-semibold text-green-800">
                  Order status: Confirmed
                </span>
              </div>

              {orderId && (
                <p className="mt-3 break-all text-sm text-green-700">
                  Order reference:{" "}
                  <span className="font-semibold">
                    {orderId}
                  </span>
                </p>
              )}
            </div>
          </div>
        </Card>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
          <Card
            padding="lg"
            className="shadow-xl"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FFF4DE]">
                <Clock3
                  size={23}
                  className="text-[#C89B3C]"
                  aria-hidden="true"
                />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-[#6D2E00]">
                  What Happens Next?
                </h2>

                <p className="mt-2 leading-7 text-gray-500">
                  Here is what you can expect after placing your order.
                </p>
              </div>
            </div>

            <ol className="mt-8 space-y-5">
              {orderSteps.map((step, index) => {
                const Icon = step.icon;

                return (
                  <li
                    key={step.title}
                    className="relative flex gap-4 rounded-3xl border border-[#F3DFC2] bg-[#FFFDF9] p-5"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm">
                      <Icon
                        size={22}
                        className="text-[#C89B3C]"
                        aria-hidden="true"
                      />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#C89B3C]">
                        Step {index + 1}
                      </p>

                      <h3 className="mt-1 text-lg font-semibold text-[#6D2E00]">
                        {step.title}
                      </h3>

                      <p className="mt-2 leading-7 text-gray-600">
                        {step.description}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </Card>

          <Card
            padding="lg"
            className="shadow-xl"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FFF4DE]">
                <Phone
                  size={22}
                  className="text-[#C89B3C]"
                  aria-hidden="true"
                />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-[#6D2E00]">
                  Need Help?
                </h2>

                <p className="mt-2 leading-7 text-gray-500">
                  Contact our team if you have questions about your order.
                </p>
              </div>
            </div>

            <Card
              variant="filled"
              padding="md"
              className="mt-8 bg-[#FFF8EE] shadow-none"
            >
              <p className="text-sm font-medium text-gray-500">
                Customer Support
              </p>

              <p className="mt-2 text-lg font-bold text-[#6D2E00]">
                +91 XXXXX XXXXX
              </p>
            </Card>

            <Card
              variant="filled"
              padding="md"
              className="mt-5 bg-green-50 shadow-none"
            >
              <div className="flex items-start gap-3">
                <Clock3
                  size={20}
                  className="mt-0.5 shrink-0 text-green-600"
                  aria-hidden="true"
                />

                <div>
                  <p className="font-semibold text-green-800">
                    Business Hours
                  </p>

                  <p className="mt-2 text-sm leading-6 text-green-700">
                    Monday – Sunday
                    <br />
                    9:00 AM – 9:00 PM
                  </p>
                </div>
              </div>
            </Card>

            <div className="mt-6 rounded-3xl border border-[#F3DFC2] p-5">
              <div className="flex items-start gap-3">
                <ShoppingBag
                  size={20}
                  className="mt-0.5 shrink-0 text-[#C89B3C]"
                  aria-hidden="true"
                />

                <p className="text-sm leading-6 text-gray-600">
                  Keep your order reference available when contacting support
                  so our team can assist you quickly.
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="mt-12 flex flex-col justify-center gap-4 sm:flex-row">
          <Link
            href="/shop"
            className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-[#6D2E00] px-8 text-lg font-semibold text-white shadow-xl transition-all duration-300 hover:-translate-y-1 hover:bg-[#4E1F00] hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-[#C89B3C]/20 active:scale-95"
          >
            <ShoppingBag
              size={20}
              aria-hidden="true"
            />

            Continue Shopping
          </Link>

          <Link
            href="/"
            className="inline-flex h-14 items-center justify-center gap-2 rounded-full border-2 border-[#6D2E00] bg-white px-8 text-lg font-semibold text-[#6D2E00] transition-all duration-300 hover:-translate-y-1 hover:bg-[#6D2E00] hover:text-white focus:outline-none focus:ring-4 focus:ring-[#C89B3C]/20 active:scale-95"
          >
            <ArrowLeft
              size={20}
              aria-hidden="true"
            />

            Back to Home
          </Link>
        </div>
      </div>
    </section>
  );
}