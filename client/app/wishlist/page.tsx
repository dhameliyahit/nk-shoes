"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  RiHeart3Line,
  RiHeart3Fill,
  RiDeleteBinLine,
  RiShoppingBag3Line,
  RiArrowRightLine,
  RiCheckLine,
  RiArrowLeftLine,
} from "react-icons/ri";
import { useWishlist } from "@/context/wishlist-context";
import { useCart } from "@/context/cart-context";
import { formatPrice, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Product } from "@/types/product";

export default function WishlistPage() {
  const { wishlist, wishlistCount, isHydrated, removeFromWishlist, clearWishlist } =
    useWishlist();
  const { addItem } = useCart();
  const router = useRouter();

  // Selected size state per wishlisted product
  const [selectedSizes, setSelectedSizes] = useState<{ [productId: string]: string }>({});

  const handleSelectSize = (productId: string, size: string) => {
    setSelectedSizes((prev) => ({ ...prev, [productId]: size }));
  };

  const handleMoveToBag = (product: Product) => {
    const productId = product._id || product.id || product.slug;
    const chosenSize =
      selectedSizes[productId] ||
      product.sizes?.find((s) => s.available)?.size ||
      product.sizes?.[0]?.size ||
      "UK 8";

    const colorName = product.colors?.[0]?.name || "Standard";
    const image = product.images?.[0] || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=85";

    addItem(product, chosenSize, colorName, 1, image);
    toast.success(`Moved ${product.name} to Shopping Bag!`, {
      icon: "🛍️",
    });
  };

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Favorites & Wishlist" },
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-[#111111]">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* BREADCRUMBS */}
        <Breadcrumbs items={breadcrumbs} className="mb-4" />

        {/* HEADER SECTION */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#EAEAEA]">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#707072] mb-1">
              <RiHeart3Fill className="text-[#E53E3E] text-sm" />
              <span>Saved Items</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-[#111111]">
              My Wishlist {isHydrated && `(${wishlistCount})`}
            </h1>
          </div>

          {isHydrated && wishlistCount > 0 && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={clearWishlist}
                className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#707072] hover:text-[#E53E3E] transition-colors cursor-pointer py-1.5 px-3 border border-[#DCDCDC] hover:border-[#E53E3E]"
              >
                <RiDeleteBinLine className="text-sm" />
                <span>Clear All</span>
              </button>
              <Link
                href="/products"
                className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider bg-[#111111] hover:bg-black text-white py-2 px-4 transition-colors"
              >
                <span>Continue Shopping</span>
                <RiArrowRightLine />
              </Link>
            </div>
          )}
        </div>

        {/* LOADING SKELETON */}
        {!isHydrated && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse flex flex-col gap-3">
                <div className="w-full aspect-square bg-[#EAEAEA]" />
                <div className="h-4 bg-[#EAEAEA] w-3/4" />
                <div className="h-3 bg-[#EAEAEA] w-1/2" />
                <div className="h-4 bg-[#EAEAEA] w-1/4" />
              </div>
            ))}
          </div>
        )}

        {/* EMPTY STATE */}
        {isHydrated && wishlistCount === 0 && (
          <div className="py-20 flex flex-col items-center justify-center text-center max-w-lg mx-auto">
            <div className="w-20 h-20 bg-[#F7F7F7] border border-[#EAEAEA] flex items-center justify-center rounded-full mb-6 text-[#999999]">
              <RiHeart3Line className="text-4xl" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-[#111111] mb-2">
              Your Wishlist is Empty
            </h2>
            <p className="text-xs sm:text-sm text-[#707072] leading-relaxed mb-8">
              Explore our newest silhouettes, responsive running shoes, and iconic everyday sneakers. Click the heart icon on any shoe to save it here for later.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 h-12 px-8 bg-[#111111] hover:bg-black text-white uppercase tracking-wider text-xs font-bold transition-all"
            >
              <span>Explore Collection</span>
              <RiArrowRightLine className="text-base" />
            </Link>
          </div>
        )}

        {/* WISHLIST GRID */}
        {isHydrated && wishlistCount > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-8">
            {wishlist.map((item) => {
              const itemId = item._id || item.id || item.slug;
              const discountPercent = item.originalPrice
                ? Math.round(
                    ((item.originalPrice - item.price) / item.originalPrice) * 100
                  )
                : 0;

              const chosenSize =
                selectedSizes[itemId] ||
                item.sizes?.find((s) => s.available)?.size ||
                item.sizes?.[0]?.size ||
                "UK 8";

              return (
                <div
                  key={itemId}
                  className="group relative flex flex-col bg-white border border-[#EAEAEA] hover:border-[#111111] transition-all overflow-hidden"
                >
                  {/* IMAGE CONTAINER */}
                  <div className="relative w-full aspect-square bg-[#F5F5F5] overflow-hidden">
                    <Link
                      href={`/products/${item.slug}`}
                      className="block w-full h-full relative cursor-pointer"
                    >
                      <Image
                        src={item.images?.[0] || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=85"}
                        alt={item.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                      />
                    </Link>

                    {/* BADGE */}
                    {item.badge && (
                      <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none">
                        <span className="bg-[#111111] text-white text-[9px] font-black tracking-wider uppercase px-2 py-0.5 shadow-xs">
                          {item.badge.text}
                        </span>
                      </div>
                    )}

                    {/* REMOVE FROM WISHLIST BUTTON */}
                    <button
                      type="button"
                      onClick={() => removeFromWishlist(itemId)}
                      title="Remove from Wishlist"
                      className="absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full bg-white/80 hover:bg-[#E53E3E] text-[#111111] hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-xs"
                    >
                      <RiDeleteBinLine className="text-base" />
                    </button>
                  </div>

                  {/* DETAILS */}
                  <div className="p-4 flex flex-col flex-1 justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold text-[#777777] uppercase tracking-[0.14em]">
                        {item.subtitle || "Performance Footwear"}
                      </p>
                      <Link href={`/products/${item.slug}`}>
                        <h3 className="text-sm font-black text-[#111111] uppercase tracking-tight mt-0.5 hover:underline truncate">
                          {item.name}
                        </h3>
                      </Link>

                      {/* PRICE */}
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-base font-black text-[#111111]">
                          {formatPrice(item.price)}
                        </span>
                        {item.originalPrice && (
                          <span className="text-xs text-[#999999] line-through font-normal">
                            {formatPrice(item.originalPrice)}
                          </span>
                        )}
                        {discountPercent > 0 && (
                          <span className="text-[10px] font-bold text-[#E53E3E] bg-[#FFF0F0] px-1.5 py-0.2">
                            -{discountPercent}%
                          </span>
                        )}
                      </div>
                    </div>

                    {/* SIZE SELECTOR & MOVE TO BAG */}
                    <div className="flex flex-col gap-2 pt-2 border-t border-[#F0F0F0]">
                      {item.sizes && item.sizes.length > 0 && (
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-[#707072] font-semibold">Size:</span>
                          <select
                            value={chosenSize}
                            onChange={(e) => handleSelectSize(itemId, e.target.value)}
                            className="border border-[#D0D0D0] bg-white px-2 py-0.5 text-[11px] font-bold text-[#111111] outline-none cursor-pointer"
                          >
                            {item.sizes.map((s) => (
                              <option key={s.size} value={s.size} disabled={!s.available}>
                                {s.size} {!s.available ? "(Sold Out)" : ""}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <Button
                        variant="slide"
                        size="compact"
                        fullWidth
                        onClick={() => handleMoveToBag(item)}
                        className="h-10 text-xs uppercase font-bold tracking-wider flex items-center justify-center gap-1.5 bg-[#111111] hover:bg-black text-white cursor-pointer"
                      >
                        <RiShoppingBag3Line className="text-sm" />
                        <span>Move to Bag</span>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
