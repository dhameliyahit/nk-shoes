import { api } from "@/lib/api";
import { getOrCreateDeviceId } from "@/lib/device";

export interface PincodeVerificationResult {
  valid: boolean;
  pincode: string;
  city?: string;
  district?: string;
  state?: string;
  circle?: string;
  localities?: string[];
  message?: string;
}

export interface PhoneValidationResult {
  valid: boolean;
  formatted: string;
  message?: string;
}

/**
 * Validates standard Indian mobile phone number (10 digits starting with 6, 7, 8, or 9)
 */
export function validateIndianPhone(phone: string): PhoneValidationResult {
  if (!phone) {
    return { valid: false, formatted: "", message: "Phone number is required" };
  }

  // Strip spaces, dashes, parentheses and +91 country code
  const digits = phone.replace(/\D/g, "");
  const last10 = digits.slice(-10);

  if (last10.length !== 10) {
    return {
      valid: false,
      formatted: digits,
      message: "Enter a valid phone number",
    };
  }

  if (!/^[6-9]/.test(last10)) {
    return {
      valid: false,
      formatted: last10,
      message: "Enter a valid phone number",
    };
  }

  return {
    valid: true,
    formatted: last10,
  };
}

/**
 * Verifies Indian PIN code using India Post public directory
 * Tries server proxy first, then falls back to public API directly
 */
export async function verifyIndianPincode(pincode: string): Promise<PincodeVerificationResult> {
  const cleanPin = pincode ? pincode.toString().trim() : "";

  if (!cleanPin || cleanPin.length !== 6 || !/^\d{6}$/.test(cleanPin)) {
    return {
      valid: false,
      pincode: cleanPin,
      message: "PIN code must be exactly 6 digits",
    };
  }

  // 1. Try backend verification endpoint
  try {
    const res = await fetch(`${api.orders}/verify-pincode/${cleanPin}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.valid) {
        return {
          valid: true,
          pincode: cleanPin,
          city: data.city || data.district,
          district: data.district,
          state: data.state,
          circle: data.circle,
          localities: data.localities || [],
        };
      }
    }
  } catch (err) {
    // Continue to public API fallback
  }

  // 2. Direct fallback to official public Indian postal API
  try {
    const publicRes = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`);
    if (publicRes.ok) {
      const publicData = await publicRes.json();
      if (
        Array.isArray(publicData) &&
        publicData[0]?.Status === "Success" &&
        Array.isArray(publicData[0]?.PostOffice) &&
        publicData[0].PostOffice.length > 0
      ) {
        const po = publicData[0].PostOffice[0];
        const localities = publicData[0].PostOffice.map((item: any) => item.Name).filter(Boolean);
        return {
          valid: true,
          pincode: cleanPin,
          city: po.District || po.Block || po.Name,
          district: po.District,
          state: po.State,
          circle: po.Circle,
          localities,
        };
      }
    }
  } catch (err) {
    // Both failed
  }

  return {
    valid: false,
    pincode: cleanPin,
    message: "Invalid Indian PIN code. Please verify your postal code.",
  };
}

export interface OrderItemPayload {
  product: string;
  name: string;
  image: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
}

export interface ShippingAddressPayload {
  fullName: string;
  phone: string;
  alternatePhone?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  district?: string;
}

export interface CreateOrderPayload {
  orderItems: OrderItemPayload[];
  shippingAddress: ShippingAddressPayload;
  paymentMethod: "cod" | "card" | "upi" | "phonepe";
  itemsPrice: number;
  shippingPrice: number;
  taxPrice?: number;
  totalPrice: number;
  discountAmount?: number;
  orderNotes?: string;
  giftWrap?: boolean;
  giftMessage?: string;
  promoCode?: string;
  email?: string;
}

/**
 * Creates order via backend API with authentication & device tracking
 */
export async function createOrder(payload: CreateOrderPayload, token?: string | null) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (typeof window !== "undefined") {
    headers["x-device-id"] = getOrCreateDeviceId();
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(api.orders, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to create order (${res.status})`);
  }

  return await res.json();
}

/**
 * Fetch customer orders for currently logged in user
 */
export async function getCustomerOrders(token?: string | null) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const finalToken =
    token ||
    (typeof window !== "undefined"
      ? localStorage.getItem("nk_shoes_token") || localStorage.getItem("nk_token")
      : null);
  if (finalToken) {
    headers["Authorization"] = `Bearer ${finalToken}`;
  }

  const res = await fetch(`${api.orders}/my-orders`, {
    method: "GET",
    headers,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to load orders");
  }

  return await res.json();
}

/**
 * Cancel order by customer if eligible
 */
export async function cancelCustomerOrder(
  orderId: string,
  reason?: string,
  notes?: string,
  token?: string | null
) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const finalToken =
    token ||
    (typeof window !== "undefined"
      ? localStorage.getItem("nk_shoes_token") || localStorage.getItem("nk_token")
      : null);
  if (finalToken) {
    headers["Authorization"] = `Bearer ${finalToken}`;
  }

  const res = await fetch(`${api.orders}/${orderId}/cancel`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ reason, notes }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to cancel order");
  }

  return await res.json();
}

/**
 * Fetch a single order by ID
 */
export async function getOrderById(orderId: string, token?: string | null) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const finalToken =
    token ||
    (typeof window !== "undefined"
      ? localStorage.getItem("nk_shoes_token") || localStorage.getItem("nk_token")
      : null);
  if (finalToken) {
    headers["Authorization"] = `Bearer ${finalToken}`;
  }

  const res = await fetch(`${api.orders}/${orderId}`, {
    method: "GET",
    headers,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch order details");
  }

  return await res.json();
}

