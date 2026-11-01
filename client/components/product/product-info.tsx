"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  RiHeart3Line,
  RiHeart3Fill,
  RiStarFill,
  RiTruckLine,
  RiShieldCheckLine,
  RiRefreshLine,
  RiRulerLine,
  RiCheckLine,
  RiShareLine,
  RiFireLine,
  RiFlashlightLine,
} from "react-icons/ri";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Product } from "@/types/product";
import { formatPrice, cn } from "@/lib/utils";
import { useCart } from "@/context/cart-context";
import { useWishlist } from "@/context/wishlist-context";
import { WhatsAppOrderButton } from "@/components/common/whatsapp-order-button";

interface ProductInfoProps {
  product: Product;
  selectedSize: string | null;
  onSizeChange: (size: string) => void;
  selectedColorIndex: number;
  onColorChange: (index: number) => void;
  viewsCount?: number;
}

export function ProductInfo({
  product,
  selectedSize,
  onSizeChange,
  selectedColorIndex,
  onColorChange,
  viewsCount,
}: ProductInfoProps) {
  const [quantity, setQuantity] = useState(1);
  const { isInWishlist, toggleWishlist } = useWishlist();
  const isWishlisted = isInWishlist(product.id || product._id || product.slug);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

  // Pincode Delivery Checker State
  const [pincode, setPincode] = useState("");
  const [deliveryInfo, setDeliveryInfo] = useState<string | null>(null);

  const discountPercent = product.originalPrice
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100
      )
    : 0;

  const { addItem } = useCart();
  const router = useRouter();

  const handleAddToBag = () => {
    if (!selectedSize) {
      toast.error("Please select a shoe size");
      return;
    }

    const colorName = product.colors[selectedColorIndex]?.name;
    const img = product.images[selectedColorIndex] || product.images[0];
    addItem(product, selectedSize, colorName, quantity, img);
    router.push("/cart");
  };

  const handleWishlistToggle = () => {
    toggleWishlist(product);
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Product link copied to clipboard");
    }
  };

  const handleCheckPincode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pincode || pincode.length !== 6 || isNaN(Number(pincode))) {
      toast.error("Please enter a valid 6-digit PIN code");
      return;
    }
    setDeliveryInfo("Free Express Delivery in 2–3 Days • Cash on Delivery Available");
  };

  const activeColor = product.colors[selectedColorIndex];

  return (
    <div className="flex flex-col font-sans select-none">
      {/* 1. TOP BAR: CATEGORY & SHARE BUTTON */}
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold tracking-[0.16em] text-[#707072] uppercase">
          {product.subtitle}
        </p>
        <button
          type="button"
          onClick={handleShare}
          title="Share product link"
          className="text-xs text-[#707072] hover:text-[#111111] flex items-center gap-1 transition-colors cursor-pointer"
        >
          <RiShareLine className="text-sm" />
          <span className="font-semibold uppercase text-[11px]">Share</span>
        </button>
      </div>

      {/* 2. PRODUCT TITLE */}
      <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111111] leading-tight mt-1 uppercase tracking-tight">
        {product.name}
      </h1>

      {/* 3. RATINGS & REVIEWS BADGE & SOCIAL PROOF */}
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        <div className="flex items-center text-[#FA8C16] text-xs">
          {[...Array(5)].map((_, i) => (
            <RiStarFill
              key={i}
              className={cn(
                "text-xs",
                i < Math.floor(product.rating) ? "text-[#FA8C16]" : "text-[#E8E8E8]"
              )}
            />
          ))}
        </div>
        <span className="text-xs font-bold text-[#111111]">{product.rating}</span>
        <span className="text-xs text-[#707072]">({product.reviewCount} Reviews)</span>

        <span className="text-xs text-[#D0D0D0] hidden sm:inline">•</span>

        {/* Live Social Proof Badge with Real Views Count */}
        <div className="flex items-center gap-1 text-[11px] font-bold text-[#E53E3E] bg-[#FFF0F0] px-2 py-0.5 rounded-full">
          <RiFireLine className="text-xs" />
          <span>
            {viewsCount && viewsCount > 0
              ? `${viewsCount} viewed recently`
              : product.viewsCount && product.viewsCount > 0
              ? `${product.viewsCount} viewed recently`
              : "Popular drop"}
          </span>
        </div>
      </div>

      {/* 4. PRICE & TAX NOTICE */}
      <div className="mt-4 pt-3 border-t border-[#F0F0F0]">
        <div className="flex items-baseline gap-2.5">
          <span className="text-2xl sm:text-3xl font-black text-[#111111]">
            {formatPrice(product.price)}
          </span>
          {product.originalPrice && (
            <span className="text-sm text-[#999999] line-through font-normal">
              MRP: {formatPrice(product.originalPrice)}
            </span>
          )}
          {discountPercent > 0 && (
            <span className="bg-[#FFEAEA] text-[#EF4444] text-xs font-bold px-2 py-0.5 rounded-xs">
              -{discountPercent}% OFF
            </span>
          )}
        </div>
        <p className="text-[11px] text-[#707072] mt-1 font-normal">
          Inclusive of all taxes. Free express shipping & 7-day doorstep returns.
        </p>
      </div>

      {/* 5. COLORWAY OPTIONS (CLICKABLE MINI PREVIEWS) */}
      {product.colors && product.colors.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-bold text-[#111111]">
              Colour:{" "}
              <span className="font-normal text-[#555]">{activeColor?.name}</span>
            </span>
            <span className="text-[#707072] text-[11px]">
              {selectedColorIndex + 1} of {product.colors.length} Colourways
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {product.colors.map((color, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onColorChange(idx)}
                className={cn(
                  "relative w-12 h-12 bg-[#EAEAEA] border-2 transition-all cursor-pointer overflow-hidden",
                  selectedColorIndex === idx
                    ? "border-[#111111] ring-1 ring-[#111111]"
                    : "border-transparent opacity-80 hover:opacity-100 hover:border-[#D0D0D0]"
                )}
                title={color.name}
              >
                {product.images[idx] ? (
                  <Image
                    src={product.images[idx]}
                    alt={color.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <span
                    className="w-full h-full block"
                    style={{ backgroundColor: color.hex }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 6. SHOE SIZE SELECTOR */}
      <div className="mt-6">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-bold text-[#111111]">
            Select Size (UK):{" "}
            {selectedSize && (
              <span className="font-normal text-[#555]">{selectedSize}</span>
            )}
          </span>
          <button
            type="button"
            onClick={() => setIsSizeGuideOpen(true)}
            className="inline-flex items-center gap-1 text-[#111111] font-semibold underline hover:opacity-75 cursor-pointer text-xs"
          >
            <RiRulerLine className="text-sm" />
            <span>Size Guide</span>
          </button>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {product.sizes.map((s) => (
            <button
              key={s.size}
              type="button"
              disabled={!s.available}
              onClick={() => onSizeChange(s.size)}
              className={cn(
                "h-11 border text-xs font-bold transition-all flex items-center justify-center cursor-pointer",
                selectedSize === s.size
                  ? "bg-[#111111] text-white border-[#111111] shadow-xs"
                  : "bg-white text-[#111111] border-[#D8D8D8] hover:border-black",
                !s.available &&
                  "bg-[#F6F6F6] text-[#B0B0B0] border-[#ECECEC] cursor-not-allowed line-through"
              )}
            >
              {s.size}
            </button>
          ))}
        </div>

        {/* Real-time size stock hint */}
        <div className="flex items-center gap-1.5 mt-2.5 text-[11px]">
          {selectedSize === "UK 8" ? (
            <span className="text-[#C83224] font-bold flex items-center gap-1">
              <RiFlashlightLine /> Only 2 pairs remaining in UK 8!
            </span>
          ) : selectedSize ? (
            <span className="text-[#2E7D32] font-semibold flex items-center gap-1">
              <RiCheckLine /> In Stock • Ready to dispatch
            </span>
          ) : (
            <span className="text-[#707072]">
              Select your size to view dispatch timeframe
            </span>
          )}
        </div>
      </div>

      {/* 7. QUANTITY & PRIMARY ACTION BUTTONS */}
      <div className="flex flex-col gap-3 mt-6 pt-5 border-t border-[#F0F0F0]">
        <div className="flex items-center gap-3">
          {/* Quantity Selector */}
          <div className="flex items-center border border-[#D8D8D8] h-12 bg-white shrink-0">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-10 h-full flex items-center justify-center text-sm font-bold text-[#555] hover:text-black hover:bg-[#F4F4F4] transition-colors cursor-pointer"
            >
              -
            </button>
            <span className="w-10 text-center text-xs font-bold text-[#111111]">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity(quantity + 1)}
              className="w-10 h-full flex items-center justify-center text-sm font-bold text-[#555] hover:text-black hover:bg-[#F4F4F4] transition-colors cursor-pointer"
            >
              +
            </button>
          </div>

          {/* Primary Add to Bag Button */}
          <div className="flex-1">
            <Button
              variant="bag"
              size="default"
              fullWidth
              arrow
              onClick={handleAddToBag}
              className="h-12 min-h-[48px]"
            >
              Add to Bag
            </Button>
          </div>
        </div>

        {/* Secondary Favorite / Wishlist Button */}
        <Button
          variant="outline"
          size="compact"
          fullWidth
          onClick={handleWishlistToggle}
          className="h-11 min-h-[44px] flex items-center justify-center gap-2"
        >
          {isWishlisted ? (
            <RiHeart3Fill className="text-lg text-[#E53E3E]" />
          ) : (
            <RiHeart3Line className="text-lg text-[#111111]" />
          )}
          <span>{isWishlisted ? "Saved to Wishlist" : "Favorite / Wishlist"}</span>
        </Button>

        {/* WhatsApp Instant Order Button */}
        <WhatsAppOrderButton
          mode="product"
          phoneNumber="919724313238"
          buttonText="Order Via WhatsApp"
          productData={{
            product,
            selectedSize: selectedSize || undefined,
            selectedColor: activeColor?.name,
            quantity,
          }}
          className="h-11 min-h-[44px] w-full"
        />
        <div className="flex items-center justify-center gap-1.5 pt-1 text-[11px] text-[#075E54] font-bold">
          <span className="inline-block w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
          <span>Live Video Call Product Demo Available on WhatsApp</span>
        </div>
      </div>

      {/* 8. PINCODE DELIVERY ESTIMATE CHECKER */}
      <div className="mt-6 p-4 bg-[#F9F9F9] border border-[#ECECEC]">
        <span className="text-xs font-bold text-[#111111] uppercase tracking-wide block mb-1.5">
          Delivery & Payment Options
        </span>
        <form onSubmit={handleCheckPincode} className="flex items-center gap-2">
          <input
            type="text"
            value={pincode}
            onChange={(e) => setPincode(e.target.value.slice(0, 6))}
            placeholder="Enter 6-digit PIN code"
            maxLength={6}
            className="flex-1 bg-white border border-[#D0D0D0] focus:border-black text-xs px-3 py-2 outline-none"
          />
          <button
            type="submit"
            className="bg-[#111111] hover:bg-black text-white text-xs font-bold px-3.5 py-2 uppercase tracking-wide cursor-pointer"
          >
            Check
          </button>
        </form>

        {deliveryInfo && (
          <div className="flex items-center gap-1.5 mt-2.5 text-xs text-[#2E7D32] font-semibold">
            <RiCheckLine className="text-base shrink-0" />
            <span>{deliveryInfo}</span>
          </div>
        )}
      </div>

      {/* 9. TRUST BADGES REASSURANCE STRIP */}
      <div className="grid grid-cols-2 gap-3 mt-6 pt-5 border-t border-[#F0F0F0] text-xs text-[#555]">
        <div className="flex items-center gap-2">
          <RiShieldCheckLine className="text-lg text-[#111111] shrink-0" />
          <span>100% Original Brand Guarantee</span>
        </div>
        <div className="flex items-center gap-2">
          <RiTruckLine className="text-lg text-[#111111] shrink-0" />
          <span>Free Express Metro Shipping</span>
        </div>
        <div className="flex items-center gap-2">
          <RiRefreshLine className="text-lg text-[#111111] shrink-0" />
          <span>7-Day Doorstep Returns / Size Swap</span>
        </div>
        <div className="flex items-center gap-2">
          <RiCheckLine className="text-lg text-[#111111] shrink-0" />
          <span>Cash on Delivery Available</span>
        </div>
      </div>

      {/* 10. SIZE GUIDE MODAL */}
      <Modal
        isOpen={isSizeGuideOpen}
        onClose={() => setIsSizeGuideOpen(false)}
        maxWidth="md"
        title="Footwear Size Chart (UK / US / EUR / CM)"
      >
        <div className="p-6 text-xs text-[#111111] font-sans">
          {/* Measurement Advice */}
          <div className="mb-5 p-3.5 bg-[#F5F5F5] border border-[#E0E0E0]">
            <h4 className="font-black uppercase tracking-wider text-black text-xs mb-1.5">
              How to Measure Your Foot Length
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-[#555] leading-relaxed">
              <li>Place a piece of paper on a hard floor with one edge against a flat wall.</li>
              <li>Stand barefoot with your heel firmly touching the wall.</li>
              <li>Mark the farthest point of your longest toe on the paper.</li>
              <li>Measure the distance from the edge to your mark in centimeters (CM).</li>
            </ol>
            <p className="text-[10px] text-[#767677] mt-2 font-semibold uppercase tracking-wide">
              Tip: If you fall between two sizes, choose the larger half-size for extra forefoot comfort.
            </p>
          </div>

          {/* Sizing Table */}
          <div className="max-h-72 overflow-y-auto border border-[#E0E0E0]">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-black text-white font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-2.5">UK Size</th>
                  <th className="p-2.5">US Men</th>
                  <th className="p-2.5">US Women</th>
                  <th className="p-2.5">EUR</th>
                  <th className="p-2.5 text-right">Length (CM)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAEAEA]">
                {[
                  { uk: "UK 4", usM: "4.5", usW: "5.5", eur: "36.7", cm: "22.5" },
                  { uk: "UK 4.5", usM: "5.0", usW: "6.0", eur: "37.3", cm: "22.9" },
                  { uk: "UK 5", usM: "5.5", usW: "6.5", eur: "38.0", cm: "23.3" },
                  { uk: "UK 5.5", usM: "6.0", usW: "7.0", eur: "38.7", cm: "23.8" },
                  { uk: "UK 6", usM: "6.5", usW: "7.5", eur: "39.3", cm: "24.2" },
                  { uk: "UK 6.5", usM: "7.0", usW: "8.0", eur: "40.0", cm: "24.6" },
                  { uk: "UK 7", usM: "7.5", usW: "8.5", eur: "40.7", cm: "25.0" },
                  { uk: "UK 7.5", usM: "8.0", usW: "9.0", eur: "41.3", cm: "25.5" },
                  { uk: "UK 8", usM: "8.5", usW: "9.5", eur: "42.0", cm: "26.0" },
                  { uk: "UK 8.5", usM: "9.0", usW: "10.0", eur: "42.7", cm: "26.3" },
                  { uk: "UK 9", usM: "9.5", usW: "10.5", eur: "43.3", cm: "26.7" },
                  { uk: "UK 9.5", usM: "10.0", usW: "11.0", eur: "44.0", cm: "27.1" },
                  { uk: "UK 10", usM: "10.5", usW: "11.5", eur: "44.7", cm: "27.6" },
                  { uk: "UK 10.5", usM: "11.0", usW: "12.0", eur: "45.3", cm: "28.0" },
                  { uk: "UK 11", usM: "11.5", usW: "12.5", eur: "46.0", cm: "28.4" },
                  { uk: "UK 12", usM: "12.5", usW: "13.5", eur: "47.3", cm: "29.3" },
                ].map((row) => (
                  <tr
                    key={row.uk}
                    className={cn(
                      "hover:bg-[#F9F9F9] transition-colors",
                      selectedSize === row.uk && "bg-[#F0F0F0] font-black"
                    )}
                  >
                    <td className="p-2.5 font-black text-black">{row.uk}</td>
                    <td className="p-2.5 text-[#555]">{row.usM}</td>
                    <td className="p-2.5 text-[#555]">{row.usW}</td>
                    <td className="p-2.5 text-[#555]">{row.eur}</td>
                    <td className="p-2.5 text-right font-mono font-bold text-black">{row.cm} cm</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>
    </div>
  );
}
