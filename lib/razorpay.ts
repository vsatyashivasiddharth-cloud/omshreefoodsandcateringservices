import "server-only";

import Razorpay from "razorpay";

interface RazorpayConfiguration {
  keyId: string;
  keySecret: string;
}

let razorpayInstance:
  | Razorpay
  | null = null;

function getRazorpayConfiguration(): RazorpayConfiguration {
  const keyId =
    process.env.RAZORPAY_KEY_ID?.trim();

  const keySecret =
    process.env.RAZORPAY_KEY_SECRET?.trim();

  if (!keyId) {
    throw new Error(
      "Missing required environment variable: RAZORPAY_KEY_ID",
    );
  }

  if (!keySecret) {
    throw new Error(
      "Missing required environment variable: RAZORPAY_KEY_SECRET",
    );
  }

  return {
    keyId,
    keySecret,
  };
}

export function getRazorpayClient() {
  if (razorpayInstance) {
    return razorpayInstance;
  }

  const configuration =
    getRazorpayConfiguration();

  razorpayInstance = new Razorpay({
    key_id: configuration.keyId,
    key_secret:
      configuration.keySecret,
  });

  return razorpayInstance;
}

export function getRazorpayPublicKey() {
  return getRazorpayConfiguration()
    .keyId;
}

export function rupeesToPaise(
  amount: number,
) {
  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    throw new Error(
      "Payment amount must be greater than zero.",
    );
  }

  const amountInPaise =
    Math.round(amount * 100);

  if (
    !Number.isSafeInteger(
      amountInPaise,
    ) ||
    amountInPaise < 1
  ) {
    throw new Error(
      "Payment amount is invalid.",
    );
  }

  return amountInPaise;
}