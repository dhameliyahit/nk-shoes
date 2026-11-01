import { api } from "@/lib/api";
import { StoreSettings, EMPTY_STORE_SETTINGS } from "@/types/settings";

export interface CouponValidationResponse {
  valid: boolean;
  code?: string;
  discountPercent?: number;
  discountAmount?: number;
  description?: string;
  message?: string;
}

/**
 * Fetch live store settings directly from MongoDB backend
 */
export async function fetchStoreSettings(): Promise<StoreSettings> {
  try {
    const res = await fetch(`${api.settings}/public`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (res.ok) {
      const data = await res.json();
      if (data.settings) {
        return {
          announcement: {
            ...EMPTY_STORE_SETTINGS.announcement,
            ...(data.settings.announcement || {}),
          },
          shipping: {
            ...EMPTY_STORE_SETTINGS.shipping,
            ...(data.settings.shipping || {}),
          },
          payment: {
            ...EMPTY_STORE_SETTINGS.payment,
            ...(data.settings.payment || {}),
          },
          coupons: Array.isArray(data.settings.coupons) ? data.settings.coupons : [],
        };
      }
    }
  } catch (error) {
    console.warn("[StoreSettings] Failed to fetch settings from backend:", error);
  }

  return EMPTY_STORE_SETTINGS;
}

/**
 * Validate coupon code directly with the MongoDB backend database
 */
export async function validateCouponApi(
  code: string,
  subtotal: number,
  email?: string
): Promise<CouponValidationResponse> {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("nk_shoes_token") : null;
    const res = await fetch(`${api.settings}/validate-coupon`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ code: code.trim(), subtotal, email }),
    });

    const data = await res.json();
    return data;
  } catch (error: any) {
    return {
      valid: false,
      message: error?.message || "Failed to validate coupon code with server",
    };
  }
}
