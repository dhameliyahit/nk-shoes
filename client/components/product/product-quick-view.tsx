"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  RiHeart3Line,
  RiHeart3Fill,
  RiTruckLine,
  RiShieldCheckLine,
  RiRefreshLine,
} from "react-icons/ri";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Product } from "@/types/product";
import { formatPrice, cn } from "@/lib/utils";
import { useCart } from "@/context/cart-context";
import { useWishlist } from "@/context/wishlist-context";

interface ProductQuickViewProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProductQuickView({
  product,
  isOpen,
  onClose,
}: ProductQuickViewProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addItem } = useCart();
  const router = useRouter();
  const isWishlisted = product ? isInWishlist(product.id || product._id || product.slug) : false;

  useEffect(() => {
    if (product) {
      setSelectedImageIndex(0);
      setSelectedColorIndex(0);
      const firstAvailable = product.sizes?.find((s) => s.available)?.size;
      setSelectedSize(firstAvailable || null);
      setQuantity(1);
    }
  }, [product]);

  if (!product) return null;

  const currentPrice = product.price;
  const originalPrice = product.originalPrice;
  const discountPercent = originalPrice
    ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
    : 0;

  const handleAddToBag = () => {
    if (!selectedSize) {
      toast.error("Please select a shoe size first");
      return;
    }

    const colorName = product.colors[selectedColorIndex]?.name || "Standard";
    const img = product.images[selectedImageIndex] || product.images[0];
    addItem(product, selectedSize, colorName, quantity, img);
    onClose();
    router.push("/cart");
  };

  const handleToggleWishlist = () => {
    if (product) {
      toggleWishlist(product);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="3xl" title="Quick View">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 p-4 sm:p-6 font-sans">
        {/* LEFT COLUMN: FILLED IMAGE CANVAS & THUMBNAILS */}
        <div className="flex flex-col gap-2.5">
          {/* MAIN FILLED IMAGE CANVAS (#ECECEC) */}
          <div className="relative aspect-square w-full studio-showroom-canvas overflow-hidden">
            <div className="studio-contact-shadow" />
            <Image
              src={product.images[selectedImageIndex] || product.images[0]}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-contain p-4 studio-shoe-enhancer transition-transform duration-300"
            />

            {/* SOLID BLACK BADGE */}
            {product.badge && (
              <div className="absolute top-3 left-3 z-10 pointer-events-none">
                <span className="bg-[#111111] text-white text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-none shadow-xs">
                  {product.badge.text}
                </span>
              </div>
            )}

            {/* MINIMAL HEART BUTTON */}
            <button
              type="button"
              onClick={handleToggleWishlist}
              aria-label="Wishlist"
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/75 hover:bg-white text-[#111111] flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:scale-110"
            >
              {isWishlisted ? (
                <RiHeart3Fill className="text-lg text-[#E53E3E]" />
              ) : (
                <RiHeart3Line className="text-lg text-[#111111]" />
              )}
            </button>
          </div>

          {/* THUMBNAIL ROW */}
          {product.images.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImageIndex(idx)}
                  className={cn(
                    "relative w-14 h-14 bg-[#ECECEC] shrink-0 border-2 transition-all p-0 cursor-pointer overflow-hidden",
                    selectedImageIndex === idx
                      ? "border-[#111111]"
                      : "border-transparent opacity-70 hover:opacity-100"
                  )}
                >
                  <Image
                    src={img}
                    alt={`${product.name} angle ${idx + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: DETAILS & ACTIONS */}
        <div className="flex flex-col justify-between">
          <div>
            {/* SUBTITLE */}
            <p className="text-[11px] font-bold text-[#777777] uppercase tracking-[0.14em]">
              {product.subtitle}
            </p>

            {/* PRODUCT NAME */}
            <h2 className="text-xl sm:text-2xl font-bold text-[#111111] leading-tight mt-0.5">
              {product.name}
            </h2>

            {/* SHORT TAGLINE */}
            <p className="text-xs text-[#777777] font-normal leading-normal mt-1">
              {product.tagline || product.description}
            </p>

            {/* PRICE & DISCOUNT */}
            <div className="flex items-center gap-2.5 mt-2.5 pt-2.5 border-t border-[#f0f0f0]">
              <span className="text-xl sm:text-2xl font-extrabold text-[#111111]">
                {formatPrice(currentPrice)}
              </span>

              {originalPrice && (
                <span className="text-xs sm:text-sm text-[#999999] line-through font-normal">
                  {formatPrice(originalPrice)}
                </span>
              )}

              {discountPercent > 0 && (
                <span className="bg-[#FFEAEA] text-[#EF4444] text-[11px] font-bold px-1.5 py-0.5 rounded-xs">
                  -{discountPercent}%
                </span>
              )}
            </div>

            {/* COLORWAY SWATCHES */}
            {product.colors && product.colors.length > 0 && (
              <div className="mt-3.5">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-bold text-[#111111]">Select Colour:</span>
                  <span className="text-[#777777] text-[11px]">
                    {product.colors[selectedColorIndex]?.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {product.colors.map((color, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedColorIndex(idx)}
                      title={color.name}
                      aria-label={color.name}
                      className={cn(
                        "w-5 h-5 rounded-full border border-[#d0d0d0] transition-all cursor-pointer",
                        selectedColorIndex === idx && "ring-2 ring-offset-1 ring-[#111111] scale-110"
                      )}
                      style={{ backgroundColor: color.hex }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* SHOE SIZE SELECTOR */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-bold text-[#111111]">Select Size (UK):</span>
                <span className="text-[#777777] text-[11px] underline cursor-pointer hover:text-black">
                  Size Chart
                </span>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                {product.sizes.map((s) => (
                  <button
                    key={s.size}
                    type="button"
                    disabled={!s.available}
                    onClick={() => setSelectedSize(s.size)}
                    className={cn(
                      "h-8 rounded-none border text-xs font-bold transition-all cursor-pointer",
                      selectedSize === s.size
                        ? "bg-[#111111] text-white border-[#111111]"
                        : "bg-white text-[#222222] border-[#d8d8d8] hover:border-black",
                      !s.available &&
                        "bg-[#f6f6f6] text-[#b0b0b0] border-[#ececec] cursor-not-allowed line-through"
                    )}
                  >
                    {s.size}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* QUANTITY & SIGNATURE ADD TO BAG */}
          <div className="mt-5 pt-3.5 border-t border-[#f0f0f0]">
            <div className="flex items-center gap-3">
              {/* Quantity Counter */}
              <div className="flex items-center border border-[#d8d8d8] h-10">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-full flex items-center justify-center text-sm font-bold text-[#666] hover:text-black hover:bg-[#f4f4f4] transition-colors cursor-pointer"
                >
                  -
                </button>
                <span className="w-8 text-center text-xs font-bold text-[#111111]">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-full flex items-center justify-center text-sm font-bold text-[#666] hover:text-black hover:bg-[#f4f4f4] transition-colors cursor-pointer"
                >
                  +
                </button>
              </div>

              {/* Signature Add to Bag Button with Shine & Arrow */}
              <div className="flex-1">
                <Button
                  variant="bag"
                  size="compact"
                  fullWidth
                  arrow
                  onClick={handleAddToBag}
                  className="h-10 min-h-[40px] text-xs"
                >
                  Add to Bag
                </Button>
              </div>
            </div>

            {/* REASSURANCE STRIP */}
            <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-[#f0f0f0] text-[10px] text-[#666666]">
              <div className="flex items-center gap-1.5">
                <RiTruckLine className="text-[#111] text-xs shrink-0" />
                <span>Fast Shipping</span>
              </div>
              <div className="flex items-center gap-1.5">
                <RiShieldCheckLine className="text-[#111] text-xs shrink-0" />
                <span>100% Genuine</span>
              </div>
              <div className="flex items-center gap-1.5">
                <RiRefreshLine className="text-[#111] text-xs shrink-0" />
                <span>7-Day Return</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
