"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  RiArrowLeftLine,
  RiSaveLine,
  RiAddLine,
  RiDeleteBinLine,
  RiImageLine,
  RiUploadCloud2Line,
  RiLoader4Line,
  RiStarFill,
  RiSparkling2Line,
  RiFileCopyLine,
  RiCheckLine,
  RiCloseLine,
  RiExternalLinkLine,
  RiMagicLine,
  RiCodeBoxLine,
  RiImageAddLine,
  RiDownloadCloud2Line,
} from "react-icons/ri";
import {
  getAdminCategories,
  uploadAdminProductImages,
  AdminCategory,
} from "@/services/adminService";
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
  // Multi-Category State
  const initialCategorySlugs = React.useMemo(() => {
    if (Array.isArray(initialData?.categorySlugs) && initialData.categorySlugs.length > 0) {
      return initialData.categorySlugs.map((s) => String(s).toLowerCase().trim());
    }
    if (Array.isArray(initialData?.categories) && initialData.categories.length > 0) {
      return initialData.categories.map((c: any) =>
        (typeof c === "object" ? c.slug || c.name : String(c)).toLowerCase().trim()
      );
    }
    const single = initialData?.categorySlug || (typeof initialData?.category === "string" ? initialData.category : null);
    if (single) return [single.toLowerCase().trim()];
    return ["running"];
  }, [initialData]);

  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCategorySlugs);
  const [categorySlug, setCategorySlug] = useState<string>(initialCategorySlugs[0] || "running");
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

  // Images (Clean start: no unwanted default dummy images)
  const [images, setImages] = useState<string[]>(
    initialData?.images && initialData.images.length > 0 ? initialData.images : []
  );
  const [newImageUrl, setNewImageUrl] = useState("");
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI Assistant Modal State & Prompts
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiShoeName, setAiShoeName] = useState("");
  const [aiCategory, setAiCategory] = useState("running");
  const [aiPrice, setAiPrice] = useState("7999");
  const [aiModalTab, setAiModalTab] = useState<"content" | "image" | "import">("content");
  const [copiedPromptType, setCopiedPromptType] = useState<string | null>(null);
  const [pastedJson, setPastedJson] = useState("");

  const contentPromptText = React.useMemo(() => {
    const targetName = aiShoeName.trim() || name.trim() || "Nike Air Zoom Pegasus 41";
    const targetCat = aiCategory || categorySlug || "running";
    const targetPrice = Number(aiPrice) || Number(price) || 8999;
    const targetOriginal = Math.round(targetPrice * 1.35);
    const skuCode = `NK-${(targetName.replace(/[^A-Za-z0-9]/g, "").slice(0, 8).toUpperCase()) || "SHOE"}-2026`;

    return `You are an elite footwear e-commerce copywriter & catalog SEO specialist for NK-SHOES.
Generate a complete, high-converting product specification for "${targetName}" in pure JSON format.
DO NOT wrap the response in markdown fences (\`\`\`json). Return ONLY the raw valid JSON object matching this schema:

{
  "name": "${targetName}",
  "subtitle": "Men's Road Running Shoes",
  "tagline": "Springy cushioning for your daily mileage with responsive dual Air Zoom units.",
  "category": "${targetCat}",
  "categorySlug": "${targetCat}",
  "categories": ["${targetCat}", "sneakers"],
  "gender": "men",
  "price": ${targetPrice},
  "originalPrice": ${targetOriginal},
  "sku": "${skuCode}",
  "description": "<p>Experience responsive energy return and lightweight comfort with the ${targetName}. Built with engineered breathable mesh and dynamic foam cushioning for road and track performance.</p><h3>Key Highlights:</h3><ul><li>Responsive dual cushioning units</li><li>Breathable engineered mono-mesh</li><li>Durable Continental rubber outsole</li></ul>",
  "features": [
    "Full-length responsive foam midsole with 20% higher energy return",
    "Engineered breathable single-layer mesh upper with targeted lockdown band",
    "High-abrasion rubber outsole with waffle pattern for wet and dry road grip",
    "Heel-to-toe drop: 10mm (Heel: 32mm / Forefoot: 22mm)",
    "Padded collar and sculpted tongue to eliminate lace pressure"
  ],
  "colors": [
    { "name": "Core Black / Cloud White", "hex": "#111111" },
    { "name": "Solar Red / Volt Pulse", "hex": "#E53E3E" },
    { "name": "Royal Blue / Metallic Silver", "hex": "#2563EB" }
  ],
  "sizes": [
    { "size": "UK 6", "stock": 10, "available": true },
    { "size": "UK 7", "stock": 15, "available": true },
    { "size": "UK 8", "stock": 25, "available": true },
    { "size": "UK 9", "stock": 20, "available": true },
    { "size": "UK 10", "stock": 12, "available": true },
    { "size": "UK 11", "stock": 6, "available": true }
  ],
  "isFeatured": true
}`;
  }, [aiShoeName, name, aiCategory, categorySlug, aiPrice, price]);

  const studioImagePromptText = React.useMemo(() => {
    const targetName = aiShoeName.trim() || name.trim() || "Nike Air Zoom Pegasus 41";
    return `Commercial luxury footwear e-commerce studio product photograph of ${targetName}, floating dynamic 45-degree angled perspective showcasing athletic side profile and rubber outsole tread, crisp breathable engineered flyknit mesh upper, responsive foam midsole with detailed texture, Continental traction rubber sole, isolated on pure clean seamless studio background (#F4F4F6) with soft ambient contact shadow beneath sole, crisp studio softbox lighting, high-contrast, raytracing reflections, photorealistic 8k, Hasselblad H6D-100c medium format camera shot, commercial catalog quality, no watermark, no blur, razor-sharp focus --ar 4:3 --style raw --v 6.1`;
  }, [aiShoeName, name]);

  const img2imgPromptText = React.useMemo(() => {
    const targetName = aiShoeName.trim() || name.trim() || "athletic footwear";
    return `Transform this uploaded footwear image of ${targetName} into an ultra-premium studio e-commerce catalog photograph. Retain the exact shoe shape, color palette, logo positioning, and silhouette. Elevate materials to crisp, photorealistic engineered footwear textures. Place on a seamless pure white studio showroom background with subtle diffused contact floor shadow, commercial multi-point softbox studio lighting, 8k resolution, razor-sharp focus --iw 2.0 --ar 4:3`;
  }, [aiShoeName, name]);

  const handleCopyPrompt = async (text: string, typeKey: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPromptType(typeKey);
      toast.success("Prompt copied to clipboard!");
      setTimeout(() => setCopiedPromptType(null), 2500);
    } catch {
      toast.error("Failed to copy prompt");
    }
  };

  const handleAutofillFromJson = () => {
    if (!pastedJson.trim()) {
      toast.error("Please paste the AI JSON output first");
      return;
    }

    try {
      let clean = pastedJson.trim();
      if (clean.startsWith("```")) {
        clean = clean.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
      }

      const parsed = JSON.parse(clean);

      if (parsed.name) setName(parsed.name);
      if (parsed.subtitle) setSubtitle(parsed.subtitle);
      if (parsed.tagline) setTagline(parsed.tagline);
      if (parsed.sku) setSku(parsed.sku);
      if (parsed.price !== undefined) setPrice(String(parsed.price));
      if (parsed.originalPrice !== undefined) setOriginalPrice(String(parsed.originalPrice));
      if (parsed.description) setDescription(parsed.description);

      if (Array.isArray(parsed.categories) && parsed.categories.length > 0) {
        const catList = parsed.categories.map((c: any) => String(c).toLowerCase().trim());
        setSelectedCategories(catList);
        setCategorySlug(catList[0]);
      } else if (Array.isArray(parsed.categorySlugs) && parsed.categorySlugs.length > 0) {
        const catList = parsed.categorySlugs.map((c: any) => String(c).toLowerCase().trim());
        setSelectedCategories(catList);
        setCategorySlug(catList[0]);
      } else if (parsed.categorySlug || parsed.category) {
        const cat = String(parsed.categorySlug || parsed.category).toLowerCase().trim();
        setSelectedCategories([cat]);
        setCategorySlug(cat);
      }

      if (Array.isArray(parsed.features) && parsed.features.length > 0) {
        setFeatures(parsed.features.map((f: any) => String(f)));
      }

      if (Array.isArray(parsed.colors) && parsed.colors.length > 0) {
        setColors(
          parsed.colors.map((c: any) => ({
            name: c.name || "Default Color",
            hex: c.hex || "#111111",
          }))
        );
      }

      if (Array.isArray(parsed.sizes) && parsed.sizes.length > 0) {
        setSizes(
          parsed.sizes.map((s: any) => ({
            size: s.size || "UK 8",
            stock: Number(s.stock ?? 10),
            available: Number(s.stock ?? 10) > 0,
          }))
        );
      }

      if (Array.isArray(parsed.images) && parsed.images.length > 0) {
        setImages(parsed.images);
      }

      if (parsed.isFeatured !== undefined) {
        setIsFeatured(Boolean(parsed.isFeatured));
      }

      setIsAiModalOpen(false);
      setPastedJson("");
      toast.success("All product fields successfully autofilled from AI JSON!");
    } catch (err: any) {
      toast.error(`Invalid JSON: ${err.message}. Please check AI response.`);
    }
  };

  // Smart Client-Side Image Preserver (Preserves 100% full quality, only optimizing huge >2.5MB raw photos)
  const optimizeImageForUpload = async (file: File, maxWidth = 2560, quality = 0.92): Promise<File> => {
    // If already clean and under 2.5MB, do not touch - keep 100% original full fidelity
    if (
      typeof window === "undefined" ||
      !file.type.startsWith("image/") ||
      file.type === "image/svg+xml" ||
      file.type === "image/gif" ||
      file.size <= 2.5 * 1024 * 1024
    ) {
      return file;
    }

    return new Promise((resolve) => {
      const img = document.createElement("img");
      const reader = new FileReader();

      reader.onload = (e) => {
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxWidth) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxWidth) / height);
              height = maxWidth;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return resolve(file);

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (!blob || blob.size >= file.size) return resolve(file);
              const optimized = new File([blob], file.name.replace(/\.[^.]+$/, ".webp"), {
                type: "image/webp",
                lastModified: Date.now(),
              });
              resolve(optimized);
            },
            "image/webp",
            quality
          );
        };
        img.onerror = () => resolve(file);
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    });
  };

  // Multi-File Upload Handler (Optimizes & uploads to Cloudinary)
  const handleFilesUpload = async (fileList: FileList | File[]) => {
    const fileArray = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    if (fileArray.length === 0) {
      toast.error("Please select valid image files (JPG, PNG, WEBP, AVIF)");
      return;
    }

    setIsUploadingImages(true);
    const toastId = toast.loading(`Optimizing & uploading ${fileArray.length} photo(s)...`);
    try {
      const optimizedFiles = await Promise.all(
        fileArray.map((file) => optimizeImageForUpload(file))
      );
      const urls = await uploadAdminProductImages(optimizedFiles);
      setImages((prev) => [...prev, ...urls]);
      toast.success(`Successfully uploaded ${urls.length} product image(s)!`, { id: toastId });
    } catch (err: any) {
      toast.error(err.message || "Failed to upload images", { id: toastId });
    } finally {
      setIsUploadingImages(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Set As Main Thumbnail
  const handleSetMainImage = (idx: number) => {
    if (idx === 0) return;
    setImages((prev) => {
      const target = prev[idx];
      const rest = prev.filter((_, i) => i !== idx);
      return [target, ...rest];
    });
    toast.success("Set as main display thumbnail");
  };

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
        if (data.length > 0 && selectedCategories.length === 0) {
          setSelectedCategories([data[0].slug]);
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
  }, []);

  // Multi-Category Handlers
  const handleToggleCategory = (slug: string) => {
    const cleanSlug = slug.toLowerCase().trim();
    setSelectedCategories((prev) => {
      let next: string[];
      if (prev.includes(cleanSlug)) {
        if (prev.length === 1) {
          toast.error("Footwear must belong to at least one category");
          return prev;
        }
        next = prev.filter((s) => s !== cleanSlug);
      } else {
        next = [...prev, cleanSlug];
      }
      setCategorySlug(next[0] || "running");
      return next;
    });
  };

  const handleSetPrimaryCategory = (slug: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const cleanSlug = slug.toLowerCase().trim();
    setSelectedCategories((prev) => {
      const filtered = prev.filter((s) => s !== cleanSlug);
      const next = [cleanSlug, ...filtered];
      setCategorySlug(cleanSlug);
      toast.success(`Primary category set to ${cleanSlug.toUpperCase()}`);
      return next;
    });
  };

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
    setImages((prev) => prev.filter((_, i) => i !== idx));
    toast.success("Photo removed from gallery");
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

    if (images.length === 0) {
      toast.error("Please upload or add at least one product photo");
      return;
    }

    // Calculate total stock
    const totalStock = sizes.reduce((acc, s) => acc + (s.available ? s.stock : 0), 0);

    const primaryCat = selectedCategories[0] || categorySlug || "sneakers";
    const payload = {
      name: name.trim(),
      subtitle: subtitle.trim(),
      tagline: tagline.trim(),
      category: primaryCat,
      categorySlug: primaryCat,
      categories: selectedCategories.length > 0 ? selectedCategories : [primaryCat],
      categorySlugs: selectedCategories.length > 0 ? selectedCategories : [primaryCat],
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

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              if (name && !aiShoeName) setAiShoeName(name);
              setIsAiModalOpen(true);
            }}
            className="px-4 py-2 bg-[#111111] hover:bg-black text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 border border-[#374151] transition-all cursor-pointer shadow-xs group"
          >
            <RiSparkling2Line className="text-sm text-yellow-400 group-hover:rotate-12 transition-transform" />
            <span>AI Assistant & Prompts</span>
          </button>
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

              {/* MULTI-CATEGORY SELECTOR */}
              <div className="space-y-2.5 pt-3 pb-1 border-t border-[#F3F4F6]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#111111]">
                      Categories (Multi-Select) *
                    </label>
                    <p className="text-[10px] text-[#6B7280]">
                      Select all categories this shoe belongs to. The first one is the <span className="font-bold text-black">Primary Category</span>.
                    </p>
                  </div>
                  {selectedCategories.length > 0 && (
                    <span className="text-[10px] font-mono text-[#047857] font-bold bg-[#ECFDF5] px-2.5 py-0.5 border border-[#A7F3D0] self-start sm:self-auto">
                      {selectedCategories.length} Selected • Primary: {selectedCategories[0]?.toUpperCase()}
                    </span>
                  )}
                </div>

                {/* PILLS LIST */}
                <div className="flex flex-wrap gap-2 pt-0.5">
                  {categories.map((c) => {
                    const cleanSlug = c.slug.toLowerCase().trim();
                    const isSelected = selectedCategories.includes(cleanSlug);
                    const isPrimary = isSelected && selectedCategories[0] === cleanSlug;

                    return (
                      <div
                        key={c.slug}
                        onClick={() => handleToggleCategory(cleanSlug)}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wider border cursor-pointer transition-all select-none ${
                          isSelected
                            ? isPrimary
                              ? "bg-[#111111] text-white border-black shadow-xs ring-1 ring-black"
                              : "bg-[#1F2937] text-white border-[#374151]"
                            : "bg-white text-[#4B5563] border-[#D1D5DB] hover:border-black hover:text-black"
                        }`}
                      >
                        <div
                          className={`w-3.5 h-3.5 flex items-center justify-center border text-[10px] shrink-0 ${
                            isSelected
                              ? "bg-white text-black border-white"
                              : "bg-white border-[#9CA3AF]"
                          }`}
                        >
                          {isSelected && <RiCheckLine className="text-black stroke-[2]" />}
                        </div>
                        <span>{c.name}</span>

                        {isPrimary ? (
                          <span className="ml-1 text-[9px] font-black uppercase px-1.5 py-0.2 bg-yellow-400 text-black">
                            Primary
                          </span>
                        ) : isSelected ? (
                          <button
                            type="button"
                            title="Set as Primary Category"
                            onClick={(e) => handleSetPrimaryCategory(cleanSlug, e)}
                            className="ml-1 text-[9px] text-[#9CA3AF] hover:text-yellow-300 underline font-normal cursor-pointer"
                          >
                            Make Primary
                          </button>
                        ) : null}
                      </div>
                    );
                  })}
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
              <span className="text-[10px] text-[#6B7280] font-mono">
                Click star to set as main thumbnail
              </span>
            </div>

            {/* MULTI-FILE DRAG & DROP UPLOAD ZONE */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  handleFilesUpload(e.dataTransfer.files);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed p-5 text-center cursor-pointer transition-colors ${
                isDragging
                  ? "border-black bg-[#F5F5F5]"
                  : "border-[#D1D5DB] bg-[#FAFAFA] hover:border-black hover:bg-white"
              } ${isUploadingImages ? "opacity-60 pointer-events-none" : ""}`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFilesUpload(e.target.files);
                  }
                }}
                className="hidden"
              />

              <div className="flex flex-col items-center justify-center gap-2">
                {isUploadingImages ? (
                  <>
                    <RiLoader4Line className="text-2xl text-black animate-spin" />
                    <p className="text-xs font-bold uppercase tracking-wider text-[#111111]">
                      Uploading to Cloudinary...
                    </p>
                  </>
                ) : (
                  <>
                    <RiUploadCloud2Line className="text-2xl text-[#4B5563]" />
                    <p className="text-xs font-bold uppercase tracking-wider text-[#111111]">
                      Drop multiple product photos here or{" "}
                      <span className="underline text-black font-black">browse files</span>
                    </p>
                    <p className="text-[10px] text-[#6B7280]">
                      Select multiple images at once (JPEG, PNG, WEBP, AVIF). Direct Cloudinary upload.
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* PREVIEWS ROW - TOUCH FRIENDLY FOR TABLETS & PHONES */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#374151]">
                  Gallery Images ({images.length})
                </span>
                <span className="text-[10px] text-[#6B7280]">
                  📱 Touch-friendly: Tap &quot;Set As Main&quot; on any photo
                </span>
              </div>

              {images.length === 0 ? (
                <div className="p-8 border-2 border-dashed border-[#D1D5DB] bg-[#FAFAFA] text-center">
                  <RiImageLine className="text-3xl text-[#9CA3AF] mx-auto mb-2" />
                  <p className="text-xs font-black text-[#111111] uppercase tracking-wider">
                    No Photos in Gallery
                  </p>
                  <p className="text-[10px] text-[#6B7280] mt-1 max-w-xs mx-auto">
                    Clean slate: upload your genuine product photos above or paste an image URL below.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {images.map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        if (idx !== 0) handleSetMainImage(idx);
                      }}
                      className={`relative aspect-square bg-[#F5F5F5] border p-2 flex flex-col items-center justify-between transition-all select-none cursor-pointer ${
                        idx === 0
                          ? "border-2 border-black bg-white shadow-sm ring-2 ring-black/10"
                          : "border-[#D1D5DB] hover:border-black active:scale-[0.98]"
                      }`}
                    >
                      {/* Top Row: Index Badge & Always-Visible Touch Delete Button */}
                      <div className="w-full flex items-center justify-between z-10">
                        {idx === 0 ? (
                          <span className="bg-black text-white text-[9px] font-black uppercase px-2 py-0.5 tracking-wider flex items-center gap-1 shadow-xs">
                            <RiStarFill className="text-yellow-400 text-xs" />
                            <span>Cover</span>
                          </span>
                        ) : (
                          <span className="bg-[#111111]/80 text-white text-[9px] font-mono px-1.5 py-0.5">
                            #{idx + 1}
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveImage(idx);
                          }}
                          className="w-7 h-7 bg-white hover:bg-[#E53E3E] text-[#B91C1C] hover:text-white border border-[#E5E7EB] flex items-center justify-center shadow-xs transition-colors cursor-pointer active:scale-95"
                          title="Delete photo"
                          aria-label="Delete photo"
                        >
                          <RiDeleteBinLine className="text-sm" />
                        </button>
                      </div>

                      {/* Shoe Image (Full fidelity, optimized contrast) */}
                      <div className="relative w-full flex-1 my-1 flex items-center justify-center overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img}
                          alt={`Shoe Preview ${idx + 1}`}
                          style={{ imageRendering: "-webkit-optimize-contrast" }}
                          className="w-full h-full object-contain pointer-events-none drop-shadow-2xs"
                        />
                      </div>

                      {/* Bottom Row: Set as Main Action Button */}
                      <div className="w-full z-10 pt-1">
                        {idx === 0 ? (
                          <div className="w-full py-1 text-center bg-[#F3F4F6] text-black text-[9px] font-black uppercase tracking-wider border border-[#E5E7EB]">
                            ✓ Primary Display
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSetMainImage(idx);
                            }}
                            className="w-full py-1.5 bg-white hover:bg-black text-black hover:text-white border border-black text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 shadow-xs transition-all active:scale-95 cursor-pointer"
                          >
                            <RiStarFill className="text-xs text-yellow-500" />
                            <span>Set As Main</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* OR PASTE IMAGE URL */}
            <div className="pt-2 border-t border-[#E5E7EB]">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6B7280] mb-1.5">
                Or paste remote image URL:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="https://res.cloudinary.com/..."
                  className="flex-1 h-9 px-3 border border-[#D1D5DB] text-xs rounded-none outline-none focus:border-black font-mono text-[11px]"
                />
                <button
                  type="button"
                  onClick={handleAddImage}
                  className="px-3 h-9 bg-[#111111] hover:bg-black text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <RiAddLine />
                  <span>Add URL</span>
                </button>
              </div>
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
      {/* 3. AI ASSISTANT & AUTOFILL MODAL DIALOG */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs">
          <div className="bg-white border-2 border-black w-full max-w-4xl shadow-2xl max-h-[92vh] flex flex-col rounded-none animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-[#111111] text-white px-5 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <RiSparkling2Line className="text-xl text-yellow-400 animate-pulse" />
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-white">
                    AI Product Catalog Studio & Autofill
                  </h3>
                  <p className="text-[10px] text-[#9CA3AF] tracking-wide">
                    Generate master SEO content JSON, commercial studio footwear images, and instant 1-click autofill
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAiModalOpen(false)}
                className="text-[#9CA3AF] hover:text-white transition-colors cursor-pointer p-1"
              >
                <RiCloseLine className="text-xl" />
              </button>
            </div>

            {/* Quick Configurator Strip */}
            <div className="bg-[#F9FAFB] border-b border-[#E5E7EB] p-4 shrink-0">
              <p className="text-[10px] font-black uppercase tracking-wider text-[#6B7280] mb-2">
                1. Configure Shoe Parameters (Prompts adapt in real-time)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#374151] mb-1">
                    Shoe Name / Model
                  </label>
                  <input
                    type="text"
                    value={aiShoeName}
                    onChange={(e) => setAiShoeName(e.target.value)}
                    placeholder={name || "e.g. Nike Air Zoom Pegasus 41"}
                    className="w-full h-8 px-2.5 bg-white border border-[#D1D5DB] text-xs font-bold text-black outline-none focus:border-black rounded-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#374151] mb-1">
                    Category
                  </label>
                  <select
                    value={aiCategory}
                    onChange={(e) => setAiCategory(e.target.value)}
                    className="w-full h-8 px-2 bg-white border border-[#D1D5DB] text-xs font-bold text-black outline-none focus:border-black rounded-none"
                  >
                    {categories.length > 0 ? (
                      categories.map((c) => (
                        <option key={c._id} value={c.slug}>
                          {c.name}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="running">Running</option>
                        <option value="sneakers">Sneakers</option>
                        <option value="sports">Sports</option>
                        <option value="casual">Casual</option>
                        <option value="premium">Premium</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#374151] mb-1">
                    Target Selling Price (₹ INR)
                  </label>
                  <input
                    type="number"
                    value={aiPrice}
                    onChange={(e) => setAiPrice(e.target.value)}
                    placeholder="7999"
                    className="w-full h-8 px-2.5 bg-white border border-[#D1D5DB] text-xs font-bold font-mono text-black outline-none focus:border-black rounded-none"
                  />
                </div>
              </div>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-[#E5E7EB] bg-white px-5 shrink-0 overflow-x-auto">
              <button
                type="button"
                onClick={() => setAiModalTab("content")}
                className={`py-3 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  aiModalTab === "content"
                    ? "border-black text-black"
                    : "border-transparent text-[#6B7280] hover:text-black"
                }`}
              >
                1. Product Content & SEO (JSON Prompt)
              </button>
              <button
                type="button"
                onClick={() => setAiModalTab("image")}
                className={`py-3 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  aiModalTab === "image"
                    ? "border-black text-black"
                    : "border-transparent text-[#6B7280] hover:text-black"
                }`}
              >
                2. Footwear Image Prompts (Studio & Upload)
              </button>
              <button
                type="button"
                onClick={() => setAiModalTab("import")}
                className={`py-3 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  aiModalTab === "import"
                    ? "border-black text-black bg-[#FAFAFA]"
                    : "border-transparent text-[#6B7280] hover:text-black"
                }`}
              >
                <RiCodeBoxLine className="text-sm" />
                <span>3. Paste JSON & Autofill Form</span>
              </button>
            </div>

            {/* Modal Tab Content (Scrollable) */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
              {/* TAB 1: CONTENT & SEO PROMPT */}
              {aiModalTab === "content" && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#F3F4F6] p-3 border border-[#E5E7EB]">
                    <div>
                      <p className="font-bold text-[#111111] uppercase tracking-wide text-xs">
                        Copy Master Product Content Prompt
                      </p>
                      <p className="text-[11px] text-[#4B5563]">
                        Paste this into ChatGPT, Claude, or Gemini to get structured JSON matching NK-SHOES requirements.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href="https://chatgpt.com"
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 bg-white border border-[#D1D5DB] text-[10px] font-bold uppercase tracking-wider text-[#374151] hover:text-black hover:border-black flex items-center gap-1 cursor-pointer"
                      >
                        ChatGPT <RiExternalLinkLine />
                      </a>
                      <a
                        href="https://claude.ai"
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 bg-white border border-[#D1D5DB] text-[10px] font-bold uppercase tracking-wider text-[#374151] hover:text-black hover:border-black flex items-center gap-1 cursor-pointer"
                      >
                        Claude <RiExternalLinkLine />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleCopyPrompt(contentPromptText, "content")}
                        className="px-3 py-1.5 bg-[#111111] hover:bg-black text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {copiedPromptType === "content" ? (
                          <>
                            <RiCheckLine className="text-sm text-green-400" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <RiFileCopyLine className="text-sm" />
                            <span>Copy JSON Prompt</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="relative">
                    <pre className="p-4 bg-[#1E1E1E] text-[#D4D4D4] font-mono text-[11px] overflow-x-auto max-h-[300px] border border-black leading-relaxed select-text">
                      {contentPromptText}
                    </pre>
                  </div>

                  <div className="p-3 bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] flex items-center justify-between">
                    <div>
                      <span className="font-bold uppercase tracking-wider text-xs">
                        Next Step:
                      </span>{" "}
                      Once your AI generates the JSON, switch to the{" "}
                      <span className="underline font-bold">
                        &quot;Paste JSON &amp; Autofill Form&quot;
                      </span>{" "}
                      tab to populate all fields in 1 click!
                    </div>
                    <button
                      type="button"
                      onClick={() => setAiModalTab("import")}
                      className="px-3 py-1 bg-[#047857] hover:bg-[#065F46] text-white text-[11px] font-bold uppercase tracking-wider shrink-0 cursor-pointer"
                    >
                      Go to Autofill Tab →
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: IMAGE GENERATION PROMPTS */}
              {aiModalTab === "image" && (
                <div className="space-y-5">
                  {/* Option A: Text to image */}
                  <div className="space-y-2 border border-[#E5E7EB] p-4 bg-[#FAFAFA]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#E5E7EB]">
                      <div>
                        <span className="inline-block px-1.5 py-0.5 bg-black text-white text-[9px] font-bold uppercase tracking-wider mb-1">
                          PROMPT A • TEXT TO IMAGE
                        </span>
                        <h4 className="font-black uppercase tracking-wider text-xs text-[#111111]">
                          Studio Catalog Footwear Photography (Midjourney / DALL-E / Flux / Imagen)
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyPrompt(studioImagePromptText, "image-studio")}
                        className="px-3 py-1.5 bg-[#111111] hover:bg-black text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                      >
                        {copiedPromptType === "image-studio" ? (
                          <>
                            <RiCheckLine className="text-sm text-green-400" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <RiFileCopyLine className="text-sm" />
                            <span>Copy Prompt</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="p-3 bg-white border border-[#D1D5DB] font-mono text-[11px] text-[#374151] select-text">
                      {studioImagePromptText}
                    </p>
                    <p className="text-[10px] text-[#6B7280]">
                      Best for Midjourney v6.1, Flux.1 Pro, DALL-E 3, and Stable Diffusion XL.
                    </p>
                  </div>

                  {/* Option B: Image to image */}
                  <div className="space-y-2 border border-[#E5E7EB] p-4 bg-[#FAFAFA]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#E5E7EB]">
                      <div>
                        <span className="inline-block px-1.5 py-0.5 bg-[#4F46E5] text-white text-[9px] font-bold uppercase tracking-wider mb-1">
                          PROMPT B • IMAGE-TO-IMAGE
                        </span>
                        <h4 className="font-black uppercase tracking-wider text-xs text-[#111111]">
                          Transform from Uploaded Phone/Sample Photo
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyPrompt(img2imgPromptText, "image-img2img")}
                        className="px-3 py-1.5 bg-[#111111] hover:bg-black text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                      >
                        {copiedPromptType === "image-img2img" ? (
                          <>
                            <RiCheckLine className="text-sm text-green-400" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <RiFileCopyLine className="text-sm" />
                            <span>Copy Prompt</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="p-3 bg-white border border-[#D1D5DB] font-mono text-[11px] text-[#374151] select-text">
                      {img2imgPromptText}
                    </p>
                    <p className="text-[10px] text-[#6B7280]">
                      Upload your real raw shoe photo in Midjourney or ChatGPT, then paste this prompt to convert it into a luxury studio catalog image.
                    </p>
                  </div>

                  {/* Workflow notice */}
                  <div className="p-3.5 bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] space-y-1">
                    <p className="font-bold uppercase tracking-wider text-xs">
                      ⚡ Workflow for Images:
                    </p>
                    <ol className="list-decimal pl-4 space-y-0.5 text-[11px]">
                      <li>Copy either Prompt A or Prompt B above.</li>
                      <li>Generate the shoe image in Midjourney, ChatGPT Plus, or Flux.</li>
                      <li>Save the generated image file to your device.</li>
                      <li>Close this modal and drag &amp; drop the file directly into the &quot;Product Photos &amp; Visual Gallery&quot; box on this page to upload directly to Cloudinary!</li>
                    </ol>
                  </div>
                </div>
              )}

              {/* TAB 3: PASTE JSON & AUTOFILL */}
              {aiModalTab === "import" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-[#111111] uppercase tracking-wider text-xs">
                        Paste AI JSON Response
                      </p>
                      <p className="text-[11px] text-[#6B7280]">
                        Paste raw JSON or markdown-wrapped JSON generated by ChatGPT, Claude, or Gemini.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPastedJson(`{
  "name": "${aiShoeName || name || "NK Ultraboost Pulse 26"}",
  "subtitle": "Men's Performance Road Running Shoes",
  "tagline": "Dynamic energy return with full-length responsive cushioning foam.",
  "category": "${aiCategory || categorySlug || "running"}",
  "categorySlug": "${aiCategory || categorySlug || "running"}",
  "categories": ["${aiCategory || categorySlug || "running"}", "sneakers"],
  "gender": "men",
  "price": ${Number(aiPrice) || 8999},
  "originalPrice": ${Math.round((Number(aiPrice) || 8999) * 1.3)},
  "sku": "NK-PULSE-2026",
  "description": "<p>Engineered for maximum endurance and lightweight agility, the NK Ultraboost Pulse features a breathable mono-mesh upper combined with a high-rebound midsole.</p><h3>Key Highlights</h3><ul><li>Energy-return responsive midsole</li><li>Continental traction rubber outsole</li><li>Seamless engineered mesh upper</li></ul>",
  "features": [
    "Full-length responsive foam midsole with 20% higher energy return",
    "Engineered breathable mesh upper with midfoot stability cage",
    "High-abrasion Continental rubber outsole with multi-directional lugs"
  ],
  "colors": [
    { "name": "Core Black / Cloud White", "hex": "#111111" },
    { "name": "Solar Red / Volt", "hex": "#E53E3E" }
  ],
  "sizes": [
    { "size": "UK 6", "stock": 8, "available": true },
    { "size": "UK 7", "stock": 14, "available": true },
    { "size": "UK 8", "stock": 20, "available": true },
    { "size": "UK 9", "stock": 18, "available": true },
    { "size": "UK 10", "stock": 10, "available": true },
    { "size": "UK 11", "stock": 6, "available": true }
  ],
  "isFeatured": true
}`);
                        toast.success("Loaded sample footwear JSON");
                      }}
                      className="text-[11px] font-bold uppercase tracking-wider text-[#4B5563] hover:text-black underline cursor-pointer"
                    >
                      Load Sample Demo JSON
                    </button>
                  </div>

                  <textarea
                    rows={12}
                    value={pastedJson}
                    onChange={(e) => setPastedJson(e.target.value)}
                    placeholder='Paste AI JSON here, e.g.&#10;{&#10;  "name": "...",&#10;  "price": 8999,&#10;  "features": [...]&#10;}'
                    className="w-full bg-[#FAFAFA] border-2 border-[#D1D5DB] focus:border-black p-3 font-mono text-[11px] text-[#111111] outline-none rounded-none"
                  />

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setPastedJson("")}
                      className="px-4 py-2 border border-[#D1D5DB] text-xs font-bold uppercase tracking-wider text-[#4B5563] hover:text-black transition-colors rounded-none cursor-pointer"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={handleAutofillFromJson}
                      className="px-6 py-2.5 bg-black hover:bg-[#222] text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-colors rounded-none cursor-pointer shadow-md"
                    >
                      <RiMagicLine className="text-base text-yellow-300" />
                      <span>Autofill Product Form Now</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-[#F9FAFB] border-t border-[#E5E7EB] px-5 py-3 flex items-center justify-between shrink-0">
              <span className="text-[10px] text-[#6B7280] font-mono">
                NK-SHOES Catalog Engine • Automated SEO & Specs
              </span>
              <button
                type="button"
                onClick={() => setIsAiModalOpen(false)}
                className="px-4 py-1.5 border border-[#D1D5DB] text-xs font-bold uppercase tracking-wider text-[#374151] hover:text-black hover:border-black bg-white transition-colors cursor-pointer rounded-none"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

export default ProductForm;
