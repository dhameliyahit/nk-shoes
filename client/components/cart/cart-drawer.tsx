"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import {
  RiCloseLine,
  RiDeleteBinLine,
  RiShoppingBag3Line,
  RiTruckLine,
  RiShieldCheckLine,
  RiArrowRightLine,
  RiSparklingLine,
} from "react-icons/ri";
import { useCart } from "@/context/cart-context";
import { useAuth } from "@/context/auth-context";
import { formatPrice, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function CartDrawer() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const {
    items,
    isOpen,
    closeCart,
    removeItem,
    updateQuantity,
    totalCount,
    subtotal,
    freeShippingThreshold,
    freeShippingRemaining,
    total,
  } = useCart();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Escape key listener
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        closeCart();
      }
    },
    [isOpen, closeCart]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleProceedCheckout = () => {
    closeCart();
    if (!isLoggedIn) {
      router.push("/register?redirect=/checkout");
    } else {
      router.push("/checkout");
    }
  };

  const freeShippingProgress = Math.min(
    100,
    Math.round((subtotal / freeShippingThreshold) * 100)
  );

  if (!mounted) return null;

  const drawerContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Shopping Bag Drawer"
      className={cn(
        "fixed inset-0 z-[9999] transition-visibility duration-300 select-none",
        isOpen ? "visible pointer-events-auto" : "invisible pointer-events-none delay-300"
      )}
    >
      {/* 1. BACKDROP OVERLAY */}
      <div
        onClick={closeCart}
        className={cn(
          "fixed inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0"
        )}
        aria-hidden="true"
      />

      {/* 2. DRAWER CONTAINER (SLIDES FROM RIGHT) */}
      <div
        className={cn(
          "fixed top-0 bottom-0 right-0 w-full max-w-md bg-white shadow-2xl flex flex-col z-10 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] border-l border-[#E5E5E5]",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* HEADER */}
        <div className="px-6 py-5 border-b border-[#EAEAEA] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm font-black uppercase tracking-wider text-[#111111]">
              Your Bag
            </h2>
            <span className="text-xs font-bold px-2 py-0.5 bg-[#F4F4F4] text-[#111111] rounded-full">
              {totalCount}
            </span>
          </div>

          <button
            onClick={closeCart}
            aria-label="Close Bag"
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#707072] hover:text-[#111111] hover:bg-[#F5F5F5] transition-colors"
          >
            <RiCloseLine className="text-xl" />
          </button>
        </div>

        {/* FREE SHIPPING PROGRESS BAR */}
        <div className="px-6 py-3 bg-[#F9F9F9] border-b border-[#EAEAEA]">
          <div className="flex items-center justify-between text-[11px] mb-1.5 font-bold uppercase tracking-wider">
            {freeShippingRemaining > 0 ? (
              <span className="text-[#555] flex items-center gap-1.5">
                <RiTruckLine className="text-sm text-[#111]" />
                Add <span className="text-[#111]">{formatPrice(freeShippingRemaining)}</span> for Free Shipping
              </span>
            ) : (
              <span className="text-[#111] flex items-center gap-1.5">
                <RiSparklingLine className="text-sm text-[#2E7D32]" />
                You unlocked Free Express Shipping!
              </span>
            )}
            <span className="text-[#888]">{freeShippingProgress}%</span>
          </div>
          <div className="w-full h-1 bg-[#E0E0E0] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#111111] transition-all duration-500 ease-out"
              style={{ width: `${freeShippingProgress}%` }}
            />
          </div>
        </div>

        {/* ITEMS LIST */}
        <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-[#F0F0F0]">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <div className="w-16 h-16 rounded-full bg-[#F6F6F6] flex items-center justify-center text-[#888888] mb-4">
                <RiShoppingBag3Line className="text-2xl" />
              </div>
              <h3 className="text-base font-extrabold uppercase tracking-wider text-[#111111]">
                Your bag is empty
              </h3>
              <p className="text-xs text-[#707072] max-w-[240px] mt-1.5 leading-relaxed">
                Explore our latest footwear drops and signature silhouettes.
              </p>
              <button
                onClick={closeCart}
                className="mt-6 px-6 py-2.5 bg-[#111111] text-white text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors"
              >
                Shop New Arrivals
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex gap-4">
                {/* Product Thumbnail */}
                <div className="relative w-20 h-20 bg-[#F6F6F6] shrink-0 border border-[#EAEAEA] overflow-hidden">
                  <Image
                    src={item.image}
                    alt={item.product.name}
                    fill
                    className="object-contain p-1.5"
                    sizes="80px"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-extrabold uppercase text-[#111111] tracking-wide truncate">
                        {item.product.name}
                      </h4>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-[#999999] hover:text-[#111111] transition-colors p-0.5"
                        aria-label="Remove item"
                      >
                        <RiDeleteBinLine className="text-sm" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-[#707072] mt-1">
                      <span>Size: <strong className="text-[#111111]">{item.size}</strong></span>
                      {item.color && (
                        <>
                          <span>•</span>
                          <span className="truncate">{item.color}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    {/* Minimal Quantity Stepper */}
                    <div className="flex items-center border border-[#E0E0E0] bg-white">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-7 h-7 flex items-center justify-center text-xs font-bold text-[#555] hover:text-[#111] hover:bg-[#F5F5F5] transition-colors"
                        aria-label="Decrease quantity"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-[#111111]">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-7 h-7 flex items-center justify-center text-xs font-bold text-[#555] hover:text-[#111] hover:bg-[#F5F5F5] transition-colors"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>

                    {/* Price */}
                    <div className="text-right">
                      <span className="text-xs font-black text-[#111111]">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* STICKY FOOTER */}
        {items.length > 0 && (
          <div className="p-6 border-t border-[#EAEAEA] bg-white flex flex-col gap-4">
            {/* Subtotal */}
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider font-bold text-[#707072]">
                Subtotal
              </span>
              <span className="text-base font-black text-[#111111]">
                {formatPrice(subtotal)}
              </span>
            </div>

            <p className="text-[11px] text-[#707072]">
              Taxes, coupons, and shipping calculated at checkout.
            </p>

            {/* Primary Action Button */}
            <Button
              onClick={handleProceedCheckout}
              variant="bag"
              size="default"
              fullWidth
              arrow
              className="h-12 uppercase tracking-wider font-extrabold text-xs"
            >
              Checkout Now
            </Button>

            {/* Trust Reassurance */}
            <div className="flex items-center justify-center gap-3 text-[10px] uppercase tracking-wider font-semibold text-[#888888] pt-1">
              <span className="flex items-center gap-1">
                <RiShieldCheckLine className="text-xs text-[#111]" /> Authentic Footwear
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <RiTruckLine className="text-xs text-[#111]" /> Express Courier
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(drawerContent, document.body);
}

export default CartDrawer;
