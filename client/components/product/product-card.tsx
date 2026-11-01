"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { RiHeart3Line, RiHeart3Fill } from "react-icons/ri";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/cart-context";
import { useWishlist } from "@/context/wishlist-context";
import { Product } from "@/types/product";
import { formatPrice, cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  layout?: "grid" | "list";
  onQuickView?: (product: Product) => void;
  className?: string;
}

export function ProductCard({
  product,
  layout = "grid",
  onQuickView,
  className,
}: ProductCardProps) {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const isWishlisted = isInWishlist(product.id || product._id || product.slug);
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);

  const discountPercent = product.originalPrice
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100
      )
    : 0;

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  const { addItem } = useCart();
  const router = useRouter();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const chosenSize = product.sizes.find((s) => s.available)?.size || "UK 8";
    const chosenColor = product.colors[selectedColorIndex]?.name || "Standard";
    addItem(product, chosenSize, chosenColor, 1, currentImage);
    router.push("/cart");
  };

  const handleQuickViewTrigger = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onQuickView) {
      onQuickView(product);
    }
  };

  const currentImage = product.images[selectedColorIndex] || product.images[0];

  // =========================================================
  // LIST VIEW LAYOUT (HORIZONTAL ROW)
  // =========================================================
  if (layout === "list") {
    return (
      <div
        className={cn(
          "group flex flex-col sm:flex-row items-center gap-4 p-3 bg-white border border-[#eaeaea] hover:border-[#111111] transition-all font-sans select-none",
          className
        )}
      >
        {/* FILLED IMAGE TILE */}
        <div className="relative w-full sm:w-44 md:w-52 aspect-square bg-[#F5F5F5] shrink-0 overflow-hidden flex items-center justify-center">
          <Link
            href={`/products/${product.slug}`}
            className="block w-full h-full relative cursor-pointer"
            aria-label={product.name}
          >
            <Image
              src={currentImage}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, 220px"
              className="object-contain p-3 transition-transform duration-500 ease-out group-hover:scale-105"
            />
          </Link>

          {/* BADGE */}
          {product.badge && (
            <span className="absolute top-2 left-2 z-10 bg-[#111111] text-white text-[9px] font-black tracking-wider uppercase px-2 py-0.5">
              {product.badge.text}
            </span>
          )}

          {/* WISHLIST */}
          <button
            type="button"
            onClick={handleWishlistToggle}
            aria-label="Wishlist"
            className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-white/80 hover:bg-white text-[#111111] transition-all cursor-pointer"
          >
            {isWishlisted ? (
              <RiHeart3Fill className="text-base text-[#E53E3E]" />
            ) : (
              <RiHeart3Line className="text-base text-[#111111]" />
            )}
          </button>
        </div>

        {/* DETAILS */}
        <div className="flex flex-col flex-1 min-w-0 w-full justify-between py-1">
          <div>
            <div className="flex items-center justify-between text-[10px] font-bold tracking-[0.14em] text-[#777777] uppercase">
              <span>{product.subtitle}</span>
              {discountPercent > 0 && (
                <span className="bg-[#FFEAEA] text-[#EF4444] px-1.5 py-0.2 rounded-xs">
                  -{discountPercent}%
                </span>
              )}
            </div>

            <h3 className="text-base font-bold text-[#111111] mt-0.5 line-clamp-1">
              <Link href={`/products/${product.slug}`} className="hover:opacity-75">
                {product.name}
              </Link>
            </h3>

            <p className="text-xs text-[#777777] mt-0.5 line-clamp-2">
              {product.tagline || product.description}
            </p>

            {/* COLOR SWATCHES */}
            {product.colors && product.colors.length > 0 && (
              <div className="flex items-center gap-1.5 mt-2">
                {product.colors.map((color, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedColorIndex(idx)}
                    title={color.name}
                    className={cn(
                      "w-3.5 h-3.5 rounded-full transition-all cursor-pointer border border-[#d0d0d0]",
                      selectedColorIndex === idx && "ring-1 ring-offset-1 ring-[#111111]"
                    )}
                    style={{ backgroundColor: color.hex }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* PRICE & BUTTON */}
          <div className="flex items-center justify-between gap-3 mt-3 pt-2.5 border-t border-[#f0f0f0]">
            <div className="flex items-baseline gap-2">
              <span className="text-base font-bold text-[#111111]">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && (
                <span className="text-xs text-[#999999] line-through">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {onQuickView && (
                <button
                  type="button"
                  onClick={handleQuickViewTrigger}
                  className="text-xs font-bold text-[#666] hover:text-black hover:underline px-2 py-1"
                >
                  Quick View
                </button>
              )}
              <Button
                variant="bag"
                size="compact"
                arrow
                onClick={handleAddToCart}
                className="h-9 min-h-[38px] text-xs px-3.5"
              >
                Add to Cart
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // GRID VIEW LAYOUT (COMPACT VERTICAL CARD WITH FILLED IMAGE)
  // =========================================================
  return (
    <div className={cn("group flex flex-col w-full bg-white font-sans text-left select-none", className)}>
      {/* 1. SQUARE FILLED IMAGE TILE (#F5F5F5 NEUTRAL CANVAS) */}
      <div className="relative aspect-square w-full bg-[#F5F5F5] overflow-hidden flex items-center justify-center">
        <Link
          href={`/products/${product.slug}`}
          className="block w-full h-full relative cursor-pointer"
          aria-label={product.name}
        >
          {/* CLEAN PRESENTATION */}
          <Image
            src={currentImage}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-contain p-3.5 transition-transform duration-500 ease-out group-hover:scale-105"
          />
        </Link>

        {/* TOP-LEFT SOLID BLACK BADGE */}
        {product.badge && (
          <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none">
            <span className="bg-[#111111] text-white text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded-none shadow-xs">
              {product.badge.text}
            </span>
          </div>
        )}

        {/* TOP-RIGHT DISTINCTIVE HEART WISHLIST BUTTON */}
        <button
          type="button"
          onClick={handleWishlistToggle}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className="absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full bg-white/70 hover:bg-white text-[#111111] flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:scale-110"
        >
          {isWishlisted ? (
            <RiHeart3Fill className="text-lg text-[#E53E3E]" />
          ) : (
            <RiHeart3Line className="text-lg text-[#111111]" />
          )}
        </button>

        {/* QUICK VIEW BUTTON ON HOVER */}
        {onQuickView && (
          <button
            type="button"
            onClick={handleQuickViewTrigger}
            className="absolute bottom-2.5 right-2.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white text-[#111111] text-[10px] font-bold tracking-wider uppercase px-2 py-1 shadow-xs cursor-pointer"
          >
            Quick View
          </button>
        )}
      </div>

      {/* 2. COMPACT PRODUCT DETAILS (MINIMIZED SPACING) */}
      <div className="flex flex-col flex-1 pt-2 pb-1">
        {/* SUBTITLE */}
        <p className="text-[10px] sm:text-[11px] font-bold text-[#777777] uppercase tracking-[0.14em]">
          {product.subtitle}
        </p>

        {/* PRODUCT NAME */}
        <h3 className="text-[15px] font-bold text-[#111111] leading-tight mt-0.5 line-clamp-1">
          <Link href={`/products/${product.slug}`} className="hover:opacity-75 transition-opacity">
            {product.name}
          </Link>
        </h3>

        {/* SHORT TAGLINE */}
        <p className="text-[12px] text-[#777777] font-normal leading-tight mt-0.5 line-clamp-1">
          {product.tagline || product.description}
        </p>

        {/* PRICE & DISCOUNT */}
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[15px] font-bold text-[#111111]">
            {formatPrice(product.price)}
          </span>

          {product.originalPrice && (
            <span className="text-[12px] text-[#999999] line-through font-normal">
              {formatPrice(product.originalPrice)}
            </span>
          )}

          {discountPercent > 0 && (
            <span className="bg-[#FFEAEA] text-[#EF4444] text-[10px] font-bold px-1.5 py-0.2 rounded-xs">
              -{discountPercent}%
            </span>
          )}
        </div>

        {/* 3. FOOTER ROW: COLOR SWATCHES & SIGNATURE NK BUTTON */}
        <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-[#f2f2f2]">
          {/* Color Swatch Dots */}
          <div className="flex items-center gap-1">
            {product.colors && product.colors.length > 0 ? (
              product.colors.map((color, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedColorIndex(idx)}
                  title={color.name}
                  aria-label={color.name}
                  className={cn(
                    "w-3 h-3 rounded-full transition-all cursor-pointer border border-[#d0d0d0]",
                    selectedColorIndex === idx && "ring-1 ring-offset-1 ring-[#111111]"
                  )}
                  style={{ backgroundColor: color.hex }}
                />
              ))
            ) : (
              <span className="w-3 h-3 rounded-full bg-[#111111]" />
            )}
          </div>

          {/* SIGNATURE ADD TO CART BUTTON (WITH HOVER SHINE & ARROW) */}
          <Button
            variant="bag"
            size="compact"
            arrow
            onClick={handleAddToCart}
            className="h-8 min-h-[34px] text-[11px] px-2.5 gap-1.5 shadow-xs"
          >
            Add to Cart
          </Button>
        </div>
      </div>
    </div>
  );
}
