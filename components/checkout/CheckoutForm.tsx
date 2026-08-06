"use client";

import {
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  LoaderCircle,
  MapPin,
  ShieldCheck,
  Truck,
  User,
  XCircle,
} from "lucide-react";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { useCart } from "@/context/CartContext";

import type { ShippingQuoteState } from "./CheckoutContent";

interface CheckoutFormProps {
  onPincodeChange: (
    pincode: string,
  ) => void;

  shippingQuoteState: ShippingQuoteState;
}

interface CheckoutFormState {
  customerName: string;
  phone: string;
  email: string;

  address: string;
  landmark: string;

  city: string;
  state: string;
  pincode: string;
}

interface WebsiteOrderResponse {
  id: string;
  orderAccessToken: string;
}

interface WebsiteOrderAccess {
  id: string;
  token: string;
}

interface CreateRazorpayOrderResponse {
  success: true;
  reused: boolean;

  keyId: string;

  razorpayOrderId: string;
  websiteOrderId: string;

  amount: number;
  amountRupees: number;
  currency: "INR";

  customer: {
    name: string;
    phone: string;
    email: string | null;
  };

  description: string;
}

interface VerifyPaymentResponse {
  success: true;
  alreadyVerified: boolean;

  order: {
    id: string;
    paymentStatus: string;
  };
}

interface ApiErrorResponse {
  error?: string;
  message?: string;
}

interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayFailureResponse {
  error?: {
    code?: string;
    description?: string;
    source?: string;
    step?: string;
    reason?: string;

    metadata?: {
      order_id?: string;
      payment_id?: string;
    };
  };
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;

  prefill: {
    name: string;
    email: string;
    contact: string;
  };

  notes: {
    websiteOrderId: string;
  };

  theme: {
    color: string;
  };

  retry: {
    enabled: boolean;
  };

  modal: {
    confirm_close: boolean;
    ondismiss: () => void;
  };

  handler: (
    response: RazorpaySuccessResponse,
  ) => void | Promise<void>;
}

interface RazorpayInstance {
  open: () => void;

  on: (
    event: "payment.failed",
    handler: (
      response: RazorpayFailureResponse,
    ) => void,
  ) => void;
}

interface RazorpayConstructor {
  new (
    options: RazorpayOptions,
  ): RazorpayInstance;
}

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

interface SectionHeadingProps {
  icon: ReactNode;
  title: string;
  description: string;
}

interface FormFieldProps {
  id: string;
  label: string;
  children: ReactNode;
  required?: boolean;
  optional?: boolean;
}

const initialFormState: CheckoutFormState = {
  customerName: "",
  phone: "",
  email: "",

  address: "",
  landmark: "",

  city: "",
  state: "",
  pincode: "",
};

const indianStates = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
] as const;

const inputClassName =
  "w-full rounded-2xl border border-[#E8D9BF] bg-[#FFFEFC] px-4 py-3.5 text-[#6D2E00] outline-none transition-all duration-200 placeholder:text-gray-400 hover:border-[#C89B3C]/60 focus:border-[#C89B3C] focus:ring-4 focus:ring-[#F8E7C3] disabled:cursor-not-allowed disabled:opacity-60";

let razorpayScriptPromise:
  | Promise<void>
  | null = null;

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function getApiErrorMessage(
  value: unknown,
  fallback: string,
) {
  if (!isRecord(value)) {
    return fallback;
  }

  const data =
    value as ApiErrorResponse;

  return (
    data.error ||
    data.message ||
    fallback
  );
}

function normalizePhone(
  value: string,
) {
  return value
    .replace(/\D/g, "")
    .slice(0, 10);
}

function normalizePincode(
  value: string,
) {
  return value
    .replace(/\D/g, "")
    .slice(0, 6);
}

function isValidEmail(
  value: string,
) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value,
  );
}

function isWebsiteOrderResponse(
  value: unknown,
): value is WebsiteOrderResponse {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    value.id.trim().length > 0 &&
    typeof value.orderAccessToken ===
      "string" &&
    value.orderAccessToken.trim().length >
      0
  );
}

function isCreateRazorpayOrderResponse(
  value: unknown,
): value is CreateRazorpayOrderResponse {
  if (!isRecord(value)) {
    return false;
  }

  return (
    value.success === true &&
    typeof value.keyId === "string" &&
    typeof value.razorpayOrderId ===
      "string" &&
    typeof value.websiteOrderId ===
      "string" &&
    typeof value.amount === "number" &&
    Number.isFinite(value.amount) &&
    value.amount > 0 &&
    value.currency === "INR" &&
    isRecord(value.customer) &&
    typeof value.customer.name ===
      "string" &&
    typeof value.customer.phone ===
      "string" &&
    (typeof value.customer.email ===
      "string" ||
      value.customer.email === null) &&
    typeof value.description ===
      "string"
  );
}

function isVerifyPaymentResponse(
  value: unknown,
): value is VerifyPaymentResponse {
  return (
    isRecord(value) &&
    value.success === true &&
    isRecord(value.order) &&
    typeof value.order.id ===
      "string" &&
    typeof value.order
      .paymentStatus === "string"
  );
}

function loadRazorpayScript() {
  if (
    typeof window === "undefined"
  ) {
    return Promise.reject(
      new Error(
        "Payment checkout is unavailable.",
      ),
    );
  }

  if (window.Razorpay) {
    return Promise.resolve();
  }

  if (razorpayScriptPromise) {
    return razorpayScriptPromise;
  }

  razorpayScriptPromise =
    new Promise<void>(
      (resolve, reject) => {
        const existingScript =
          document.querySelector<HTMLScriptElement>(
            'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
          );

        if (existingScript) {
          existingScript.addEventListener(
            "load",
            () => resolve(),
            {
              once: true,
            },
          );

          existingScript.addEventListener(
            "error",
            () =>
              reject(
                new Error(
                  "Unable to load the payment checkout.",
                ),
              ),
            {
              once: true,
            },
          );

          return;
        }

        const script =
          document.createElement(
            "script",
          );

        script.src =
          "https://checkout.razorpay.com/v1/checkout.js";

        script.async = true;

        script.onload = () => {
          if (window.Razorpay) {
            resolve();
            return;
          }

          reject(
            new Error(
              "The payment checkout did not initialize.",
            ),
          );
        };

        script.onerror = () => {
          razorpayScriptPromise =
            null;

          reject(
            new Error(
              "Unable to load the payment checkout.",
            ),
          );
        };

        document.body.appendChild(
          script,
        );
      },
    );

  return razorpayScriptPromise;
}

export default function CheckoutForm({
  onPincodeChange,
  shippingQuoteState,
}: CheckoutFormProps) {
  const router = useRouter();

  const { cart, clearCart } =
    useCart();

  const [form, setForm] =
    useState<CheckoutFormState>(
      initialFormState,
    );

  const [loading, setLoading] =
    useState(false);

  const [
    paymentVerifying,
    setPaymentVerifying,
  ] = useState(false);

  const websiteOrderRef =
    useRef<WebsiteOrderAccess | null>(
      null,
    );

  function handleChange(
    event: ChangeEvent<
      | HTMLInputElement
      | HTMLTextAreaElement
      | HTMLSelectElement
    >,
  ) {
    const { name, value } =
      event.target;

    let nextValue = value;

    if (name === "phone") {
      nextValue =
        normalizePhone(value);
    }

    if (name === "pincode") {
      nextValue =
        normalizePincode(value);

      onPincodeChange(nextValue);
    }

    setForm((previousForm) => ({
      ...previousForm,
      [name]: nextValue,
    }));
  }

  function validateForm():
    | string
    | null {
    if (cart.length === 0) {
      return "Your cart is empty.";
    }

    if (
      form.customerName.trim().length <
      2
    ) {
      return "Please enter your full name.";
    }

    if (
      !/^\d{10}$/.test(form.phone)
    ) {
      return "Please enter a valid 10-digit phone number.";
    }

    const email =
      form.email.trim();

    if (
      email &&
      !isValidEmail(email)
    ) {
      return "Please enter a valid email address.";
    }

    if (
      form.address.trim().length < 5
    ) {
      return "Please enter your complete delivery address.";
    }

    if (!form.city.trim()) {
      return "Please enter your city.";
    }

    if (!form.state) {
      return "Please select your state.";
    }

    if (
      !/^\d{6}$/.test(form.pincode)
    ) {
      return "Please enter a valid 6-digit pincode.";
    }

    const invalidCartItem =
      cart.some((item) => {
        const quantity = Number(
          item.quantity,
        );

        const stock = Number(
          item.stock,
        );

        return (
          !item.productId ||
          !item.lineId ||
          !Number.isInteger(
            quantity,
          ) ||
          quantity < 1 ||
          !Number.isFinite(stock) ||
          stock < 1 ||
          quantity > stock
        );
      });

    if (invalidCartItem) {
      return "One or more cart items are invalid. Please review your cart.";
    }

    if (
      shippingQuoteState.status ===
      "loading"
    ) {
      return "Please wait while shipping is being calculated.";
    }

    if (
      shippingQuoteState.status !==
      "success"
    ) {
      return "A valid delivery quote is required before payment.";
    }

    if (
      !shippingQuoteState.data.prepaid
    ) {
      return "Prepaid delivery is not available for this pincode.";
    }

    return null;
  }

  async function createWebsiteOrder(): Promise<WebsiteOrderAccess> {
    if (websiteOrderRef.current) {
      return websiteOrderRef.current;
    }

    const completeAddress = [
      form.address.trim(),
      form.landmark.trim(),
    ]
      .filter(Boolean)
      .join(", ");

    const response = await fetch(
      "/api/orders",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          customerName:
            form.customerName.trim(),

          phone: form.phone,

          email:
            form.email.trim(),

          address:
            completeAddress,

          city: form.city.trim(),

          state: form.state,

          pincode: form.pincode,

          paymentMode:
            "Prepaid",

          items: cart.map(
            (item) => ({
              productId:
                item.productId,

              variantId:
                item.variantId,

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
        getApiErrorMessage(
          data,
          "Unable to create your order.",
        ),
      );
    }

    if (!isWebsiteOrderResponse(data)) {
      throw new Error(
        "The order response was invalid.",
      );
    }

    const orderAccess: WebsiteOrderAccess = {
      id: data.id.trim(),
      token:
        data.orderAccessToken.trim(),
    };

    websiteOrderRef.current =
      orderAccess;

    return orderAccess;
  }

  async function createPaymentOrder(
    websiteOrderId: string,
  ) {
    const response = await fetch(
      "/api/payments/razorpay/create-order",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          orderId:
            websiteOrderId,
        }),
      },
    );

    const data: unknown =
      await response
        .json()
        .catch(() => null);

    if (!response.ok) {
      throw new Error(
        getApiErrorMessage(
          data,
          "Unable to start the payment.",
        ),
      );
    }

    if (
      !isCreateRazorpayOrderResponse(
        data,
      )
    ) {
      throw new Error(
        "The payment order response was invalid.",
      );
    }

    return data;
  }

  async function verifyPayment({
    websiteOrderId,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  }: {
    websiteOrderId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) {
    const response = await fetch(
      "/api/payments/razorpay/verify",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          websiteOrderId,
          razorpayOrderId,
          razorpayPaymentId,
          razorpaySignature,
        }),
      },
    );

    const data: unknown =
      await response
        .json()
        .catch(() => null);

    if (!response.ok) {
      throw new Error(
        getApiErrorMessage(
          data,
          "Unable to verify the payment.",
        ),
      );
    }

    if (
      !isVerifyPaymentResponse(data) ||
      data.order.paymentStatus !==
        "SUCCESS"
    ) {
      throw new Error(
        "The payment could not be confirmed.",
      );
    }

    return data;
  }

  async function openPaymentCheckout(
    paymentOrder: CreateRazorpayOrderResponse,
    orderAccess: WebsiteOrderAccess,
  ) {
    await loadRazorpayScript();

    const RazorpayCheckout =
      window.Razorpay;

    if (!RazorpayCheckout) {
      throw new Error(
        "The payment checkout is unavailable.",
      );
    }

    const checkout =
      new RazorpayCheckout({
        key: paymentOrder.keyId,

        amount:
          paymentOrder.amount,

        currency:
          paymentOrder.currency,

        name:
          "Om Shree Foods and Caterers",

        description:
          paymentOrder.description,

        order_id:
          paymentOrder.razorpayOrderId,

        prefill: {
          name:
            paymentOrder.customer
              .name,

          email:
            paymentOrder.customer
              .email ?? "",

          contact:
            paymentOrder.customer
              .phone,
        },

        notes: {
          websiteOrderId:
            paymentOrder.websiteOrderId,
        },

        theme: {
          color: "#6D2E00",
        },

        retry: {
          enabled: true,
        },

        modal: {
          confirm_close: true,

          ondismiss: () => {
            setLoading(false);

            toast.message(
              "Payment window closed. You can try again.",
            );
          },
        },

        handler: async (
          paymentResponse,
        ) => {
          try {
            setPaymentVerifying(
              true,
            );

            await verifyPayment({
              websiteOrderId:
                paymentOrder.websiteOrderId,

              razorpayOrderId:
                paymentResponse.razorpay_order_id,

              razorpayPaymentId:
                paymentResponse.razorpay_payment_id,

              razorpaySignature:
                paymentResponse.razorpay_signature,
            });

            clearCart();

            toast.success(
              "Payment completed successfully.",
            );

            const successUrl =
              `/order-success?id=${encodeURIComponent(
                orderAccess.id,
              )}` +
              `&token=${encodeURIComponent(
                orderAccess.token,
              )}`;

            router.replace(successUrl);
          } catch (error) {
            console.error(
              "Payment verification failed:",
              error,
            );

            toast.error(
              error instanceof Error
                ? error.message
                : "Unable to confirm the payment.",
            );
          } finally {
            setPaymentVerifying(
              false,
            );

            setLoading(false);
          }
        },
      });

    checkout.on(
      "payment.failed",
      (response) => {
        const message =
          response.error
            ?.description ||
          "Payment failed. Please try again.";

        toast.error(message);

        setLoading(false);
        setPaymentVerifying(false);
      },
    );

    checkout.open();
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      loading ||
      paymentVerifying
    ) {
      return;
    }

    const validationError =
      validateForm();

    if (validationError) {
      toast.error(validationError);
      return;
    }

    setLoading(true);

    try {
      const orderAccess =
        await createWebsiteOrder();

      const paymentOrder =
        await createPaymentOrder(
          orderAccess.id,
        );

      await openPaymentCheckout(
        paymentOrder,
        orderAccess,
      );
    } catch (error) {
      console.error(
        "Checkout payment failed:",
        error,
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to start the payment.",
      );

      setLoading(false);
    }
  }

  const quoteReady =
    shippingQuoteState.status ===
      "success" &&
    shippingQuoteState.data.prepaid;

  const busy =
    loading || paymentVerifying;

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8"
      noValidate
    >
      <Card
        variant="filled"
        padding="lg"
        className="shadow-none"
      >
        <SectionHeading
          icon={
            <User
              size={22}
              className="text-[#C89B3C]"
              aria-hidden="true"
            />
          }
          title="Customer Information"
          description="Enter your contact details so we can confirm and update you about your order."
        />

        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            id="customerName"
            label="Full Name"
            required
          >
            <input
              id="customerName"
              type="text"
              name="customerName"
              value={
                form.customerName
              }
              onChange={handleChange}
              required
              minLength={2}
              maxLength={100}
              autoComplete="name"
              placeholder="Enter your full name"
              disabled={busy}
              className={
                inputClassName
              }
            />
          </FormField>

          <FormField
            id="phone"
            label="Phone Number"
            required
          >
            <input
              id="phone"
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              required
              autoComplete="tel"
              inputMode="numeric"
              minLength={10}
              maxLength={10}
              pattern="[0-9]{10}"
              placeholder="Enter 10-digit phone number"
              disabled={busy}
              className={
                inputClassName
              }
            />
          </FormField>

          <div className="md:col-span-2">
            <FormField
              id="email"
              label="Email Address"
              optional
            >
              <input
                id="email"
                type="email"
                name="email"
                value={form.email}
                onChange={
                  handleChange
                }
                autoComplete="email"
                maxLength={150}
                placeholder="Enter your email address"
                disabled={busy}
                className={
                  inputClassName
                }
              />
            </FormField>
          </div>
        </div>
      </Card>

      <Card
        variant="filled"
        padding="lg"
        className="shadow-none"
      >
        <SectionHeading
          icon={
            <MapPin
              size={22}
              className="text-[#C89B3C]"
              aria-hidden="true"
            />
          }
          title="Delivery Address"
          description="Provide the complete address where you would like your order delivered."
        />

        <div className="grid gap-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <FormField
              id="address"
              label="House Number / Street"
              required
            >
              <textarea
                id="address"
                name="address"
                rows={4}
                value={form.address}
                onChange={
                  handleChange
                }
                required
                minLength={5}
                maxLength={300}
                autoComplete="street-address"
                placeholder="Enter house number, street and area"
                disabled={busy}
                className={`${inputClassName} resize-y`}
              />
            </FormField>
          </div>

          <div className="md:col-span-2">
            <FormField
              id="landmark"
              label="Landmark"
              optional
            >
              <input
                id="landmark"
                type="text"
                name="landmark"
                value={
                  form.landmark
                }
                onChange={
                  handleChange
                }
                maxLength={150}
                placeholder="Nearby landmark"
                disabled={busy}
                className={
                  inputClassName
                }
              />
            </FormField>
          </div>

          <FormField
            id="city"
            label="City"
            required
          >
            <input
              id="city"
              type="text"
              name="city"
              value={form.city}
              onChange={handleChange}
              required
              minLength={2}
              maxLength={100}
              autoComplete="address-level2"
              placeholder="Enter your city"
              disabled={busy}
              className={
                inputClassName
              }
            />
          </FormField>

          <FormField
            id="state"
            label="State"
            required
          >
            <select
              id="state"
              name="state"
              value={form.state}
              onChange={handleChange}
              required
              autoComplete="address-level1"
              disabled={busy}
              className={
                inputClassName
              }
            >
              <option value="">
                Select State
              </option>

              {indianStates.map(
                (state) => (
                  <option
                    key={state}
                    value={state}
                  >
                    {state}
                  </option>
                ),
              )}
            </select>
          </FormField>

          <div className="md:col-span-2">
            <FormField
              id="pincode"
              label="Pincode"
              required
            >
              <input
                id="pincode"
                type="text"
                name="pincode"
                value={form.pincode}
                onChange={
                  handleChange
                }
                required
                autoComplete="postal-code"
                inputMode="numeric"
                minLength={6}
                maxLength={6}
                pattern="[0-9]{6}"
                placeholder="Enter 6-digit pincode"
                disabled={busy}
                className={
                  inputClassName
                }
              />
            </FormField>
          </div>
        </div>

        <ShippingStatus
          state={
            shippingQuoteState
          }
        />
      </Card>

      <Card
        variant="filled"
        padding="lg"
        className="shadow-none"
      >
        <SectionHeading
          icon={
            <CreditCard
              size={22}
              className="text-[#C89B3C]"
              aria-hidden="true"
            />
          }
          title="Payment Method"
          description="Complete your order securely using online prepaid payment."
        />

        <div className="flex items-start gap-4 rounded-3xl border border-[#C89B3C] bg-[#FFF4DE] p-5 ring-4 ring-[#C89B3C]/10">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#6D2E00] text-white">
            <CreditCard
              size={22}
              aria-hidden="true"
            />
          </span>

          <span className="min-w-0">
            <span className="block font-semibold text-[#6D2E00]">
              Secure Online Payment
            </span>

            <span className="mt-1 block text-sm leading-6 text-gray-600">
              You will be shown a
              secure payment window
              after reviewing your
              delivery details.
            </span>

            <span className="mt-3 inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#A66A00]">
              Prepaid only
            </span>
          </span>
        </div>
      </Card>

      <div
        role="note"
        className="rounded-3xl border border-green-200 bg-green-50 p-5 sm:p-6"
      >
        <div className="flex items-start gap-3">
          <ShieldCheck
            size={22}
            className="mt-0.5 shrink-0 text-green-600"
            aria-hidden="true"
          />

          <div>
            <h3 className="font-semibold text-green-800">
              Secure Payment
            </h3>

            <p className="mt-1 text-sm leading-6 text-green-700">
              Your order is confirmed
              only after the payment
              has been verified
              securely.
            </p>
          </div>
        </div>
      </div>

      <Button
        type="submit"
        size="lg"
        fullWidth
        loading={busy}
        disabled={
          busy ||
          cart.length === 0 ||
          !quoteReady
        }
        rightIcon={
          <ArrowRight
            size={20}
            aria-hidden="true"
          />
        }
      >
        {paymentVerifying
          ? "Verifying Payment..."
          : loading
            ? "Opening Payment..."
            : quoteReady
              ? "Pay Securely"
              : "Calculate Shipping to Continue"}
      </Button>
    </form>
  );
}

function ShippingStatus({
  state,
}: {
  state: ShippingQuoteState;
}) {
  if (state.status === "idle") {
    return (
      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-[#F3DFC2] bg-white p-4">
        <Truck
          size={20}
          className="mt-0.5 shrink-0 text-[#C89B3C]"
          aria-hidden="true"
        />

        <p className="text-sm leading-6 text-gray-600">
          {state.message}
        </p>
      </div>
    );
  }

  if (state.status === "loading") {
    return (
      <div
        role="status"
        className="mt-6 flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4"
      >
        <LoaderCircle
          size={20}
          className="mt-0.5 shrink-0 animate-spin text-blue-600"
          aria-hidden="true"
        />

        <p className="text-sm leading-6 text-blue-700">
          {state.message}
        </p>
      </div>
    );
  }

  if (state.status === "success") {
    const location = [
      state.data.location.city,
      state.data.location
        .district,
      state.data.location.state,
    ]
      .filter(Boolean)
      .join(", ");

    return (
      <div
        role="status"
        className="mt-6 flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 p-4"
      >
        <CheckCircle2
          size={20}
          className="mt-0.5 shrink-0 text-green-600"
          aria-hidden="true"
        />

        <div>
          <p className="font-semibold text-green-800">
            Delivery available
          </p>

          <p className="mt-1 text-sm leading-6 text-green-700">
            {location
              ? `Prepaid delivery is available for ${location}.`
              : "Prepaid delivery is available for this pincode."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      role="alert"
      className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4"
    >
      <XCircle
        size={20}
        className="mt-0.5 shrink-0 text-red-600"
        aria-hidden="true"
      />

      <p className="text-sm leading-6 text-red-700">
        {state.message}
      </p>
    </div>
  );
}

function SectionHeading({
  icon,
  title,
  description,
}: SectionHeadingProps) {
  return (
    <div className="mb-8 flex items-start gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FFF4DE]">
        {icon}
      </div>

      <div>
        <h2 className="text-2xl font-bold text-[#6D2E00]">
          {title}
        </h2>

        <p className="mt-1 text-sm leading-6 text-gray-500">
          {description}
        </p>
      </div>
    </div>
  );
}

function FormField({
  id,
  label,
  children,
  required = false,
  optional = false,
}: FormFieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-semibold text-[#6D2E00]"
      >
        {label}

        {required && (
          <>
            <span
              className="ml-1 text-red-500"
              aria-hidden="true"
            >
              *
            </span>

            <span className="sr-only">
              Required
            </span>
          </>
        )}

        {optional && (
          <span className="ml-2 font-normal text-gray-400">
            Optional
          </span>
        )}
      </label>

      {children}
    </div>
  );
}