"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import {
  RiShieldCheckLine,
  RiTruckLine,
  RiCheckLine,
  RiCoupon3Line,
  RiArrowLeftLine,
  RiMoneyDollarCircleLine,
  RiQrCodeLine,
  RiBankCardLine,
  RiSparklingLine,
  RiMapPinLine,
  RiPhoneLine,
  RiAlertLine,
  RiLoader4Line,
  RiPrinterLine,
  RiCheckboxCircleFill,
  RiFlashlightLine,
} from "react-icons/ri";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/common/loader";
import { useCart } from "@/context/cart-context";
import { useAuth } from "@/context/auth-context";
import { formatPrice, cn } from "@/lib/utils";
import {
  verifyIndianPincode,
  validateIndianPhone,
  createOrder,
  CreateOrderPayload,
  PincodeVerificationResult,
} from "@/services/orderService";
import { TaxInvoiceModal } from "@/components/order/tax-invoice";

export default function CheckoutPage() {
  const router = useRouter();
  const { user, token, isLoggedIn, isHydrated } = useAuth();
  const {
    items,
    subtotal,
    total,
    shippingFee,
    discountAmount,
    appliedPromo,
    applyPromo,
    removePromo,
    isGiftWrap,
    setIsGiftWrap,
    orderNotes,
    setOrderNotes,
    giftMessage,
    setGiftMessage,
    clearCart,
    storeSettings,
    availableCoupons,
    getShippingFeeForMethod,
    getCodFeeForMethod,
    getPrepaidDiscountForMethod,
    calculateTotalForMethod,
  } = useCart();

  const [promoInput, setPromoInput] = useState("");
  const [promoError, setPromoError] = useState("");

  // =========================================================================
  // FORM STATE
  // =========================================================================
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    alternatePhone: "",
    address: "",
    landmark: "",
    city: "",
    state: "",
    district: "",
    pincode: "",
    locality: "",
  });

  // =========================================================================
  // INDIAN PINCODE VERIFICATION STATE (PUBLIC API)
  // =========================================================================
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);
  const [pinVerification, setPinVerification] = useState<PincodeVerificationResult | null>(null);
  const [localitiesList, setLocalitiesList] = useState<string[]>([]);

  // Function to verify Indian PIN code via public postal API
  const handleVerifyPincode = useCallback(async (pinToVerify: string) => {
    if (!pinToVerify || pinToVerify.length !== 6 || !/^\d{6}$/.test(pinToVerify)) {
      setPinVerification(null);
      setLocalitiesList([]);
      return;
    }

    setIsVerifyingPin(true);
    try {
      const result = await verifyIndianPincode(pinToVerify);
      setPinVerification(result);

      if (result.valid) {
        setFormData((prev) => ({
          ...prev,
          city: result.city || result.district || prev.city,
          state: result.state || prev.state,
          district: result.district || prev.district,
          locality: result.localities?.[0] || prev.locality,
        }));
        setLocalitiesList(result.localities || []);
        toast.success(`Verified: ${result.city}, ${result.state}`);
      } else {
        toast.error(result.message || "Invalid Indian PIN code");
      }
    } catch {
      setPinVerification({
        valid: false,
        pincode: pinToVerify,
        message: "Failed to verify PIN code",
      });
    } finally {
      setIsVerifyingPin(false);
    }
  }, []);

  // Pre-fill user details if logged in
  useEffect(() => {
    if (user) {
      const defaultAddr = user.addresses?.find((a) => a.isDefault) || user.addresses?.[0];
      setFormData((prev) => ({
        ...prev,
        fullName: prev.fullName || user.name || defaultAddr?.fullName || "",
        email: prev.email || user.email || "",
        phone: prev.phone || user.phone || defaultAddr?.phone || "",
        address: prev.address || defaultAddr?.addressLine1 || "",
        landmark: prev.landmark || defaultAddr?.addressLine2 || "",
        city: prev.city || defaultAddr?.city || "",
        state: prev.state || defaultAddr?.state || "",
        pincode: prev.pincode || defaultAddr?.pincode || "",
      }));
      if (defaultAddr?.pincode) {
        handleVerifyPincode(defaultAddr.pincode);
      }
    }
  }, [user, handleVerifyPincode]);

  // Handle PIN input with auto-verify on 6 digits
  const handlePincodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, "").slice(0, 6);
    setFormData((prev) => ({ ...prev, pincode: rawVal }));

    if (rawVal.length === 6) {
      handleVerifyPincode(rawVal);
    } else {
      setPinVerification(null);
      setLocalitiesList([]);
    }
  };

  // =========================================================================
  // PHONE NUMBER & EXTRA / ALTERNATE NUMBER VALIDATION
  // =========================================================================
  const phoneValidation = useMemo(() => {
    if (!formData.phone) return { valid: false, formatted: "", message: "" };
    return validateIndianPhone(formData.phone);
  }, [formData.phone]);

  const altPhoneValidation = useMemo(() => {
    if (!formData.alternatePhone) return { valid: true, formatted: "", message: "" };
    return validateIndianPhone(formData.alternatePhone);
  }, [formData.alternatePhone]);

  // =========================================================================
  // PAYMENT & ORDER SUBMISSION STATE
  // =========================================================================
  const [paymentMethod, setPaymentMethod] = useState<"phonepe" | "cod">("phonepe");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<any>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  // Auto-switch payment method based on active methods in admin store settings
  useEffect(() => {
    const isPrepaidActive = storeSettings?.payment?.prepaidEnabled !== false;
    const isCodActive = storeSettings?.payment?.codEnabled !== false;

    if (!isCodActive && paymentMethod === "cod" && isPrepaidActive) {
      setPaymentMethod("phonepe");
    } else if (!isPrepaidActive && paymentMethod === "phonepe" && isCodActive) {
      setPaymentMethod("cod");
    }
  }, [storeSettings?.payment?.codEnabled, storeSettings?.payment?.prepaidEnabled, paymentMethod]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Dynamic method-specific calculations based on MongoDB store settings
  const currentShippingFee = getShippingFeeForMethod(paymentMethod);
  const currentCodFee = getCodFeeForMethod(paymentMethod);
  const currentPrepaidDiscount = getPrepaidDiscountForMethod(paymentMethod);
  const currentTotal = calculateTotalForMethod(paymentMethod);

  const handleApplyCoupon = async (e: React.MouseEvent) => {
    e.preventDefault();
    setPromoError("");
    const code = promoInput.trim();
    if (!code) {
      toast.error("Please enter a promo code");
      return;
    }
    const success = await applyPromo(code, formData.email);
    if (success) {
      setPromoInput("");
    } else {
      setPromoError("Invalid coupon code");
    }
  };

  const handleQuickApply = async (code: string) => {
    setPromoError("");
    await applyPromo(code, formData.email);
  };

  const handleRemoveCoupon = (e: React.MouseEvent) => {
    e.preventDefault();
    removePromo();
    toast.success("Coupon removed");
  };

  // =========================================================================
  // SUBMIT END-TO-END ORDER TO BACKEND
  // =========================================================================
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      toast.error("Your bag is empty");
      return;
    }

    if (!formData.fullName.trim()) {
      toast.error("Please enter your Full Name");
      return;
    }

    if (!formData.email.trim() || !formData.email.includes("@")) {
      toast.error("Please enter a valid Email address");
      return;
    }

    // Validate Primary Phone
    if (!phoneValidation.valid) {
      toast.error(phoneValidation.message || "Enter a valid phone number");
      return;
    }

    // Validate Alternate Phone if entered
    if (formData.alternatePhone && !altPhoneValidation.valid) {
      toast.error(altPhoneValidation.message || "Enter a valid phone number");
      return;
    }

    if (!formData.address.trim()) {
      toast.error("Please enter your complete street / house address");
      return;
    }

    // Validate PIN code
    if (!formData.pincode || formData.pincode.length !== 6) {
      toast.error("Please enter a valid 6-digit PIN code");
      return;
    }

    if (pinVerification && !pinVerification.valid) {
      toast.error("Please enter a valid PIN code");
      return;
    }

    if (!formData.city.trim() || !formData.state.trim()) {
      toast.error("City and State are required. Please verify your PIN code.");
      return;
    }

    if (paymentMethod === "cod") {
      if (storeSettings.payment.codEnabled === false) {
        toast.error("Cash on Delivery is currently disabled. Please select online payment.");
        return;
      }
      if (
        storeSettings.payment.codMaxAmount &&
        subtotal > storeSettings.payment.codMaxAmount
      ) {
        toast.error(
          `Cash on Delivery is only available for orders up to ₹${storeSettings.payment.codMaxAmount.toLocaleString(
            "en-IN"
          )}. Please select PhonePe or UPI.`
        );
        return;
      }
      if (
        storeSettings.payment.codMinAmount &&
        subtotal < storeSettings.payment.codMinAmount
      ) {
        toast.error(
          `Cash on Delivery requires a minimum order of ₹${storeSettings.payment.codMinAmount.toLocaleString(
            "en-IN"
          )}.`
        );
        return;
      }
    }

    setIsPlacingOrder(true);

    try {
      const payload: CreateOrderPayload = {
        orderItems: items.map((item) => ({
          product: (item.product._id || item.product.id || item.product.slug || "") as string,
          name: item.product.name,
          image: item.image || item.product.images[0] || "",
          size: item.size,
          color: item.color,
          quantity: item.quantity,
          price: item.price,
        })),
        shippingAddress: {
          fullName: formData.fullName.trim(),
          phone: phoneValidation.formatted,
          alternatePhone: altPhoneValidation.formatted || undefined,
          addressLine1: formData.address.trim(),
          addressLine2: formData.landmark
            ? `Near ${formData.landmark.trim()}${formData.locality ? `, ${formData.locality}` : ""}`
            : formData.locality || undefined,
          city: formData.city.trim(),
          state: formData.state.trim(),
          pincode: formData.pincode.trim(),
          district: formData.district || formData.city.trim(),
        },
        paymentMethod,
        itemsPrice: subtotal,
        shippingPrice: currentShippingFee,
        totalPrice: currentTotal,
        discountAmount: discountAmount + currentPrepaidDiscount,
        orderNotes,
        giftWrap: isGiftWrap,
        giftMessage,
        promoCode: appliedPromo || undefined,
        email: formData.email.trim(),
      };

      const result = await createOrder(payload, token);

      if (result.checkoutUrl) {
        toast.success("Redirecting to PhonePe Secure Gateway...", {
          icon: "🚀",
          duration: 3000,
        });
        clearCart();
        window.location.href = result.checkoutUrl;
        return;
      }

      setPlacedOrder(result);
      clearCart();
      toast.success("Order Placed Successfully! Your footwear drop is locked in.", {
        duration: 6000,
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to place order. Please try again.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // =========================================================================
  // VIEW: ORDER CONFIRMATION SCREEN
  // =========================================================================
  if (placedOrder) {
    const orderId =
      placedOrder._id ? `NK-ORD-${placedOrder._id.slice(-8).toUpperCase()}` : `NK-${Date.now().toString().slice(-6)}`;
    const orderDate = new Date(placedOrder.createdAt || Date.now()).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <main className="w-full min-h-screen bg-[#FBFBFB] py-12 sm:py-16 font-sans">
        <Container>
          <div className="max-w-2xl mx-auto bg-white p-6 sm:p-10 border border-[#E5E5E5] shadow-sm">
            {/* Success Icon & Header */}
            <div className="text-center pb-6 border-b border-[#ECECEC]">
              <div className="w-16 h-16 rounded-full bg-[#EBF5EC] text-[#2E7D32] flex items-center justify-center mx-auto mb-4 text-3xl">
                <RiCheckboxCircleFill />
              </div>
              <span className="text-[11px] font-bold tracking-[0.2em] text-[#2E7D32] uppercase">
                Payment Verified & Order Placed
              </span>
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#111111] mt-1">
                Thank You, {placedOrder.shippingAddress?.fullName || formData.fullName}!
              </h1>
              <p className="text-xs text-[#707072] mt-2 max-w-md mx-auto">
                Your performance footwear order is confirmed. A live tracking link has been dispatched to{" "}
                <strong>{placedOrder.guestEmail || formData.email}</strong>.
              </p>
            </div>

            {/* Order Reference Card */}
            <div className="my-6 p-4 bg-[#F8F9FA] border border-[#ECECEC] rounded-xs text-xs flex flex-col gap-2.5">
              <div className="flex flex-wrap justify-between items-center font-bold text-[#111]">
                <span className="text-[#666]">Order Reference:</span>
                <span className="font-mono text-sm tracking-wider bg-black text-white px-2.5 py-0.5 rounded-xs">
                  {orderId}
                </span>
              </div>
              <div className="flex justify-between items-center text-[#555]">
                <span>Placed On:</span>
                <span>{orderDate}</span>
              </div>
              <div className="flex justify-between items-center text-[#555]">
                <span>Payment Method:</span>
                <span className="uppercase font-bold text-black">
                  {placedOrder.paymentMethod === "cod"
                    ? "Cash on Delivery (Pay upon arrival)"
                    : placedOrder.paymentMethod === "upi"
                    ? "UPI Express (Verified)"
                    : "Credit / Debit Card"}
                </span>
              </div>
              <div className="flex justify-between items-center text-[#555]">
                <span>Delivery Status:</span>
                <span className="text-[#2E7D32] font-bold flex items-center gap-1">
                  <RiTruckLine /> Processing • Dispatched in 24 Hours
                </span>
              </div>
            </div>

            {/* Verified Delivery Address Card */}
            <div className="p-4 border border-[#EAEAEA] mb-6 text-xs">
              <h3 className="font-bold text-[#111] uppercase tracking-wider mb-2 flex items-center gap-1.5 text-[11px]">
                <RiMapPinLine className="text-sm" /> Verified Shipping Address
              </h3>
              <p className="font-semibold text-black">{placedOrder.shippingAddress?.fullName}</p>
              <p className="text-[#666] mt-0.5">{placedOrder.shippingAddress?.addressLine1}</p>
              {placedOrder.shippingAddress?.addressLine2 && (
                <p className="text-[#666]">{placedOrder.shippingAddress?.addressLine2}</p>
              )}
              <p className="text-[#666] font-medium">
                {placedOrder.shippingAddress?.city}, {placedOrder.shippingAddress?.state} —{" "}
                <span className="font-bold text-black">{placedOrder.shippingAddress?.pincode}</span>
              </p>
              <div className="mt-2.5 pt-2 border-t border-[#F0F0F0] flex flex-wrap gap-4 text-[#555]">
                <span>
                  Primary Phone: <strong>+91 {placedOrder.shippingAddress?.phone}</strong>
                </span>
                {placedOrder.shippingAddress?.alternatePhone && (
                  <span>
                    Alternate: <strong>+91 {placedOrder.shippingAddress?.alternatePhone}</strong>
                  </span>
                )}
              </div>
            </div>

            {/* Ordered Footwear Items Summary */}
            {placedOrder.orderItems && placedOrder.orderItems.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#111] mb-3">
                  Footwear Items ({placedOrder.orderItems.length})
                </h3>
                <div className="divide-y divide-[#F0F0F0] border-t border-b border-[#F0F0F0]">
                  {placedOrder.orderItems.map((item: any, idx: number) => (
                    <div key={idx} className="py-3 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3">
                        {item.image && (
                          <div className="relative w-12 h-12 border border-[#E5E5E5] shrink-0 bg-[#FAFAFA]">
                            <Image src={item.image} alt={item.name} fill className="object-contain p-1" />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-black uppercase">{item.name}</p>
                          <p className="text-[11px] text-[#707072]">
                            Size: <span className="font-bold text-black">{item.size}</span> • {item.color} • Qty:{" "}
                            {item.quantity}
                          </p>
                        </div>
                      </div>
                      <span className="font-bold text-black">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Total Paid / To Pay */}
            <div className="p-4 bg-[#FAFAFA] border border-[#EAEAEA] flex justify-between items-center text-sm font-black text-black">
              <span>{placedOrder.paymentMethod === "cod" ? "Total Payable on Delivery" : "Total Amount Paid"}</span>
              <span className="text-base">{formatPrice(placedOrder.totalPrice)}</span>
            </div>

            {/* Actions */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button
                variant="bag"
                size="default"
                arrow
                onClick={() => router.push("/profile?tab=orders")}
                className="flex-1 h-12 uppercase tracking-wider font-extrabold text-xs"
              >
                Track Order & Status
              </Button>
              <Button
                variant="outline"
                size="default"
                onClick={() => router.push("/products")}
                className="flex-1 h-12 uppercase tracking-wider font-bold text-xs"
              >
                Continue Shopping
              </Button>
              <Button
                variant="outline"
                size="default"
                onClick={() => {
                  if (placedOrder) {
                    setIsInvoiceOpen(true);
                  } else if (typeof window !== "undefined") {
                    window.print();
                  }
                }}
                className="h-12 px-6 uppercase tracking-wider font-bold text-xs flex items-center gap-2 cursor-pointer bg-[#111111] text-white hover:bg-black"
              >
                <RiPrinterLine className="text-base" /> Print Tax Invoice
              </Button>
            </div>
          </div>
        </Container>

        {/* Official Tax Invoice Preview Modal */}
        {placedOrder && (
          <TaxInvoiceModal
            order={placedOrder}
            isOpen={isInvoiceOpen}
            onClose={() => setIsInvoiceOpen(false)}
          />
        )}
      </main>
    );
  }

  // =========================================================================
  // VIEW: EMPTY BAG STATE
  // =========================================================================
  if (items.length === 0) {
    return (
      <main className="w-full min-h-screen bg-[#FBFBFB] py-20 font-sans text-center">
        <Container>
          <div className="max-w-md mx-auto bg-white p-8 border border-[#E5E5E5] shadow-xs">
            <h2 className="text-lg font-black uppercase text-[#111111]">Your Bag is Empty</h2>
            <p className="text-xs text-[#707072] mt-2 mb-6">
              Add your favorite performance sneakers or road runners to your bag before checking out.
            </p>
            <Button
              variant="bag"
              size="default"
              arrow
              onClick={() => router.push("/products")}
              className="h-11 px-8 text-xs uppercase tracking-wider font-extrabold"
            >
              Browse Catalog
            </Button>
          </div>
        </Container>
      </main>
    );
  }

  return (
    <main className="w-full min-h-screen bg-[#FBFBFB] py-8 sm:py-12 font-sans select-none">
      <Container>
        {/* Top Back Link */}
        <div className="mb-6">
          <Link
            href="/cart"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#111111] hover:underline transition-all"
          >
            <RiArrowLeftLine className="text-sm" />
            <span>Back to Bag</span>
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mb-8 gap-2">
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#111111]">
            Express Checkout
          </h1>
          <span className="text-xs text-[#707072]">
            {isLoggedIn ? (
              <span className="font-semibold text-black">✓ Logged in as {user?.email}</span>
            ) : (
              <span>Guest Checkout Available • Fast & Verified Delivery</span>
            )}
          </span>
        </div>

        {/* Dynamic Top Promotion Banner configured from backend MongoDB */}
        {storeSettings?.announcement?.enabled && storeSettings?.announcement?.couponCode && (
          <div className="mb-6 p-4 bg-[#111111] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-l-4 border-[#FA003F] shadow-xs">
            <div className="flex items-center gap-3">
              <span className="bg-[#FA003F] text-white text-[10px] font-black px-2 py-0.5 uppercase tracking-wider">
                {storeSettings.announcement.badgeText || "PROMOTION"}
              </span>
              <p className="text-xs font-semibold">
                {storeSettings.announcement.desktopText || "Special drop promotion active!"}{" "}
                <span className="font-mono font-bold tracking-widest text-[#FFD700]">
                  [{storeSettings.announcement.couponCode}]
                </span>
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {appliedPromo === storeSettings.announcement.couponCode ? (
                <span className="text-xs font-black text-[#4ADE80] uppercase tracking-wider flex items-center gap-1">
                  ✓ Code Applied
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleQuickApply(storeSettings.announcement.couponCode)}
                  className="px-3.5 py-1.5 bg-white text-black text-xs font-black uppercase tracking-wider hover:bg-[#FA003F] hover:text-white transition-colors cursor-pointer"
                >
                  Apply Code
                </button>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* =========================================================
              LEFT COLUMN: ADDRESS + VERIFICATION + PAYMENT
              ========================================================= */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* 1. SHIPPING ADDRESS */}
            <div className="bg-white p-6 border border-[#E5E5E5] shadow-2xs">
              <div className="flex items-center justify-between pb-3 border-b border-[#F0F0F0] mb-4">
                <h2 className="text-sm font-black uppercase tracking-wider text-[#111111]">
                  1. Delivery Address & Verified Contact
                </h2>
                <span className="text-[11px] font-bold text-[#2E7D32] flex items-center gap-1">
                  <RiShieldCheckLine /> India Post Verified
                </span>
              </div>

              {/* Quick Select from Saved Addresses */}
              {user?.addresses && user.addresses.length > 0 && (
                <div className="mb-4 p-3 bg-[#F9F9F9] border border-[#E5E5E5] text-xs">
                  <span className="font-bold text-[#111111] uppercase block mb-2">
                    Quick Fill from Saved Addresses:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {user.addresses.map((addr, idx) => (
                      <button
                        key={addr._id || idx}
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            fullName: addr.fullName,
                            phone: addr.phone,
                            address: addr.addressLine1,
                            landmark: addr.addressLine2 || "",
                            city: addr.city,
                            state: addr.state,
                            pincode: addr.pincode,
                          }));
                          handleVerifyPincode(addr.pincode);
                        }}
                        className="px-3 py-1.5 bg-white border border-[#D0D0D0] hover:border-black text-[11px] font-bold uppercase transition-colors text-left cursor-pointer"
                      >
                        {addr.fullName} • {addr.city} ({addr.pincode})
                        {addr.isDefault && " [DEFAULT]"}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Full Name */}
                <div>
                  <label className="block font-bold text-[#111111] uppercase tracking-wide mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    name="fullName"
                    placeholder="e.g. Vikram Sharma"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full p-2.5 border border-[#D0D0D0] focus:border-black outline-none bg-white text-black"
                  />
                </div>

                {/* Email Address */}
                <div>
                  <label className="block font-bold text-[#111111] uppercase tracking-wide mb-1">
                    Email Address (Order Tracking) *
                  </label>
                  <input
                    type="email"
                    required
                    name="email"
                    placeholder="athlete@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full p-2.5 border border-[#D0D0D0] focus:border-black outline-none bg-white text-black"
                  />
                </div>

                {/* Primary Mobile Number (with Indian 10-digit validation) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-[#111111] uppercase tracking-wide">
                      Mobile Number *
                    </label>
                    {formData.phone && (
                      <span
                        className={cn(
                          "text-[10px] font-bold",
                          phoneValidation.valid ? "text-[#2E7D32]" : "text-[#C62828]"
                        )}
                      >
                        {phoneValidation.valid ? "✓ Valid Number" : "Enter a valid number"}
                      </span>
                    )}
                  </div>
                  <div className="flex">
                    <span className="inline-flex items-center px-2.5 text-xs border border-r-0 border-[#D0D0D0] bg-[#F5F5F5] text-[#111111] font-bold">
                      🇮🇳 +91
                    </span>
                    <input
                      type="tel"
                      required
                      name="phone"
                      placeholder="9876543210"
                      maxLength={10}
                      inputMode="numeric"
                      value={formData.phone}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                        setFormData((prev) => ({ ...prev, phone: digits }));
                      }}
                      className={cn(
                        "w-full p-2.5 border outline-none bg-white text-black transition-colors",
                        formData.phone && phoneValidation.valid
                          ? "border-[#2E7D32]"
                          : formData.phone && !phoneValidation.valid
                          ? "border-[#C62828]"
                          : "border-[#D0D0D0] focus:border-black"
                      )}
                    />
                  </div>
                </div>

                {/* Extra / Alternate Contact Number (Verified) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-[#111111] uppercase tracking-wide">
                      Alternate Phone (Optional)
                    </label>
                    {formData.alternatePhone && (
                      <span
                        className={cn(
                          "text-[10px] font-bold",
                          altPhoneValidation.valid ? "text-[#2E7D32]" : "text-[#C62828]"
                        )}
                      >
                        {altPhoneValidation.valid ? "✓ Valid Number" : "Enter a valid number"}
                      </span>
                    )}
                  </div>
                  <div className="flex">
                    <span className="inline-flex items-center px-2.5 text-xs border border-r-0 border-[#D0D0D0] bg-[#F5F5F5] text-[#111111] font-bold">
                      🇮🇳 +91
                    </span>
                    <input
                      type="tel"
                      name="alternatePhone"
                      placeholder="Courier Backup Call"
                      maxLength={10}
                      inputMode="numeric"
                      value={formData.alternatePhone}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                        setFormData((prev) => ({ ...prev, alternatePhone: digits }));
                      }}
                      className={cn(
                        "w-full p-2.5 border outline-none bg-white text-black transition-colors",
                        formData.alternatePhone && altPhoneValidation.valid
                          ? "border-[#2E7D32]"
                          : formData.alternatePhone && !altPhoneValidation.valid
                          ? "border-[#C62828]"
                          : "border-[#D0D0D0] focus:border-black"
                      )}
                    />
                  </div>
                </div>

                {/* Street Address */}
                <div className="sm:col-span-2">
                  <label className="block font-bold text-[#111111] uppercase tracking-wide mb-1">
                    Flat, House No., Building, Street Name *
                  </label>
                  <input
                    type="text"
                    required
                    name="address"
                    placeholder="e.g. Flat 402, Highline Residency, 14th Road"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full p-2.5 border border-[#D0D0D0] focus:border-black outline-none bg-white text-black"
                  />
                </div>

                {/* Indian PIN Code (Auto-Verifying with Public India Post API) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-[#111111] uppercase tracking-wide">
                      PIN Code (6 Digits) *
                    </label>
                    {isVerifyingPin && (
                      <span className="text-[10px] text-[#0066CC] font-bold flex items-center gap-1">
                        <RiLoader4Line className="animate-spin text-xs" /> Verifying PIN Code...
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      name="pincode"
                      maxLength={6}
                      inputMode="numeric"
                      placeholder="e.g. 400050"
                      value={formData.pincode}
                      onChange={handlePincodeChange}
                      className={cn(
                        "w-full p-2.5 border outline-none bg-white text-black font-mono tracking-wider transition-colors",
                        pinVerification?.valid
                          ? "border-[#2E7D32] pr-8"
                          : pinVerification && !pinVerification.valid
                          ? "border-[#C62828]"
                          : "border-[#D0D0D0] focus:border-black"
                      )}
                    />
                    {pinVerification?.valid && (
                      <RiCheckLine className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#2E7D32] text-base" />
                    )}
                  </div>
                </div>

                {/* Landmark / Colony Area */}
                <div>
                  <label className="block font-bold text-[#111111] uppercase tracking-wide mb-1">
                    Landmark / Colony (Optional)
                  </label>
                  <input
                    type="text"
                    name="landmark"
                    placeholder="e.g. Near National Park"
                    value={formData.landmark}
                    onChange={handleInputChange}
                    className="w-full p-2.5 border border-[#D0D0D0] focus:border-black outline-none bg-white text-black"
                  />
                </div>

                {/* City (Auto-populated from PIN code) */}
                <div>
                  <label className="block font-bold text-[#111111] uppercase tracking-wide mb-1">
                    City / District *
                  </label>
                  <input
                    type="text"
                    required
                    name="city"
                    placeholder="e.g. Mumbai"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full p-2.5 border border-[#D0D0D0] focus:border-black outline-none bg-white text-black"
                  />
                </div>

                {/* State (Auto-populated from PIN code) */}
                <div>
                  <label className="block font-bold text-[#111111] uppercase tracking-wide mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    required
                    name="state"
                    placeholder="e.g. Maharashtra"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full p-2.5 border border-[#D0D0D0] focus:border-black outline-none bg-white text-black"
                  />
                </div>

                {/* Locality Dropdown from Verified Postal Data */}
                {localitiesList.length > 0 && (
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-[#111111] uppercase tracking-wide mb-1">
                      Post Office / Locality in {formData.pincode}
                    </label>
                    <select
                      name="locality"
                      value={formData.locality}
                      onChange={handleInputChange}
                      className="w-full p-2.5 border border-[#D0D0D0] focus:border-black outline-none bg-white text-black cursor-pointer text-xs"
                    >
                      {localitiesList.map((loc, idx) => (
                        <option key={idx} value={loc}>
                          {loc}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* PIN Code Verification Banner */}
              {pinVerification?.valid && (
                <div className="mt-4 p-3 bg-[#EBF5EC] border border-[#C8E6C9] flex items-center gap-2 text-xs text-[#2E7D32] font-semibold">
                  <RiCheckLine className="text-base shrink-0" />
                  <span>
                    ✓ Verified: <strong>{pinVerification.city}</strong>,{" "}
                    <strong>{pinVerification.state}</strong>. Express Metro delivery available!
                  </span>
                </div>
              )}

              {pinVerification && !pinVerification.valid && (
                <div className="mt-4 p-3 bg-[#FFEBEE] border border-[#FFCDD2] flex items-center gap-2 text-xs text-[#C62828] font-semibold">
                  <RiAlertLine className="text-base shrink-0" />
                  <span>{pinVerification.message || "Invalid PIN code. Please check the 6 digits."}</span>
                </div>
              )}

              {/* Delivery Timeline Pill */}
              <div className="mt-4 p-3 bg-[#F4F8F4] border border-[#D5E8D4] flex items-center gap-2 text-xs text-[#2E7D32] font-semibold">
                <RiTruckLine className="text-base shrink-0" />
                <span>Standard Delivery: 2–3 Business Days via Express Tracked Courier</span>
              </div>
            </div>

            {/* 2. PAYMENT METHODS */}
            <div className="bg-white p-6 border border-[#E5E5E5] shadow-2xs">
              <h2 className="text-sm font-black uppercase tracking-wider text-[#111111] pb-3 border-b border-[#F0F0F0] mb-4">
                2. Select Payment Method
              </h2>

              <div className="flex flex-col gap-3 text-xs">
                {/* Option 1: Prepaid (PhonePe Official Gateway) - Rendered only if active in Admin Settings */}
                {storeSettings?.payment?.prepaidEnabled !== false && (
                  <label
                    className={cn(
                      "flex items-center justify-between p-3.5 border cursor-pointer transition-all",
                      paymentMethod === "phonepe"
                        ? "border-[#5F259F] bg-[#FAF5FF] ring-1 ring-[#5F259F]"
                        : "border-[#DCDCDC] hover:border-[#888]"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="phonepe"
                        checked={paymentMethod === "phonepe"}
                        onChange={() => setPaymentMethod("phonepe")}
                        className="accent-[#5F259F] w-4 h-4 cursor-pointer"
                      />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-[#111111] block">
                            Prepaid (UPI / Cards / NetBanking)
                          </span>
                          <span className="bg-[#5F259F] text-white text-[9px] font-black px-1.5 py-0.2 rounded-xs uppercase tracking-wider">
                            PhonePe Secure
                          </span>
                          {storeSettings?.payment?.prepaidFreeShipping && (
                            <span className="bg-[#E8F5E9] text-[#2E7D32] text-[9px] font-black px-1.5 py-0.2 rounded-xs uppercase tracking-wider">
                              Free Delivery
                            </span>
                          )}
                          {(storeSettings?.payment?.prepaidDiscountPercent ?? 0) > 0 && (
                            <span className="bg-[#FFF3E0] text-[#E65100] text-[9px] font-black px-1.5 py-0.2 rounded-xs uppercase tracking-wider">
                              Extra {storeSettings.payment.prepaidDiscountPercent}% Off
                            </span>
                          )}
                        </div>
                        <span className="text-[#707072] text-[11px] block mt-0.5">
                          Instant payment via PhonePe: Google Pay, PhonePe, Paytm, BHIM, Cards & NetBanking
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#5F259F] font-black">
                      <RiFlashlightLine className="text-lg" />
                      <span className="text-[11px] uppercase tracking-wider hidden sm:inline">Instant Pay</span>
                    </div>
                  </label>
                )}

                {/* Option 2: Cash on Delivery (Rendered ONLY if active in Admin Settings) */}
                {storeSettings?.payment?.codEnabled !== false && (
                  <label
                    className={cn(
                      "flex items-center justify-between p-3.5 border cursor-pointer transition-all",
                      paymentMethod === "cod"
                        ? "border-black bg-[#FAFAFA] ring-1 ring-black"
                        : "border-[#DCDCDC] hover:border-[#888]"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cod"
                        checked={paymentMethod === "cod"}
                        onChange={() => setPaymentMethod("cod")}
                        className="accent-black w-4 h-4 cursor-pointer"
                      />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-[#111111] block">Cash on Delivery (COD)</span>
                          {(storeSettings?.payment?.codFee ?? 0) === 0 || subtotal >= (storeSettings?.payment?.codFreeAbove ?? 1999) ? (
                            <span className="bg-[#E8F5E9] text-[#2E7D32] text-[9px] font-black px-1.5 py-0.2 rounded-xs uppercase tracking-wider">
                              Free COD
                            </span>
                          ) : (
                            <span className="bg-[#FFF3E0] text-[#E65100] text-[9px] font-black px-1.5 py-0.2 rounded-xs uppercase tracking-wider">
                              +₹{storeSettings?.payment?.codFee} Fee
                            </span>
                          )}
                        </div>
                        <span className="text-[#707072] text-[11px] block mt-0.5">
                          {(storeSettings?.payment?.codFee ?? 0) === 0 || subtotal >= (storeSettings?.payment?.codFreeAbove ?? 1999)
                            ? "Pay cash or UPI at your doorstep upon arrival"
                            : `Pay cash or UPI at doorstep (+₹${storeSettings?.payment?.codFee} handling fee. Free on orders above ₹${storeSettings?.payment?.codFreeAbove?.toLocaleString("en-IN")})`}
                        </span>
                      </div>
                    </div>
                    <RiMoneyDollarCircleLine className="text-2xl text-[#111111]" />
                  </label>
                )}
              </div>
            </div>

            {/* 3. OPTIONAL ORDER INSTRUCTIONS & GIFT WRAP */}
            <div className="bg-white p-6 border border-[#E5E5E5] shadow-2xs space-y-4 text-xs">
              <h2 className="text-sm font-black uppercase tracking-wider text-[#111111] pb-2 border-b border-[#F0F0F0]">
                3. Delivery Instructions & Gifting
              </h2>

              <div>
                <label className="block font-bold text-[#111111] uppercase tracking-wide mb-1">
                  Delivery Instructions (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Leave with security guard / Call before arriving"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="w-full p-2.5 border border-[#D0D0D0] focus:border-black outline-none bg-white text-black"
                />
              </div>

              {/* Gift Packaging Checkbox */}
              <div className="pt-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isGiftWrap}
                    onChange={(e) => setIsGiftWrap(e.target.checked)}
                    className="accent-black w-4 h-4 mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-black flex items-center gap-1.5">
                      <RiSparklingLine className="text-base text-[#D4AF37]" /> Add NK-SHOES Matte Black Gift
                      Box (+₹{storeSettings?.shipping?.giftWrapFee || 99})
                    </span>
                    <span className="text-[11px] text-[#707072] block">
                      Includes branded magnetic shoe box and custom greeting card
                    </span>
                  </div>
                </label>

                {isGiftWrap && (
                  <div className="mt-3 pl-6">
                    <input
                      type="text"
                      placeholder="Write your greeting message..."
                      value={giftMessage}
                      onChange={(e) => setGiftMessage(e.target.value)}
                      className="w-full p-2 border border-[#D0D0D0] focus:border-black outline-none bg-white text-black text-xs"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* =========================================================
              RIGHT COLUMN: ORDER SUMMARY & PROMO BREAKDOWN
              ========================================================= */}
          <div className="lg:col-span-5">
            <div className="bg-white p-6 border border-[#E5E5E5] shadow-xs sticky top-28 flex flex-col gap-5">
              <h2 className="text-sm font-black uppercase tracking-wider text-[#111111] pb-3 border-b border-[#F0F0F0]">
                Order Summary ({items.length} {items.length === 1 ? "Style" : "Styles"})
              </h2>

              {/* Items List */}
              <div className="flex flex-col gap-3.5 max-h-72 overflow-y-auto pr-1 divide-y divide-[#F2F2F2]">
                {items.map((item) => (
                  <div key={item.id} className="pt-3 first:pt-0 flex gap-3 items-center">
                    <div className="relative w-16 h-16 studio-showroom-canvas shrink-0 border border-[#EAEAEA]">
                      <Image
                        src={item.image || item.product.images[0]}
                        alt={item.product.name}
                        fill
                        className="object-contain p-1"
                      />
                    </div>
                    <div className="flex-1 min-w-0 text-xs">
                      <h4 className="font-bold uppercase text-[#111] truncate">{item.product.name}</h4>
                      <p className="text-[11px] text-[#707072]">
                        Size: <span className="font-bold text-black">{item.size}</span> • {item.color}
                      </p>
                      <p className="text-[11px] text-[#707072]">Qty: {item.quantity}</p>
                    </div>
                    <span className="text-xs font-bold text-[#111]">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Promo Code Input & Status */}
              <div className="pt-2">
                {appliedPromo ? (
                  <div className="p-3 bg-[#F4FAF5] border border-[#C8E6C9] text-xs text-[#2E7D32] flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5">
                      <RiCoupon3Line className="text-base" /> Code '{appliedPromo}' Active
                    </span>
                    <div className="flex items-center gap-3">
                      <span>-{formatPrice(discountAmount)}</span>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-xs text-[#B71C1C] hover:underline uppercase tracking-wide font-black"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value)}
                        placeholder="Enter promo code"
                        className="flex-1 text-xs uppercase px-3 py-2.5 border border-[#D5D5D5] focus:border-black outline-none tracking-wider font-semibold placeholder:normal-case placeholder:font-normal placeholder:text-[#999]"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        className="px-4 py-2.5 bg-[#111111] text-white text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors"
                      >
                        Apply
                      </button>
                    </div>
                    {promoError && <span className="text-[11px] text-[#B71C1C]">{promoError}</span>}

                    {/* Available Backend MongoDB Coupons List */}
                    {availableCoupons && availableCoupons.length > 0 && (
                      <div className="pt-2.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#707072] block mb-1.5">
                          Available Offers (Click to Apply)
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {availableCoupons.map((c) => (
                            <button
                              key={c.code}
                              type="button"
                              onClick={() => handleQuickApply(c.code)}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#F7F7F7] border border-[#E0E0E0] hover:border-black hover:bg-black hover:text-white transition-all text-left text-[11px] group cursor-pointer"
                            >
                              <span className="font-mono font-black text-black group-hover:text-white">
                                {c.code}
                              </span>
                              <span className="text-[10px] text-[#2E7D32] group-hover:text-[#4ADE80] font-bold">
                                ({c.discountPercent}% OFF)
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="pt-4 border-t border-[#F0F0F0] flex flex-col gap-2 text-xs text-[#666]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold text-[#111]">{formatPrice(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-[#2E7D32] font-semibold">
                    <span>Discount ({appliedPromo})</span>
                    <span>-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                {currentPrepaidDiscount > 0 && (
                  <div className="flex justify-between text-[#2E7D32] font-semibold">
                    <span>Prepaid Instant Savings</span>
                    <span>-{formatPrice(currentPrepaidDiscount)}</span>
                  </div>
                )}
                {isGiftWrap && (
                  <div className="flex justify-between">
                    <span>Gift Packaging</span>
                    <span className="font-bold text-[#111]">+₹{storeSettings?.shipping?.giftWrapFee || 99}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Express Shipping</span>
                  <span>
                    {currentShippingFee === 0 ? (
                      <strong className="text-[#2E7D32]">FREE</strong>
                    ) : (
                      formatPrice(currentShippingFee)
                    )}
                  </span>
                </div>
                {currentCodFee > 0 && (
                  <div className="flex justify-between text-[#B71C1C]">
                    <span>COD Handling Fee</span>
                    <span className="font-bold text-[#B71C1C]">+{formatPrice(currentCodFee)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black text-[#111] pt-3 border-t border-[#F0F0F0]">
                  <span>Total Amount</span>
                  <span>{formatPrice(currentTotal)}</span>
                </div>
              </div>

              {/* Place Order CTA */}
              <Button
                type="submit"
                variant="bag"
                size="default"
                fullWidth
                arrow
                isLoading={isPlacingOrder}
                className={cn(
                  "h-12 uppercase tracking-wider font-extrabold text-xs transition-all",
                  paymentMethod === "phonepe" && "bg-[#5F259F] hover:bg-[#4A1D7C]"
                )}
              >
                {paymentMethod === "phonepe"
                  ? `Pay ${formatPrice(currentTotal)} with PhonePe`
                  : `Place Order Now • ${formatPrice(currentTotal)}`}
              </Button>

              {/* Security Reassurance */}
              <div className="flex items-center justify-center gap-3 text-[11px] text-[#707072] pt-2 border-t border-[#F5F5F5]">
                <span className="flex items-center gap-1">
                  <RiShieldCheckLine className="text-[#111]" /> 100% Genuine
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <RiTruckLine className="text-[#111]" /> Free 7-Day Returns
                </span>
              </div>
            </div>
          </div>
        </form>
      </Container>
    </main>
  );
}
