import "server-only";

const DEFAULT_API_BASE_URL =
  "https://track.delhivery.com";

type PaymentMode = "Prepaid" | "COD";

interface DelhiveryConfig {
  apiToken: string;
  baseUrl: string;
  pickupLocation: string;
  originPincode: string;
}

interface DelhiveryRequestOptions {
  method?: "GET" | "POST" | "PUT";
  query?: Record<
    string,
    string | number | boolean | undefined
  >;
  body?: unknown;
  signal?: AbortSignal;
}

interface DelhiveryApiErrorResponse {
  error?: string;
  message?: string;
  detail?: string;
  remarks?: string;
}

export interface DelhiveryServiceabilityResult {
  pincode: string;
  serviceable: boolean;
  prepaid: boolean;
  reversePickup: boolean;
  district?: string;
  city?: string;
  state?: string;
  raw: unknown;
}

export interface DelhiveryRateInput {
  destinationPincode: string;
  weightGrams: number;
  lengthCm: number;
  breadthCm: number;
  heightCm: number;
  paymentMode: PaymentMode;
  codAmount?: number;
  shippingMode?: "S" | "E";
}

export interface DelhiveryRateResult {
  estimatedAmount: number;
  chargeableWeightGrams: number;
  shippingMode: "SURFACE" | "EXPRESS";
  raw: unknown;
}

export class DelhiveryApiError extends Error {
  status: number;
  response: unknown;

  constructor(
    message: string,
    status: number,
    response: unknown,
  ) {
    super(message);
    this.name = "DelhiveryApiError";
    this.status = status;
    this.response = response;
  }
}

function requireEnvironmentVariable(
  name: string,
) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}`,
    );
  }

  return value;
}

function getConfig(): DelhiveryConfig {
  const originPincode =
    requireEnvironmentVariable(
      "DELHIVERY_ORIGIN_PINCODE",
    );

  if (!/^\d{6}$/.test(originPincode)) {
    throw new Error(
      "DELHIVERY_ORIGIN_PINCODE must contain exactly 6 digits.",
    );
  }

  return {
    apiToken: requireEnvironmentVariable(
      "DELHIVERY_API_TOKEN",
    ),
    pickupLocation:
      requireEnvironmentVariable(
        "DELHIVERY_PICKUP_LOCATION",
      ),
    originPincode,
    baseUrl:
      process.env.DELHIVERY_API_BASE_URL?.trim() ||
      DEFAULT_API_BASE_URL,
  };
}

function normalizeBaseUrl(value: string) {
  return value.replace(/\/+$/, "");
}

function normalizePincode(value: string) {
  const pincode = value.trim();

  if (!/^\d{6}$/.test(pincode)) {
    throw new Error(
      "Pincode must contain exactly 6 digits.",
    );
  }

  return pincode;
}

function normalizePositiveNumber(
  value: number,
  fieldName: string,
) {
  if (
    !Number.isFinite(value) ||
    value <= 0
  ) {
    throw new Error(
      `${fieldName} must be greater than zero.`,
    );
  }

  return value;
}

function normalizeMoney(value: number) {
  if (
    !Number.isFinite(value) ||
    value < 0
  ) {
    return 0;
  }

  return Math.round(value * 100) / 100;
}

function normalizeBooleanFlag(
  value: unknown,
) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value === 1;
  }

  if (typeof value !== "string") {
    return false;
  }

  return [
    "true",
    "yes",
    "y",
    "1",
    "available",
    "serviceable",
  ].includes(value.trim().toLowerCase());
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

function getErrorMessage(
  data: unknown,
  fallback: string,
) {
  if (!isRecord(data)) {
    return fallback;
  }

  const errorData =
    data as DelhiveryApiErrorResponse;

  return (
    errorData.error ||
    errorData.message ||
    errorData.detail ||
    errorData.remarks ||
    fallback
  );
}

async function delhiveryRequest<T>(
  pathname: string,
  options: DelhiveryRequestOptions = {},
): Promise<T> {
  const config = getConfig();

  const url = new URL(
    `${normalizeBaseUrl(
      config.baseUrl,
    )}${pathname}`,
  );

  for (const [key, value] of Object.entries(
    options.query ?? {},
  )) {
    if (
      value !== undefined &&
      value !== ""
    ) {
      url.searchParams.set(
        key,
        String(value),
      );
    }
  }

  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers: {
      Authorization: `Token ${config.apiToken}`,
      Accept: "application/json",
      ...(options.body !== undefined
        ? {
            "Content-Type":
              "application/json",
          }
        : {}),
    },
    body:
      options.body === undefined
        ? undefined
        : JSON.stringify(options.body),
    cache: "no-store",
    signal: options.signal,
  });

  const contentType =
    response.headers.get("content-type") ??
    "";

  const data: unknown =
    contentType.includes("application/json")
      ? await response
          .json()
          .catch(() => null)
      : await response
          .text()
          .catch(() => null);

  if (!response.ok) {
    throw new DelhiveryApiError(
      getErrorMessage(
        data,
        `Delhivery request failed with status ${response.status}.`,
      ),
      response.status,
      data,
    );
  }

  return data as T;
}

function findPostalCodeEntry(
  data: unknown,
): Record<string, unknown> | null {
  if (!isRecord(data)) {
    return null;
  }

  const deliveryCodes =
    data.delivery_codes;

  if (!Array.isArray(deliveryCodes)) {
    return null;
  }

  for (const entry of deliveryCodes) {
    if (!isRecord(entry)) {
      continue;
    }

    const postalCode =
      entry.postal_code;

    if (isRecord(postalCode)) {
      return postalCode;
    }
  }

  return null;
}

export async function checkDelhiveryServiceability(
  pincode: string,
  signal?: AbortSignal,
): Promise<DelhiveryServiceabilityResult> {
  const normalizedPincode =
    normalizePincode(pincode);

  const data =
    await delhiveryRequest<unknown>(
      "/c/api/pin-codes/json/",
      {
        query: {
          filter_codes:
            normalizedPincode,
        },
        signal,
      },
    );

  const postalCode =
    findPostalCodeEntry(data);

  if (!postalCode) {
    return {
      pincode: normalizedPincode,
      serviceable: false,
      prepaid: false,
      reversePickup: false,
      raw: data,
    };
  }

  const prepaid =
    normalizeBooleanFlag(
      postalCode.pre_paid,
    ) ||
    normalizeBooleanFlag(
      postalCode.prepaid,
    );

  const cod =
    normalizeBooleanFlag(
      postalCode.cod,
    );

  const reversePickup =
    normalizeBooleanFlag(
      postalCode.pickup,
    ) ||
    normalizeBooleanFlag(
      postalCode.repl,
    );

  return {
    pincode: normalizedPincode,
    serviceable: prepaid || cod,
    prepaid,
    reversePickup,
    district:
      typeof postalCode.district ===
      "string"
        ? postalCode.district
        : undefined,
    city:
      typeof postalCode.city === "string"
        ? postalCode.city
        : undefined,
    state:
      typeof postalCode.state_code ===
      "string"
        ? postalCode.state_code
        : typeof postalCode.state ===
            "string"
          ? postalCode.state
          : undefined,
    raw: data,
  };
}

function calculateVolumetricWeightGrams(
  lengthCm: number,
  breadthCm: number,
  heightCm: number,
) {
  return Math.ceil(
    ((lengthCm *
      breadthCm *
      heightCm) /
      5000) *
      1000,
  );
}

function findFirstFiniteNumber(
  value: unknown,
  keys: string[],
): number | null {
  if (Array.isArray(value)) {
    for (const item of value) {
      const result =
        findFirstFiniteNumber(
          item,
          keys,
        );

      if (result !== null) {
        return result;
      }
    }

    return null;
  }

  if (!isRecord(value)) {
    return null;
  }

  for (const key of keys) {
    const candidate = Number(value[key]);

    if (
      Number.isFinite(candidate) &&
      candidate >= 0
    ) {
      return candidate;
    }
  }

  for (const nestedValue of Object.values(
    value,
  )) {
    const result =
      findFirstFiniteNumber(
        nestedValue,
        keys,
      );

    if (result !== null) {
      return result;
    }
  }

  return null;
}

export async function getDelhiveryShippingRate(
  input: DelhiveryRateInput,
  signal?: AbortSignal,
): Promise<DelhiveryRateResult> {
  const config = getConfig();

  const destinationPincode =
    normalizePincode(
      input.destinationPincode,
    );

  const weightGrams =
    normalizePositiveNumber(
      input.weightGrams,
      "Weight",
    );

  const lengthCm =
    normalizePositiveNumber(
      input.lengthCm,
      "Length",
    );

  const breadthCm =
    normalizePositiveNumber(
      input.breadthCm,
      "Breadth",
    );

  const heightCm =
    normalizePositiveNumber(
      input.heightCm,
      "Height",
    );

  const codAmount =
    input.paymentMode === "COD"
      ? normalizeMoney(
          input.codAmount ?? 0,
        )
      : 0;

  if (
    input.paymentMode === "COD" &&
    codAmount <= 0
  ) {
    throw new Error(
      "COD amount must be greater than zero for COD shipments.",
    );
  }

  const shippingMode =
    input.shippingMode ?? "S";

  const data =
    await delhiveryRequest<unknown>(
      "/api/kinko/v1/invoice/charges/.json",
      {
        query: {
          md:
            shippingMode === "E"
              ? "E"
              : "S",
          ss: "Delivered",
          d_pin: destinationPincode,
          o_pin: config.originPincode,
          cgm: Math.ceil(weightGrams),
          pt: input.paymentMode,
          cod: codAmount,
        },
        signal,
      },
    );

  const estimatedAmount =
    findFirstFiniteNumber(data, [
      "total_amount",
      "total",
      "amount",
      "shipping_charge",
      "gross_amount",
    ]);

  if (estimatedAmount === null) {
    throw new DelhiveryApiError(
      "Delhivery returned an unrecognized rate response.",
      502,
      data,
    );
  }

  const volumetricWeightGrams =
    calculateVolumetricWeightGrams(
      lengthCm,
      breadthCm,
      heightCm,
    );

  return {
    estimatedAmount:
      normalizeMoney(estimatedAmount),
    chargeableWeightGrams: Math.max(
      Math.ceil(weightGrams),
      volumetricWeightGrams,
    ),
    shippingMode:
      shippingMode === "E"
        ? "EXPRESS"
        : "SURFACE",
    raw: data,
  };
}

export function getDelhiveryPickupLocation() {
  return getConfig().pickupLocation;
}

export function getDelhiveryOriginPincode() {
  return getConfig().originPincode;
}