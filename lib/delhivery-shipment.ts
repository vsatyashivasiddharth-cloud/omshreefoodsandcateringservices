import "server-only";

type DelhiveryPaymentMode =
  | "Prepaid"
  | "COD";

type DelhiveryShippingMode =
  | "Surface"
  | "Express";

export interface CreateDelhiveryShipmentInput {
  orderId: string;

  customerName: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
  phone: string;

  paymentMode:
    | DelhiveryPaymentMode;
  codAmount: number;
  totalAmount: number;

  productDescription: string;
  quantity: number;

  weightGrams: number;
  widthCm: number;
  heightCm: number;

  shippingMode:
    DelhiveryShippingMode;

  addressType?: "home" | "office";
  orderDate?: Date;

  sellerName?: string;
  sellerAddress?: string;
  sellerInvoice?: string;
  sellerGstTin?: string;
  hsnCode?: string;
}

export interface DelhiveryShipmentResult {
  success: boolean;
  waybill: string | null;
  shipmentId: string | null;
  orderId: string | null;
  status: string | null;
  message: string | null;
  raw: unknown;
}

export class DelhiveryShipmentError extends Error {
  status: number;
  response: unknown;

  constructor(
    message: string,
    status: number,
    response: unknown,
  ) {
    super(message);

    this.name =
      "DelhiveryShipmentError";

    this.status = status;
    this.response = response;
  }
}

interface DelhiveryConfig {
  apiToken: string;
  baseUrl: string;

  pickupLocation: string;
  pickupAddress: string;
  pickupCity: string;
  pickupPincode: string;
  pickupCountry: string;
  pickupPhone: string;
}

function requireEnvironmentVariable(
  name: string,
) {
  const value =
    process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}`,
    );
  }

  return value;
}

function getConfig(): DelhiveryConfig {
  const pickupPincode =
    requireEnvironmentVariable(
      "DELHIVERY_ORIGIN_PINCODE",
    );

  if (
    !/^\d{6}$/.test(
      pickupPincode,
    )
  ) {
    throw new Error(
      "DELHIVERY_ORIGIN_PINCODE must contain exactly 6 digits.",
    );
  }

  return {
    apiToken:
      requireEnvironmentVariable(
        "DELHIVERY_API_TOKEN",
      ),

    baseUrl:
      process.env
        .DELHIVERY_API_BASE_URL
        ?.trim() ||
      "https://staging-express.delhivery.com",

    pickupLocation:
      requireEnvironmentVariable(
        "DELHIVERY_PICKUP_LOCATION",
      ),

    pickupAddress:
      requireEnvironmentVariable(
        "DELHIVERY_PICKUP_ADDRESS",
      ),

    pickupCity:
      requireEnvironmentVariable(
        "DELHIVERY_PICKUP_CITY",
      ),

    pickupPincode,

    pickupCountry:
      process.env
        .DELHIVERY_PICKUP_COUNTRY
        ?.trim() || "India",

    pickupPhone:
      requireEnvironmentVariable(
        "DELHIVERY_PICKUP_PHONE",
      ),
  };
}

function normalizeBaseUrl(
  value: string,
) {
  return value.replace(/\/+$/, "");
}

function normalizeRequiredString(
  value: string,
  fieldName: string,
) {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error(
      `${fieldName} is required.`,
    );
  }

  return normalized;
}

function normalizePincode(
  value: string,
) {
  const pincode = value.trim();

  if (!/^\d{6}$/.test(pincode)) {
    throw new Error(
      "Destination pincode must contain exactly 6 digits.",
    );
  }

  return pincode;
}

function normalizePhone(
  value: string,
) {
  const phone = value.replace(
    /\D/g,
    "",
  );

  if (
    phone.length < 10 ||
    phone.length > 15
  ) {
    throw new Error(
      "Customer phone number is invalid.",
    );
  }

  return phone;
}

function normalizePositiveInteger(
  value: number,
  fieldName: string,
) {
  if (
    !Number.isFinite(value) ||
    !Number.isInteger(value) ||
    value < 1
  ) {
    throw new Error(
      `${fieldName} must be a positive integer.`,
    );
  }

  return value;
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

function normalizeMoney(
  value: number,
) {
  if (
    !Number.isFinite(value) ||
    value < 0
  ) {
    throw new Error(
      "Money amount cannot be negative.",
    );
  }

  return (
    Math.round(value * 100) / 100
  );
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

function findFirstString(
  value: unknown,
  keys: string[],
): string | null {
  if (Array.isArray(value)) {
    for (const item of value) {
      const result =
        findFirstString(
          item,
          keys,
        );

      if (result) {
        return result;
      }
    }

    return null;
  }

  if (!isRecord(value)) {
    return null;
  }

  for (const key of keys) {
    const candidate =
      value[key];

    if (
      typeof candidate ===
        "string" &&
      candidate.trim()
    ) {
      return candidate.trim();
    }

    if (
      typeof candidate ===
        "number" &&
      Number.isFinite(candidate)
    ) {
      return String(candidate);
    }
  }

  for (const nestedValue of Object.values(
    value,
  )) {
    const result =
      findFirstString(
        nestedValue,
        keys,
      );

    if (result) {
      return result;
    }
  }

  return null;
}

function findBooleanSuccess(
  value: unknown,
): boolean | null {
  if (!isRecord(value)) {
    return null;
  }

  for (const key of [
    "success",
    "Success",
    "status",
  ]) {
    const candidate =
      value[key];

    if (
      typeof candidate ===
      "boolean"
    ) {
      return candidate;
    }

    if (
      typeof candidate ===
      "string"
    ) {
      const normalized =
        candidate
          .trim()
          .toLowerCase();

      if (
        [
          "true",
          "success",
          "created",
          "ok",
        ].includes(normalized)
      ) {
        return true;
      }

      if (
        [
          "false",
          "failed",
          "error",
        ].includes(normalized)
      ) {
        return false;
      }
    }
  }

  return null;
}

function getErrorMessage(
  data: unknown,
  fallback: string,
) {
  return (
    findFirstString(data, [
      "error",
      "Error",
      "message",
      "Message",
      "remark",
      "remarks",
      "rmk",
      "detail",
    ]) || fallback
  );
}

function formatOrderDate(
  value: Date,
) {
  if (
    Number.isNaN(
      value.getTime(),
    )
  ) {
    return null;
  }

  return value
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");
}

export async function createDelhiveryShipment(
  input: CreateDelhiveryShipmentInput,
  signal?: AbortSignal,
): Promise<DelhiveryShipmentResult> {
  const config = getConfig();

  const orderId =
    normalizeRequiredString(
      input.orderId,
      "Order ID",
    );

  const customerName =
    normalizeRequiredString(
      input.customerName,
      "Customer name",
    );

  const address =
    normalizeRequiredString(
      input.address,
      "Delivery address",
    );

  const city =
    normalizeRequiredString(
      input.city,
      "Delivery city",
    );

  const state =
    normalizeRequiredString(
      input.state,
      "Delivery state",
    );

  const pincode =
    normalizePincode(
      input.pincode,
    );

  const phone =
    normalizePhone(input.phone);

  const productDescription =
    normalizeRequiredString(
      input.productDescription,
      "Product description",
    ).slice(0, 500);

  const quantity =
    normalizePositiveInteger(
      input.quantity,
      "Quantity",
    );

  const weightGrams =
    Math.ceil(
      normalizePositiveNumber(
        input.weightGrams,
        "Shipment weight",
      ),
    );

  const widthCm =
    normalizePositiveNumber(
      input.widthCm,
      "Shipment width",
    );

  const heightCm =
    normalizePositiveNumber(
      input.heightCm,
      "Shipment height",
    );

  const totalAmount =
    normalizeMoney(
      input.totalAmount,
    );

  const codAmount =
    input.paymentMode === "COD"
      ? normalizeMoney(
          input.codAmount,
        )
      : 0;

  if (
    input.paymentMode ===
      "COD" &&
    codAmount <= 0
  ) {
    throw new Error(
      "COD amount must be greater than zero for COD shipments.",
    );
  }

  const shipment = {
    name: customerName,
    add: address,
    pin: pincode,
    city,
    state,
    country:
      input.country?.trim() ||
      "India",
    phone,

    order: orderId,

    payment_mode:
      input.paymentMode,

    return_pin: "",
    return_city: "",
    return_phone: "",
    return_add: "",
    return_state: "",
    return_country: "",

    products_desc:
      productDescription,

    hsn_code:
      input.hsnCode?.trim() ||
      "",

    cod_amount:
      input.paymentMode ===
      "COD"
        ? String(codAmount)
        : "0",

    order_date:
      formatOrderDate(
        input.orderDate ??
          new Date(),
      ),

    total_amount:
      String(totalAmount),

    seller_add:
      input.sellerAddress
        ?.trim() || "",

    seller_name:
      input.sellerName
        ?.trim() || "",

    seller_inv:
      input.sellerInvoice
        ?.trim() || "",

    quantity:
      String(quantity),

    // Blank lets Delhivery
    // dynamically allocate a waybill.
    waybill: "",

    shipment_width:
      String(widthCm),

    shipment_height:
      String(heightCm),

    weight:
      String(weightGrams),

    seller_gst_tin:
      input.sellerGstTin
        ?.trim() || "",

    shipping_mode:
      input.shippingMode,

    address_type:
      input.addressType ??
      "home",
  };

  const payload = {
    shipments: [shipment],

    pickup_location: {
      name:
        config.pickupLocation,

      add:
        config.pickupAddress,

      city:
        config.pickupCity,

      pin_code: Number(
        config.pickupPincode,
      ),

      country:
        config.pickupCountry,

      phone:
        config.pickupPhone,
    },
  };

  const formBody =
    new URLSearchParams();

  formBody.set("format", "json");
  formBody.set(
    "data",
    JSON.stringify(payload),
  );

  const response = await fetch(
    `${normalizeBaseUrl(
      config.baseUrl,
    )}/api/cmu/create.json`,
    {
      method: "POST",

      headers: {
        Authorization:
          `Token ${config.apiToken}`,

        Accept:
          "application/json",

        "Content-Type":
          "application/x-www-form-urlencoded",
      },

      body: formBody.toString(),

      cache: "no-store",
      signal,
    },
  );

  const contentType =
    response.headers.get(
      "content-type",
    ) ?? "";

  const data: unknown =
    contentType.includes(
      "application/json",
    )
      ? await response
          .json()
          .catch(() => null)
      : await response
          .text()
          .catch(() => null);

  if (!response.ok) {
    throw new DelhiveryShipmentError(
      getErrorMessage(
        data,
        `Delhivery shipment request failed with status ${response.status}.`,
      ),
      response.status,
      data,
    );
  }

  const successFlag =
    findBooleanSuccess(data);

  const waybill =
    findFirstString(data, [
      "waybill",
      "waybill_number",
      "awb",
      "awb_number",
    ]);

  const shipmentId =
    findFirstString(data, [
      "shipment_id",
      "shipmentId",
      "refnum",
      "reference_number",
    ]);

  const returnedOrderId =
    findFirstString(data, [
      "order",
      "order_id",
      "orderId",
      "client_order_id",
    ]) || orderId;

  const status =
    findFirstString(data, [
      "status",
      "Status",
      "shipment_status",
    ]);

  const message =
    findFirstString(data, [
      "message",
      "Message",
      "remark",
      "remarks",
      "rmk",
    ]);

  const success =
    successFlag ??
    Boolean(waybill);

  if (!success || !waybill) {
    throw new DelhiveryShipmentError(
      getErrorMessage(
        data,
        "Delhivery did not create the shipment or return a waybill.",
      ),
      502,
      data,
    );
  }

  return {
    success: true,
    waybill,
    shipmentId,
    orderId:
      returnedOrderId,
    status:
      status || "Created",
    message,
    raw: data,
  };
}