"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ChevronRight,
  ClipboardCheck,
  MapPin,
} from "lucide-react";

import Card from "@/components/ui/Card";
import { useCart } from "@/context/CartContext";

import CheckoutForm from "./CheckoutForm";
import OrderSummary from "./OrderSummary";

export type PaymentMode = "Prepaid";

export interface ShippingQuote {
  serviceable: true;
  prepaid: boolean;
  reversePickup: boolean;

  paymentMode: PaymentMode;

  location: {
    city: string | null;
    district: string | null;
    state: string | null;
  };

  package: {
    id: string;
    name: string;
    code: string;

    productWeightGrams: number;
    emptyWeightGrams: number;
    packedWeightGrams: number;

    dimensions: {
      lengthCm: number;
      breadthCm: number;
      heightCm: number;
    };
  };

  quote: {
    subtotalAmount: number;
    estimatedShippingAmount: number;
    chargedShippingAmount: number;
    shippingDiscountAmount: number;
    totalAmount: number;

    chargeableWeightGrams: number;

    shippingMode:
      | "SURFACE"
      | "EXPRESS";

    freeShipping: boolean;

    freeShippingThreshold:
      | number
      | null;

    quotedAt: string;
  };
}

export type ShippingQuoteState =
  | {
      status: "idle";
      message?: string;
    }
  | {
      status: "loading";
      message?: string;
    }
  | {
      status: "success";
      data: ShippingQuote;
    }
  | {
      status: "unavailable";
      message: string;
      prepaid: boolean;
    }
  | {
      status: "error";
      message: string;
    };

interface QuoteErrorResponse {
  error?: string;
  message?: string;
  serviceable?: boolean;
  prepaid?: boolean;
}

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

function isNullableString(
  value: unknown,
): value is string | null {
  return (
    typeof value === "string" ||
    value === null
  );
}

function isShippingQuote(
  value: unknown,
): value is ShippingQuote {
  if (!isRecord(value)) {
    return false;
  }

  if (
    value.serviceable !== true ||
    value.paymentMode !== "Prepaid" ||
    typeof value.prepaid !== "boolean" ||
    typeof value.reversePickup !==
      "boolean" ||
    !isRecord(value.location) ||
    !isRecord(value.package) ||
    !isRecord(value.quote)
  ) {
    return false;
  }

  const location = value.location;
  const packageDetails =
    value.package;
  const dimensions =
    packageDetails.dimensions;
  const quote = value.quote;

  if (!isRecord(dimensions)) {
    return false;
  }

  return (
    isNullableString(location.city) &&
    isNullableString(
      location.district,
    ) &&
    isNullableString(
      location.state,
    ) &&
    typeof packageDetails.id ===
      "string" &&
    typeof packageDetails.name ===
      "string" &&
    typeof packageDetails.code ===
      "string" &&
    isFiniteNumber(
      packageDetails
        .productWeightGrams,
    ) &&
    isFiniteNumber(
      packageDetails
        .emptyWeightGrams,
    ) &&
    isFiniteNumber(
      packageDetails
        .packedWeightGrams,
    ) &&
    isFiniteNumber(
      dimensions.lengthCm,
    ) &&
    isFiniteNumber(
      dimensions.breadthCm,
    ) &&
    isFiniteNumber(
      dimensions.heightCm,
    ) &&
    isFiniteNumber(
      quote.subtotalAmount,
    ) &&
    isFiniteNumber(
      quote.estimatedShippingAmount,
    ) &&
    isFiniteNumber(
      quote.chargedShippingAmount,
    ) &&
    isFiniteNumber(
      quote.shippingDiscountAmount,
    ) &&
    isFiniteNumber(
      quote.totalAmount,
    ) &&
    isFiniteNumber(
      quote.chargeableWeightGrams,
    ) &&
    (quote.shippingMode ===
      "SURFACE" ||
      quote.shippingMode ===
        "EXPRESS") &&
    typeof quote.freeShipping ===
      "boolean" &&
    (quote.freeShippingThreshold ===
      null ||
      isFiniteNumber(
        quote.freeShippingThreshold,
      )) &&
    typeof quote.quotedAt ===
      "string"
  );
}

export default function CheckoutContent() {
  const { cart } = useCart();

  const [pincode, setPincode] =
    useState("");

  const [
    shippingQuoteState,
    setShippingQuoteState,
  ] = useState<ShippingQuoteState>({
    status: "idle",
    message:
      "Enter your delivery pincode to calculate shipping.",
  });

  const quoteItems = useMemo(
    () =>
      cart.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,

        quantity: Math.max(
          1,
          Math.floor(
            Number(item.quantity) || 1,
          ),
        ),
      })),
    [cart],
  );

  useEffect(() => {
    if (
      cart.length === 0 ||
      !/^\d{6}$/.test(pincode)
    ) {
      return;
    }

    const controller =
      new AbortController();

    const timeoutId =
      window.setTimeout(
        async () => {
          setShippingQuoteState({
            status: "loading",
            message:
              "Checking delivery availability and shipping charges...",
          });

          try {
            const response =
              await fetch(
                "/api/shipping/delhivery/quote",
                {
                  method: "POST",

                  headers: {
                    "Content-Type":
                      "application/json",
                  },

                  body: JSON.stringify({
                    destinationPincode:
                      pincode,

                    paymentMode:
                      "Prepaid",

                    items: quoteItems,
                  }),

                  cache: "no-store",

                  signal:
                    controller.signal,
                },
              );

            const data: unknown =
              await response
                .json()
                .catch(() => null);

            if (!response.ok) {
              const errorData =
                isRecord(data)
                  ? (data as QuoteErrorResponse)
                  : null;

              throw new Error(
                errorData?.error ||
                  errorData?.message ||
                  "Unable to calculate shipping.",
              );
            }

            if (
              isRecord(data) &&
              data.serviceable ===
                false
            ) {
              setShippingQuoteState({
                status:
                  "unavailable",

                message:
                  typeof data.message ===
                  "string"
                    ? data.message
                    : "Delivery is unavailable for this pincode.",

                prepaid:
                  data.prepaid === true,
              });

              return;
            }

            if (
              !isShippingQuote(data)
            ) {
              throw new Error(
                "The shipping quote response was invalid.",
              );
            }

            if (!data.prepaid) {
              setShippingQuoteState({
                status:
                  "unavailable",

                message:
                  "Prepaid delivery is not available for this pincode.",

                prepaid: false,
              });

              return;
            }

            setShippingQuoteState({
              status: "success",
              data,
            });
          } catch (error) {
            if (
              error instanceof
                DOMException &&
              error.name ===
                "AbortError"
            ) {
              return;
            }

            console.error(
              "Shipping quote error:",
              error,
            );

            setShippingQuoteState({
              status: "error",

              message:
                error instanceof Error
                  ? error.message
                  : "Unable to calculate shipping.",
            });
          }
        },
        500,
      );

    return () => {
      window.clearTimeout(
        timeoutId,
      );

      controller.abort();
    };
  }, [
    cart.length,
    pincode,
    quoteItems,
  ]);

  const displayedShippingQuoteState:
    ShippingQuoteState =
    cart.length === 0
      ? {
          status: "idle",
          message:
            "Add products to your cart to calculate shipping.",
        }
      : !/^\d{6}$/.test(pincode)
        ? {
            status: "idle",
            message:
              "Enter a valid 6-digit pincode to calculate shipping.",
          }
        : shippingQuoteState;

  return (
    <div className="space-y-10">
      <Card
        variant="glass"
        padding="md"
        className="shadow-sm"
      >
        <p className="text-sm font-medium text-gray-500">
          Checkout Steps
        </p>

        <ol
          aria-label="Checkout form steps"
          className="mt-4 flex flex-wrap items-center gap-3"
        >
          <li
            aria-current="step"
            className="flex items-center gap-3"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#6D2E00] text-white shadow-sm">
              <MapPin
                size={18}
                aria-hidden="true"
              />
            </span>

            <div>
              <span className="block text-xs font-semibold uppercase tracking-wide text-[#C89B3C]">
                Step 1
              </span>

              <span className="font-semibold text-[#6D2E00]">
                Delivery Details
              </span>
            </div>
          </li>

          <ChevronRight
            size={18}
            className="text-gray-400"
            aria-hidden="true"
          />

          <li className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#F3DFC2] bg-white text-[#C89B3C]">
              <ClipboardCheck
                size={18}
                aria-hidden="true"
              />
            </span>

            <div>
              <span className="block text-xs font-semibold uppercase tracking-wide text-gray-400">
                Step 2
              </span>

              <span className="font-medium text-gray-600">
                Review Order
              </span>
            </div>
          </li>
        </ol>
      </Card>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_420px] xl:gap-10">
        <Card
          padding="lg"
          className="min-w-0"
        >
          <CheckoutForm
            onPincodeChange={
              setPincode
            }
            shippingQuoteState={
              displayedShippingQuoteState
            }
          />
        </Card>

        <aside
          aria-label="Order summary"
          className="xl:sticky xl:top-28 xl:self-start"
        >
          <OrderSummary
            shippingQuoteState={
              displayedShippingQuoteState
            }
          />
        </aside>
      </div>
    </div>
  );
}