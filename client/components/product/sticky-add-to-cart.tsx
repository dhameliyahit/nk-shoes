"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Product } from "@/types/product";
import { formatPrice, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/cart-context";

interface StickyAddToCartProps {
  product: Product;
  selectedSize: string | null;
  onSelectSize: (size: string) => void;
  selectedColorName: string;
}

export function StickyAddToCart({
  product,
  selectedSize,
  onSelectSize,
  selectedColorName,
}: StickyAddToCartProps) {
  const [isVisible, setIsVisible] = useState(false);
  const { addItem } = useCart();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      // Show sticky bar once scrolled 450px down
      if (window.scrollY > 450) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleAdd = () => {
    if (!selectedSize) {
      toast.error("Please select a shoe size");
      return;
    }
    addItem(product, selectedSize, selectedColorName, 1, product.images[0]);
    router.push("/cart");
  };

  if (!isVisible) return null;

  return (
    <aside
      aria-label="Quick Add to Bag Bar"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#EAEAEA] py-2.5 px-4 shadow-lg animate-slideUp font-sans"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* LEFT: THUMBNAIL + TITLE + COLOR */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative w-12 h-12 bg-[#EAEAEA] shrink-0 overflow-hidden border border-[#DCDCDC]">
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              sizes="48px"
              className="object-cover"
            />
          </div>
          <div className="min-w-0 truncate hidden sm:block">
            <h4 className="text-xs font-black uppercase text-[#111111] truncate">
              {product.name}
            </h4>
            <p className="text-[11px] text-[#707072] truncate">
              {product.subtitle} • {selectedColorName}
            </p>
          </div>
        </div>

        {/* RIGHT: PRICE + SIZE SELECTOR + ADD TO BAG */}
        <div className="flex items-center gap-3 shrink-0 ml-auto">
          {/* PRICE */}
          <div className="text-right">
            <span className="text-sm sm:text-base font-black text-[#111111]">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && (
              <span className="text-[11px] text-[#999999] line-through block font-normal">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>

          {/* SIZE DROPDOWN */}
          <select
            value={selectedSize || ""}
            onChange={(e) => onSelectSize(e.target.value)}
            className="h-10 border border-[#D0D0D0] bg-white text-xs font-bold px-2 sm:px-3 text-[#111111] outline-none cursor-pointer"
          >
            <option value="" disabled>
              Select Size
            </option>
            {product.sizes.map((s) => (
              <option key={s.size} value={s.size} disabled={!s.available}>
                {s.size} {!s.available ? "(Sold Out)" : ""}
              </option>
            ))}
          </select>

          {/* PRIMARY BUTTON */}
          <Button
            variant="bag"
            size="compact"
            arrow
            onClick={handleAdd}
            className="h-10 px-5 text-xs uppercase tracking-wider font-bold"
          >
            Add to Bag
          </Button>
        </div>
      </div>
    </aside>
  );
}
