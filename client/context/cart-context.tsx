"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import toast from "react-hot-toast";
import { Product } from "@/types/product";
import { CartItem, CartContextType } from "@/types/cart";
import {
  StoreSettings,
  EMPTY_STORE_SETTINGS,
  CouponDefinition,
} from "@/types/settings";
import { fetchStoreSettings, validateCouponApi } from "@/services/settingService";

const CART_STORAGE_KEY = "nk_shoes_cart_v1";

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Live Store Configuration Settings from MongoDB backend
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(
    EMPTY_STORE_SETTINGS
  );

  // Enhancements
  const [orderNotes, setOrderNotes] = useState("");
  const [isGiftWrap, setIsGiftWrap] = useState(false);
  const [giftMessage, setGiftMessage] = useState("");

  // Promo code
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [discountPercent, setDiscountPercent] = useState(0);

  // Load store settings on mount
  useEffect(() => {
    let isMounted = true;
    fetchStoreSettings().then((settings) => {
      if (isMounted && settings) {
        setStoreSettings(settings);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }
    } catch {
      // Ignore parse errors
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore quota errors
    }
  }, [items, isHydrated]);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const toggleCart = useCallback(() => setIsOpen((prev) => !prev), []);

  const addItem = useCallback(
    (
      product: Product,
      size: string,
      color?: string,
      quantity = 1,
      image?: string
    ) => {
      const selectedColor =
        color || (product.colors && product.colors[0]?.name) || "Standard";
      const selectedImage =
        image ||
        (product.images && product.images[0]) ||
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800";
      const lineItemId = `${product.id}-${size}-${selectedColor}`.toLowerCase();

      setItems((prevItems) => {
        const existingIndex = prevItems.findIndex(
          (item) => item.id === lineItemId
        );

        if (existingIndex > -1) {
          const updated = [...prevItems];
          const current = updated[existingIndex];
          if (current) {
            updated[existingIndex] = {
              ...current,
              quantity: current.quantity + quantity,
            };
          }
          return updated;
        }

        const newItem: CartItem = {
          id: lineItemId,
          product,
          size,
          color: selectedColor,
          quantity,
          price: product.price,
          originalPrice: product.originalPrice,
          image: selectedImage,
        };

        return [newItem, ...prevItems];
      });

      // Toast notification (clean, zero emojis)
      toast.success(`Added ${product.name} (${size}) to Bag`, {
        duration: 2500,
      });
    },
    []
  );

  const removeItem = useCallback((itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
    toast.success("Item removed from Bag");
  }, []);

  const updateQuantity = useCallback(
    (itemId: string, newQty: number) => {
      if (newQty <= 0) {
        removeItem(itemId);
        return;
      }
      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, quantity: newQty } : item
        )
      );
    },
    [removeItem]
  );

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  // Computed subtotal
  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  // Promo handling strictly validated via backend database
  const applyPromo = useCallback(
    async (code: string, email?: string): Promise<boolean> => {
      const cleaned = code.trim().toUpperCase();
      if (!cleaned) {
        toast.error("Please enter a coupon code");
        return false;
      }

      // Check directly with backend MongoDB database
      const result = await validateCouponApi(cleaned, subtotal, email);

      if (result.valid && result.code) {
        setAppliedPromo(result.code);
        setDiscountPercent(result.discountPercent || 0);
        toast.success(
          result.message || `Coupon '${result.code}' applied successfully!`
        );
        return true;
      }

      toast.error(result.message || `Coupon '${cleaned}' is invalid or expired`);
      return false;
    },
    [subtotal]
  );

  const removePromo = useCallback(() => {
    setAppliedPromo(null);
    setDiscountPercent(0);
    setPromoCode("");
    toast.success("Promo code removed");
  }, []);

  // Computed Values
  const totalCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const discountAmount = useMemo(
    () =>
      discountPercent > 0
        ? Math.round((subtotal * discountPercent) / 100)
        : 0,
    [subtotal, discountPercent]
  );

  const freeShippingThreshold =
    storeSettings.shipping.freeShippingThreshold || 2999;
  const standardShippingFee =
    storeSettings.shipping.standardShippingFee || 199;
  const giftWrapFee = storeSettings.shipping.giftWrapFee || 99;

  const shippingFee = useMemo(() => {
    if (subtotal === 0) return 0;
    return subtotal >= freeShippingThreshold ? 0 : standardShippingFee;
  }, [subtotal, freeShippingThreshold, standardShippingFee]);

  const freeShippingRemaining = useMemo(() => {
    return Math.max(0, freeShippingThreshold - subtotal);
  }, [subtotal, freeShippingThreshold]);

  // Method-specific calculators
  const getShippingFeeForMethod = useCallback(
    (paymentMethod: "cod" | "phonepe" | "upi" | "card" = "phonepe"): number => {
      if (subtotal === 0) return 0;
      if (
        paymentMethod !== "cod" &&
        storeSettings.payment.prepaidFreeShipping
      ) {
        return 0; // Free express delivery for prepaid orders!
      }
      return subtotal >= freeShippingThreshold ? 0 : standardShippingFee;
    },
    [
      subtotal,
      storeSettings.payment.prepaidFreeShipping,
      freeShippingThreshold,
      standardShippingFee,
    ]
  );

  const getCodFeeForMethod = useCallback(
    (paymentMethod: "cod" | "phonepe" | "upi" | "card" = "phonepe"): number => {
      if (paymentMethod !== "cod" || subtotal === 0) return 0;
      const codFee = storeSettings.payment.codFee || 0;
      if (codFee === 0) return 0;
      const codFreeAbove = storeSettings.payment.codFreeAbove || 1999;
      return subtotal >= codFreeAbove ? 0 : codFee;
    },
    [subtotal, storeSettings.payment.codFee, storeSettings.payment.codFreeAbove]
  );

  const getPrepaidDiscountForMethod = useCallback(
    (paymentMethod: "cod" | "phonepe" | "upi" | "card" = "phonepe"): number => {
      if (paymentMethod === "cod" || subtotal === 0) return 0;
      const percent = storeSettings.payment.prepaidDiscountPercent || 0;
      if (percent <= 0) return 0;
      return Math.round((subtotal * percent) / 100);
    },
    [subtotal, storeSettings.payment.prepaidDiscountPercent]
  );

  const calculateTotalForMethod = useCallback(
    (paymentMethod: "cod" | "phonepe" | "upi" | "card" = "phonepe"): number => {
      if (subtotal === 0) return 0;
      const giftFee = isGiftWrap ? giftWrapFee : 0;
      const shipping = getShippingFeeForMethod(paymentMethod);
      const codFee = getCodFeeForMethod(paymentMethod);
      const prepaidDiscount = getPrepaidDiscountForMethod(paymentMethod);
      return Math.max(
        0,
        subtotal - discountAmount - prepaidDiscount + shipping + codFee + giftFee
      );
    },
    [
      subtotal,
      isGiftWrap,
      giftWrapFee,
      discountAmount,
      getShippingFeeForMethod,
      getCodFeeForMethod,
      getPrepaidDiscountForMethod,
    ]
  );

  const total = useMemo(() => {
    return calculateTotalForMethod("phonepe");
  }, [calculateTotalForMethod]);

  return (
    <CartContext.Provider
      value={{
        items,
        isOpen,
        openCart,
        closeCart,
        toggleCart,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        orderNotes,
        setOrderNotes,
        isGiftWrap,
        setIsGiftWrap,
        giftMessage,
        setGiftMessage,
        storeSettings,
        availableCoupons: storeSettings.coupons,
        promoCode,
        discountAmount,
        discountPercent,
        appliedPromo,
        applyPromo,
        removePromo,
        totalCount,
        subtotal,
        shippingFee,
        freeShippingThreshold,
        freeShippingRemaining,
        total,
        getShippingFeeForMethod,
        getCodFeeForMethod,
        getPrepaidDiscountForMethod,
        calculateTotalForMethod,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
