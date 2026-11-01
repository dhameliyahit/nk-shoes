"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  RiArrowLeftLine,
  RiSaveLine,
  RiAddLine,
  RiDeleteBinLine,
  RiImageLine,
} from "react-icons/ri";
import { getAdminCategories, AdminCategory } from "@/services/adminService";
import { Product } from "@/types/product";
import { RichTextEditor } from "@/components/admin/rich-text-editor";

interface ProductFormProps {
  initialData?: Product | null;
  onSubmit: (formData: any) => Promise<void>;
  isSubmitting?: boolean;
  pageTitle: string;
}

const DEFAULT_SIZES = [
  { size: "UK 6", stock: 8, available: true },
  { size: "UK 7", stock: 12, available: true },
  { size: "UK 8", stock: 15, available: true },
  { size: "UK 9", stock: 14, available: true },
  { size: "UK 10", stock: 10, available: true },
  { size: "UK 11", stock: 6, available: true },
];

export function ProductForm({
  initialData,
  onSubmit,
  isSubmitting = false,
  pageTitle,
}: ProductFormProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<AdminCategory[]>([]);

  // Form State
  const [name, setName] = useState(initialData?.name || "");
  const [subtitle, setSubtitle] = useState(initialData?.subtitle || "Men's Performance Footwear");
  const [tagline, setTagline] = useState(initialData?.tagline || "");
  const [categorySlug, setCategorySlug] = useState(
    initialData?.categorySlug || (typeof initialData?.category === "string" ? initialData.category : "running")
  );
  const [price, setPrice] = useState(initialData?.price ? String(initialData.price) : "3499");
  const [originalPrice, setOriginalPrice] = useState(
    initialData?.originalPrice ? String(initialData.originalPrice) : "4999"
  );
  const [sku, setSku] = useState(initialData?.sku || `NK-${Math.floor(100000 + Math.random() * 900000)}`);
  const [description, setDescription] = useState(initialData?.description || "");
  const [isFeatured, setIsFeatured] = useState(initialData?.isFeatured ?? true);
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [badgeText, setBadgeText] = useState(initialData?.badge?.text || "NEW DROP");

  // Sizes Matrix
  const [sizes, setSizes] = useState<{ size: string; stock: number; available: boolean }[]>(
    initialData?.sizes && initialData.sizes.length > 0
      ? initialData.sizes.map((s: any) => ({
          size: typeof s === "string" ? s : s.size,
          stock: typeof s === "object" && s.stock !== undefined ? Number(s.stock) : 10,
          available: typeof s === "object" && s.available !== undefined ? Boolean(s.available) : true,
        }))
      : DEFAULT_SIZES
  );

  // Images
  const [images, setImages] = useState<string[]>(
    initialData?.images && initialData.images.length > 0
      ? initialData.images
      : ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&q=85"]
  );
  const [newImageUrl, setNewImageUrl] = useState("");

  // Colorways
  const [colors, setColors] = useState<{ name: string; hex: string }[]>(
    initialData?.colors && initialData.colors.length > 0
      ? initialData.colors.map((c) => ({ name: c.name, hex: c.hex }))
      : [
          { name: "Core Black / Cloud White", hex: "#111111" },
          { name: "Solar Red / Volt", hex: "#E53E3E" },
        ]
  );
  const [newColorName, setNewColorName] = useState("");
  const [newColorHex, setNewColorHex] = useState("#111111");

  // Features list
  const [features, setFeatures] = useState<string[]>(
    initialData?.features && initialData.features.length > 0
      ? initialData.features
      : [
          "Lightweight engineered mesh upper for maximum breathability",
          "Full-length responsive foam midsole with 20% higher energy return",
          "High-abrasion Continental grip rubber outsole",
        ]
  );
  const [newFeature, setNewFeature] = useState("");

  useEffect(() => {
    async function loadCategories() {
      try {
        const data = await getAdminCategories();
        setCategories(data);
        if (data.length > 0 && !categorySlug) {
          setCategorySlug(data[0].slug);
        }
      } catch {
        // Fallback categories
        setCategories([
          { _id: "1", name: "Running", slug: "running" },
          { _id: "2", name: "Sneakers", slug: "sneakers" },
          { _id: "3", name: "Sports", slug: "sports" },
        ]);
      }
    }
    loadCategories();
  }, [categorySlug]);

  // Size handler
  const handleSizeStockChange = (idx: number, stockValue: number) => {
    setSizes((prev) => {
      const updated = [...prev];
      updated[idx] = {
        ...updated[idx],
        stock: Math.max(0, stockValue),
        available: stockValue > 0,
      };
      return updated;
    });
  };

  // Add Image
  const handleAddImage = () => {
    if (!newImageUrl.trim()) return;
    setImages((prev) => [...prev, newImageUrl.trim()]);
    setNewImageUrl("");
  };

  // Remove Image
  const handleRemoveImage = (idx: number) => {
    if (images.length <= 1) {
      toast.error("Shoe must have at least one product image");
      return;
    }
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  // Add Colorway
  const handleAddColor = () => {
    if (!newColorName.trim()) return;
    setColors((prev) => [...prev, { name: newColorName.trim(), hex: newColorHex }]);
    setNewColorName("");
    setNewColorHex("#111111");
  };

  // Remove Colorway
  const handleRemoveColor = (idx: number) => {
    if (colors.length <= 1) {
      toast.error("Shoe must have at least one colorway");
      return;
    }
    setColors((prev) => prev.filter((_, i) => i !== idx));
  };

  // Add Feature
  const handleAddFeature = () => {
    if (!newFeature.trim()) return;
    setFeatures((prev) => [...prev, newFeature.trim()]);
    setNewFeature("");
  };

  // Remove Feature
  const handleRemoveFeature = (idx: number) => {
    setFeatures((prev) => prev.filter((_, i) => i !== idx));
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Product name is required");
      return;
    }

    const numPrice = Number(price);
    const numOriginalPrice = Number(originalPrice);

    if (isNaN(numPrice) || numPrice <= 0) {
      toast.error("Please enter a valid selling price");
      return;
    }

    // Calculate total stock
    const totalStock = sizes.reduce((acc, s) => acc + (s.available ? s.stock : 0), 0);

    const payload = {
      name: name.trim(),
      subtitle: subtitle.trim(),
      tagline: tagline.trim(),
      category: categorySlug,
      categorySlug: categorySlug,
      gender: "men",
      price: numPrice,
      originalPrice: numOriginalPrice > numPrice ? numOriginalPrice : numPrice,
      sku: sku.trim(),
      description: description.trim(),
      isFeatured,
      isActive,
      stock: totalStock,
      inStock: totalStock > 0,
      badge: badgeText.trim() ? { text: badgeText.trim().toUpperCase(), variant: "sale" } : undefined,
      sizes,
      images,
      colors,
      features,
    };

    await onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8 font-sans select-none pb-16">
      {/* 1. TOP HEADER & SAVE BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E7EB]">
        <div>
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6B7280] hover:text-black uppercase tracking-wider mb-2 transition-colors cursor-pointer"
          >
            <RiArrowLeftLine className="text-sm" />
            <span>Back to Products</span>
          </Link>
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-[#111111]">
            {pageTitle}
          </h2>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Configure footwear silhouette, sizes stock matrix, pricing, and visual gallery.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => router.push("/admin/products")}
            className="px-4 py-2 border border-[#D1D5DB] text-xs font-bold uppercase tracking-wider text-[#374151] hover:bg-[#F3F4F6] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-[#111111] hover:bg-black text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RiSaveLine className="text-sm" />
            <span>{isSubmitting ? "Saving Shoe..." : "Save Product"}</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN 2-COLUMN FORM BODY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* LEFT COLUMN: BASIC INFO, SIZES & PRICING (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* ESSENTIALS CARD */}
          <div className="bg-white border border-[#E5E7EB] p-5 shadow-2xs space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#111111] pb-2 border-b border-[#E5E7EB]">
              Footwear Essentials
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#374151] mb-1">
                  Shoe Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. NK Ultraboost Light 26"
                  required
                  className="w-full h-10 px-3 border border-[#D1D5DB] text-xs font-bold text-[#111111] rounded-none outline-none focus:border-black"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#374151] mb-1">
                    Subtitle / Classification
                  </label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="e.g. Men's High-Mileage Road Running"
                    className="w-full h-10 px-3 border border-[#D1D5DB] text-xs text-[#111111] rounded-none outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#374151] mb-1">
                    Category *
                  </label>
                  <select
                    value={categorySlug}
                    onChange={(e) => setCategorySlug(e.target.value)}
                    className="w-full h-10 px-3 border border-[#D1D5DB] text-xs font-bold text-[#111111] bg-white rounded-none outline-none focus:border-black uppercase"
                  >
                    {categories.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#374151] mb-1">
                  Tagline / Punchline
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="e.g. Experience epic energy return with responsive cushioning."
                  className="w-full h-10 px-3 border border-[#D1D5DB] text-xs text-[#111111] rounded-none outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#374151] mb-1">
                  Detailed Description (Rich Text Editor)
                </label>
                <RichTextEditor
                  value={description}
                  onChange={(html) => setDescription(html)}
                  placeholder="Engineered for daily distance and explosive road tempo..."
                />
              </div>
            </div>
          </div>

          {/* SIZES & STOCK MATRIX CARD */}
          <div className="bg-white border border-[#E5E7EB] p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#111111]">
                  Sizes & Individual Stock Matrix
                </h3>
                <p className="text-[10px] text-[#6B7280]">
                  Pairs in inventory per Indian/UK shoe size.
                </p>
              </div>
              <span className="text-xs font-bold font-mono text-[#047857]">
                Total Stock: {sizes.reduce((acc, s) => acc + (s.available ? s.stock : 0), 0)} pairs
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {sizes.map((s, idx) => (
                <div
                  key={s.size}
                  className={`p-3 border transition-colors ${
                    s.stock > 0 ? "border-[#E5E7EB] bg-[#FAFAFA]" : "border-[#FECACA] bg-[#FEF2F2]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-extrabold text-xs text-[#111111]">{s.size}</span>
                    <span
                      className={`text-[9px] font-bold uppercase px-1 py-0.2 border ${
                        s.stock > 0
                          ? "bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]"
                          : "bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]"
                      }`}
                    >
                      {s.stock > 0 ? `${s.stock} in stock` : "OOS"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-[10px] text-[#6B7280] uppercase font-bold shrink-0">
                      Qty:
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={s.stock}
                      onChange={(e) => handleSizeStockChange(idx, Number(e.target.value))}
                      className="w-full h-8 px-2 border border-[#D1D5DB] text-xs font-bold text-center bg-white rounded-none outline-none focus:border-black"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* PRICING & SKU CARD */}
          <div className="bg-white border border-[#E5E7EB] p-5 shadow-2xs space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#111111] pb-2 border-b border-[#E5E7EB]">
              Pricing & Inventory SKU
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#374151] mb-1">
                  Selling Price (₹) *
                </label>
                <input
                  type="number"
                  min={1}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  className="w-full h-10 px-3 border border-[#D1D5DB] text-xs font-black text-[#111111] rounded-none outline-none focus:border-black tabular-nums"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#374151] mb-1">
                  Original MSRP Price (₹)
                </label>
                <input
                  type="number"
                  min={1}
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                  className="w-full h-10 px-3 border border-[#D1D5DB] text-xs text-[#6B7280] rounded-none outline-none focus:border-black tabular-nums"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#374151] mb-1">
                  SKU Code
                </label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full h-10 px-3 border border-[#D1D5DB] text-xs font-mono font-bold text-[#111111] rounded-none outline-none focus:border-black"
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: IMAGES, COLORWAYS, BADGES & FEATURES (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* IMAGE GALLERY CARD */}
          <div className="bg-white border border-[#E5E7EB] p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#111111]">
                Product Image Canvas ({images.length})
              </h3>
            </div>

            {/* PREVIEWS ROW */}
            <div className="grid grid-cols-3 gap-2.5">
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className="relative aspect-square bg-[#F5F5F5] border border-[#E5E7EB] p-1 group flex items-center justify-center overflow-hidden"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt={`Preview ${idx}`} className="w-full h-full object-contain" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-1 right-1 w-6 h-6 bg-black text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    title="Remove Image"
                  >
                    <RiDeleteBinLine />
                  </button>
                  {idx === 0 && (
                    <span className="absolute bottom-1 left-1 bg-black text-white text-[9px] font-bold uppercase px-1">
                      Main
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* ADD IMAGE INPUT */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="url"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="Paste Cloudinary / image URL..."
                className="flex-1 h-9 px-3 border border-[#D1D5DB] text-xs rounded-none outline-none focus:border-black"
              />
              <button
                type="button"
                onClick={handleAddImage}
                className="px-3 h-9 bg-[#111111] hover:bg-black text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer shrink-0"
              >
                <RiAddLine />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* COLORWAYS CARD */}
          <div className="bg-white border border-[#E5E7EB] p-5 shadow-2xs space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#111111] pb-2 border-b border-[#E5E7EB]">
              Colorways ({colors.length})
            </h3>

            <div className="space-y-2">
              {colors.map((c, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 border border-[#E5E7EB] bg-[#FAFAFA]"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-4 h-4 rounded-full border border-black/20 shrink-0"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span className="text-xs font-bold text-[#111111]">{c.name}</span>
                    <span className="text-[10px] text-[#6B7280] font-mono">{c.hex}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveColor(idx)}
                    className="text-[#9CA3AF] hover:text-[#B91C1C] cursor-pointer p-1"
                  >
                    <RiDeleteBinLine className="text-sm" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="color"
                value={newColorHex}
                onChange={(e) => setNewColorHex(e.target.value)}
                className="w-9 h-9 p-0.5 border border-[#D1D5DB] cursor-pointer shrink-0 rounded-none bg-white"
              />
              <input
                type="text"
                value={newColorName}
                onChange={(e) => setNewColorName(e.target.value)}
                placeholder="Color Name (e.g. Triple Black)"
                className="flex-1 h-9 px-3 border border-[#D1D5DB] text-xs rounded-none outline-none focus:border-black"
              />
              <button
                type="button"
                onClick={handleAddColor}
                className="px-3 h-9 bg-[#111111] hover:bg-black text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer shrink-0"
              >
                <RiAddLine />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* BADGES & VISIBILITY CARD */}
          <div className="bg-white border border-[#E5E7EB] p-5 shadow-2xs space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#111111] pb-2 border-b border-[#E5E7EB]">
              Badges & Status
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#374151] mb-1">
                  Product Ribbon Badge
                </label>
                <input
                  type="text"
                  value={badgeText}
                  onChange={(e) => setBadgeText(e.target.value)}
                  placeholder="e.g. -20% OFF or NEW DROP"
                  className="w-full h-9 px-3 border border-[#D1D5DB] text-xs font-bold uppercase rounded-none outline-none focus:border-black"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div>
                  <span className="font-bold text-[#111111] block">Active in Store Catalog</span>
                  <span className="text-[10px] text-[#6B7280]">
                    Customers can browse and buy this product
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 accent-[#111111] cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#F3F4F6]">
                <div>
                  <span className="font-bold text-[#111111] block">Featured on Home Page</span>
                  <span className="text-[10px] text-[#6B7280]">
                    Highlighted in featured collection rows
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 accent-[#111111] cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* TECHNICAL FEATURES CARD */}
          <div className="bg-white border border-[#E5E7EB] p-5 shadow-2xs space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#111111] pb-2 border-b border-[#E5E7EB]">
              Technical Specifications ({features.length})
            </h3>

            <div className="space-y-2">
              {features.map((feat, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between gap-2 p-2 bg-[#FAFAFA] border border-[#E5E7EB] text-xs"
                >
                  <span className="text-[#374151] leading-relaxed">• {feat}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFeature(idx)}
                    className="text-[#9CA3AF] hover:text-[#B91C1C] cursor-pointer shrink-0 p-1"
                  >
                    <RiDeleteBinLine className="text-sm" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                placeholder="e.g. Reinforced lateral heel lockdown..."
                className="flex-1 h-9 px-3 border border-[#D1D5DB] text-xs rounded-none outline-none focus:border-black"
              />
              <button
                type="button"
                onClick={handleAddFeature}
                className="px-3 h-9 bg-[#111111] hover:bg-black text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer shrink-0"
              >
                <RiAddLine />
                <span>Add</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

export default ProductForm;
