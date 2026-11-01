export interface CouponDefinition {
  code: string;
  discountPercent: number;
  description: string;
  minOrderAmount?: number;
  tag?: string;
  isNewUserOnly?: boolean;
}

export interface StoreAnnouncementSettings {
  enabled: boolean;
  badgeText: string;
  desktopText: string;
  mobileText: string;
  couponCode: string;
  discountPercent?: number;
  targetDate: string;
  timerEndDate?: string;
  showTimer?: boolean;
  primaryColor?: string;
  secondaryColor?: string;
}

export interface StoreShippingSettings {
  freeShippingThreshold: number;
  standardShippingFee: number;
  giftWrapFee: number;
}

export interface StorePaymentSettings {
  prepaidEnabled?: boolean;
  prepaidFreeShipping: boolean;
  prepaidDiscountPercent: number;
  codEnabled: boolean;
  codFee: number;
  codMinAmount: number;
  codMaxAmount: number;
  codFreeAbove: number;
  phonepeEnv?: "SANDBOX" | "PRODUCTION";
  phonepeClientId?: string;
  phonepeClientSecret?: string;
  phonepeClientVersion?: number;
}

export interface StoreSettings {
  announcement: StoreAnnouncementSettings;
  coupons: CouponDefinition[];
  shipping: StoreShippingSettings;
  payment: StorePaymentSettings;
}

export const EMPTY_STORE_SETTINGS: StoreSettings = {
  announcement: {
    enabled: false,
    badgeText: "",
    desktopText: "",
    mobileText: "",
    couponCode: "",
    targetDate: "",
    showTimer: true,
  },
  coupons: [],
  shipping: {
    freeShippingThreshold: 2999,
    standardShippingFee: 199,
    giftWrapFee: 99,
  },
  payment: {
    prepaidEnabled: true,
    prepaidFreeShipping: true,
    prepaidDiscountPercent: 0,
    codEnabled: true,
    codFee: 0,
    codMinAmount: 0,
    codMaxAmount: 25000,
    codFreeAbove: 1999,
    phonepeEnv: "SANDBOX",
  },
};

