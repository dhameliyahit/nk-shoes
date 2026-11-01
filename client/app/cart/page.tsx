"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  RiDeleteBinLine,
  RiHeart3Line,
  RiShieldCheckLine,
  RiTruckLine,
  RiArrowRightLine,
  RiCoupon3Line,
  RiCheckLine,
  RiArrowLeftLine,
} from "react-icons/ri";
import toast from "react-hot-toast";
import { useCart } from "@/context/cart-context";
import { useAuth } from "@/context/auth-context";
import { useWishlist } from "@/context/wishlist-context";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

export default function CartPage() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { addToWishlist, isInWishlist } = useWishlist();
  const {
    items,
    removeItem,
    updateQuantity,
    totalCount,
    subtotal,
    shippingFee,
    freeShippingThreshold,
    freeShippingRemaining,
    total,
    appliedPromo,
    discountAmount,
    applyPromo,
    removePromo,
  } = useCart();

  const [promoInput, setPromoInput] = useState("");
  const [promoError, setPromoError] = useState("");

  const freeShippingProgress = Math.min(
    100,
    Math.round((subtotal / freeShippingThreshold) * 100)
  );

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError("");
    const code = promoInput.trim();
    if (!code) return;
    const ok = await applyPromo(code);
    if (ok) {
      setPromoInput("");
    } else {
      setPromoError("Invalid promo code");
    }
  };

  const handleProceedCheckout = () => {
    if (!isLoggedIn) {
      router.push("/register?redirect=/checkout");
    } else {
      router.push("/checkout");
    }
  };

  return (
    <main className="w-full min-h-[calc(100vh-140px)] bg-white font-sans pt-6 pb-20 select-none">
      <Container>
        {/* BREADCRUMB / BACK LINK */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#111111] hover:underline"
          >
            <RiArrowLeftLine className="text-base" />
            <span>Continue Shopping</span>
          </Link>
          <span className="text-xs text-[#767677] uppercase tracking-wider">
            {totalCount} {totalCount === 1 ? "Item" : "Items"} in Bag
          </span>
        </div>

        {items.length === 0 ? (
          /* =========================================================
             EMPTY BAG STATE (Adidas YARN Brutalist-Clean)
             ========================================================= */
          <div className="max-w-2xl mx-auto py-16 text-center border border-[#ECEFF1] bg-[#FAFAFA] p-8 sm:p-14">
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#767677] block mb-2">
              Shopping Bag
            </span>
            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-[#000000] mb-3">
              Your Bag Is Empty
            </h1>
            <p className="text-xs sm:text-sm text-[#767677] max-w-md mx-auto leading-relaxed mb-8">
              There are currently no items in your shopping bag. Explore our signature sneaker silhouettes, performance runners, and newest drops.
            </p>
            <Link href="/products">
              <Button
                variant="bag"
                size="default"
                arrow
                className="h-12 px-8 uppercase tracking-widest font-extrabold text-xs"
              >
                Explore Footwear
              </Button>
            </Link>
          </div>
        ) : (
          /* =========================================================
             ACTIVE BAG: 2-COLUMN LUXURY E-COMMERCE LAYOUT
             ========================================================= */
          <div>
            {/* PAGE TITLE & URGENCY NOTICE */}
            <div className="mb-8">
              <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-[#000000]">
                Your Bag{" "}
                <span className="text-xl sm:text-2xl font-light text-[#767677]">
                  ({totalCount} {totalCount === 1 ? "Item" : "Items"})
                </span>
              </h1>
              <p className="text-xs text-[#767677] mt-1 uppercase tracking-wide">
                Items in your bag are not reserved — check out now to make them yours.
              </p>
            </div>

            {/* FREE EXPRESS SHIPPING PROGRESS BANNER */}
            <div className="mb-8 p-4 bg-[#F5F5F5] border border-[#E5E5E5]">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider mb-2">
                {freeShippingRemaining > 0 ? (
                  <span className="text-[#242424] flex items-center gap-2">
                    <RiTruckLine className="text-base text-black" />
                    Add <strong className="text-black">{formatPrice(freeShippingRemaining)}</strong> more for Free Express Delivery
                  </span>
                ) : (
                  <span className="text-[#000000] flex items-center gap-2">
                    <RiCheckLine className="text-base text-[#2E7D32]" />
                    You unlocked Free Express Shipping on this order!
                  </span>
                )}
                <span className="text-[#767677]">{freeShippingProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-[#E0E0E0] rounded-none overflow-hidden">
                <div
                  className="h-full bg-black transition-all duration-500 ease-out rounded-none"
                  style={{ width: `${freeShippingProgress}%` }}
                />
              </div>
            </div>

            {/* 2-COLUMN MAIN CONTENT */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              {/* =========================================================
                  LEFT COLUMN: HIGH-RESOLUTION BAG ITEMS
                  ========================================================= */}
              <div className="lg:col-span-8 flex flex-col divide-y divide-[#ECEFF1] border-t border-b border-[#ECEFF1]">
                {items.map((item) => {
                  const productSlug = item.product.slug || item.product.id;
                  return (
                    <div
                      key={item.id}
                      className="py-6 first:pt-6 last:pb-6 flex flex-col sm:flex-row gap-5 md:gap-6"
                    >
                      {/* SHOE IMAGE SHOWROOM CANVAS (Aspect-Square, Uncropped, High Visibility) */}
                      <Link
                        href={`/products/${productSlug}`}
                        className="relative w-full sm:w-44 md:w-48 aspect-square bg-[#F5F5F5] border border-[#EAEAEA] shrink-0 overflow-hidden flex items-center justify-center p-3 group"
                      >
                        <Image
                          src={item.image}
                          alt={item.product.name}
                          fill
                          sizes="(max-width: 640px) 100vw, 200px"
                          className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                          priority
                        />
                      </Link>

                      {/* ITEM DETAILS & ACTIONS */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          {/* Row 1: Title & Price */}
                          <div className="flex items-start justify-between gap-4 mb-1">
                            <Link
                              href={`/products/${productSlug}`}
                              className="text-base sm:text-lg font-black uppercase tracking-tight text-[#000000] hover:underline truncate"
                            >
                              {item.product.name}
                            </Link>
                            <span className="text-base sm:text-lg font-black text-[#000000] shrink-0">
                              {formatPrice(item.price * item.quantity)}
                            </span>
                          </div>

                          {/* Subtitle / Category */}
                          <p className="text-xs text-[#767677] uppercase tracking-wider mb-3">
                            {item.product.subtitle || "Performance Footwear"}
                          </p>

                          {/* Specifications (Size & Color) */}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#242424] mb-3">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[#767677] uppercase tracking-wide">Size:</span>
                              <span className="font-bold bg-[#F5F5F5] px-2 py-0.5 border border-[#E0E0E0]">
                                UK {item.size}
                              </span>
                            </div>

                            {item.color && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-[#767677] uppercase tracking-wide">Color:</span>
                                <span className="font-bold">{item.color}</span>
                              </div>
                            )}
                          </div>

                          {/* In-Stock Indicator */}
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2E7D32] uppercase tracking-wider">
                            <RiCheckLine className="text-sm" /> In Stock • Ready to dispatch
                          </span>
                        </div>

                        {/* CONTROLS ROW: Stepper & Remove Actions */}
                        <div className="flex flex-wrap items-center justify-between gap-4 mt-6 pt-4 border-t border-[#F2F2F2]">
                          {/* Adidas YARN Sharp Stepper */}
                          <div className="flex items-center border border-[#000000] bg-white">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              aria-label="Decrease quantity"
                              className="w-9 h-9 flex items-center justify-center text-sm font-bold text-[#000000] hover:bg-[#F5F5F5] transition-colors cursor-pointer"
                            >
                              -
                            </button>
                            <span className="w-10 text-center text-xs font-black text-[#000000]">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              aria-label="Increase quantity"
                              className="w-9 h-9 flex items-center justify-center text-sm font-bold text-[#000000] hover:bg-[#F5F5F5] transition-colors cursor-pointer"
                            >
                              +
                            </button>
                          </div>

                          {/* Action Links */}
                          <div className="flex items-center gap-5 text-xs">
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className="inline-flex items-center gap-1.5 font-bold uppercase tracking-wider text-[#767677] hover:text-[#000000] transition-colors cursor-pointer"
                            >
                              <RiDeleteBinLine className="text-base" />
                              <span>Remove</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                addToWishlist(item.product);
                                toast.success(`Saved ${item.product.name} to Wishlist`);
                              }}
                              className="inline-flex items-center gap-1.5 font-bold uppercase tracking-wider text-[#767677] hover:text-[#000000] transition-colors cursor-pointer"
                            >
                              <RiHeart3Line className={`text-base ${isInWishlist(item.product.id || item.product._id || item.product.slug) ? "text-[#C83224] fill-[#C83224]" : ""}`} />
                              <span>{isInWishlist(item.product.id || item.product._id || item.product.slug) ? "Saved in Wishlist" : "Save for Later"}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* =========================================================
                  RIGHT COLUMN: STICKY ORDER SUMMARY & CHECKOUT
                  ========================================================= */}
              <div className="lg:col-span-4 sticky top-28">
                <div className="bg-[#FAFAFA] border border-[#E5E5E5] p-6 sm:p-7 flex flex-col gap-5">
                  <h2 className="text-base font-black uppercase tracking-wider text-[#000000] pb-3 border-b border-[#E5E5E5]">
                    Order Summary
                  </h2>

                  {/* Pricing Breakdown */}
                  <div className="flex flex-col gap-2.5 text-xs text-[#555]">
                    <div className="flex justify-between">
                      <span className="uppercase tracking-wide">Subtotal ({totalCount} items)</span>
                      <span className="font-bold text-black">{formatPrice(subtotal)}</span>
                    </div>

                    {discountAmount > 0 && (
                      <div className="flex justify-between text-[#2E7D32] font-bold">
                        <span>Promo Discount ({appliedPromo})</span>
                        <span>-{formatPrice(discountAmount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span className="uppercase tracking-wide">Estimated Shipping</span>
                      <span className="font-bold text-black">
                        {shippingFee === 0 ? (
                          <strong className="text-[#2E7D32]">FREE</strong>
                        ) : (
                          formatPrice(shippingFee)
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between text-[11px] text-[#767677]">
                      <span>Estimated Taxes</span>
                      <span>Included in MRP</span>
                    </div>

                    <div className="pt-3 border-t border-[#E5E5E5] flex justify-between items-baseline text-lg font-black text-black">
                      <span className="uppercase tracking-wider">Total</span>
                      <span>{formatPrice(total)}</span>
                    </div>
                  </div>

                  {/* Promo Code Input Accordion */}
                  <div className="pt-3 border-t border-[#E5E5E5]">
                    {appliedPromo ? (
                      <div className="p-3 bg-[#EBF5EC] border border-[#C8E6C9] text-xs text-[#2E7D32] flex items-center justify-between font-bold">
                        <span className="flex items-center gap-1.5 uppercase">
                          <RiCoupon3Line className="text-base" /> Code '{appliedPromo}' Active
                        </span>
                        <button
                          type="button"
                          onClick={removePromo}
                          className="text-xs text-[#C83224] hover:underline uppercase tracking-wide font-black"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleApplyPromo} className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-[#000000]">
                          Promotional Code
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={promoInput}
                            onChange={(e) => setPromoInput(e.target.value)}
                            placeholder="Enter promo code"
                            className="flex-1 text-xs uppercase px-3 py-2.5 border border-[#D5D5D5] bg-white focus:border-black outline-none font-bold tracking-wider rounded-none placeholder:text-[#999999]"
                          />
                          <button
                            type="submit"
                            className="px-4 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-[#222] transition-colors rounded-none cursor-pointer"
                          >
                            Apply
                          </button>
                        </div>
                        {promoError && (
                          <span className="text-[11px] text-[#C83224] font-semibold">{promoError}</span>
                        )}
                      </form>
                    )}
                  </div>

                  {/* Primary Checkout Button */}
                  <Button
                    onClick={handleProceedCheckout}
                    variant="slide"
                    size="default"
                    fullWidth
                    arrow
                    className="h-13 uppercase tracking-[0.16em] font-black text-xs"
                  >
                    Proceed to Checkout
                  </Button>

                  {/* Brand Value Pillars */}
                  <div className="pt-4 border-t border-[#E5E5E5] space-y-2 text-[11px] text-[#767677] uppercase tracking-wider font-semibold">
                    <div className="flex items-center gap-2">
                      <RiShieldCheckLine className="text-sm text-black" />
                      <span>100% Genuine Footwear Guaranteed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <RiTruckLine className="text-sm text-black" />
                      <span>Free 7-Day Doorstep Returns & Exchanges</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Container>
    </main>
  );
}
