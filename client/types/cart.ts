import { Product } from "./product";
import { StoreSettings, CouponDefinition } from "./settings";

export interface CartItem {
  id: string; // unique line item id, e.g. `${product.id}-${size}-${color}`
  product: Product;
  size: string;
  color: string;
  quantity: number;
  price: number;
  originalPrice?: number;
  image: string;
}

export interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (
    product: Product,
    size: string,
    color?: string,
    quantity?: number,
    image?: string
  ) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;

  // Order Enhancements
  orderNotes: string;
  setOrderNotes: (notes: string) => void;
  isGiftWrap: boolean;
  setIsGiftWrap: (val: boolean) => void;
  giftMessage: string;
  setGiftMessage: (msg: string) => void;

  // Store Settings & Config
  storeSettings: StoreSettings;
  availableCoupons: CouponDefinition[];

  // Promo Code
  promoCode: string;
  discountAmount: number;
  discountPercent: number;
  appliedPromo: string | null;
  applyPromo: (code: string, email?: string) => Promise<boolean>;
  removePromo: () => void;

  // Computed Totals & Config-Aware Calculators
  totalCount: number;
  subtotal: number;
  shippingFee: number;
  freeShippingThreshold: number;
  freeShippingRemaining: number;
  total: number;
  getShippingFeeForMethod: (paymentMethod?: "cod" | "phonepe" | "upi" | "card") => number;
  getCodFeeForMethod: (paymentMethod?: "cod" | "phonepe" | "upi" | "card") => number;
  getPrepaidDiscountForMethod: (paymentMethod?: "cod" | "phonepe" | "upi" | "card") => number;
  calculateTotalForMethod: (paymentMethod?: "cod" | "phonepe" | "upi" | "card") => number;
}

