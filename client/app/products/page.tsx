"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  RiFilter3Line,
  RiCloseLine,
  RiArrowDownSLine,
  RiCheckLine,
  RiRefreshLine,
} from "react-icons/ri";
import { Container } from "@/components/ui/container";
import { ProductCard } from "@/components/product/product-card";
import { ProductQuickView } from "@/components/product/product-quick-view";
import { Loader } from "@/components/common/loader";
import { getCategories } from "@/services/categoryService";
import { getProducts } from "@/services/productService";
import { Product } from "@/types/product";
import { cn } from "@/lib/utils";

const SIZES = ["UK 5", "UK 6", "UK 7", "UK 8", "UK 9", "UK 10", "UK 11"];
const CATEGORIES = [
  { id: "all", label: "All Categories" },
  { id: "running", label: "Running" },
  { id: "sneakers", label: "Sneakers & Street" },
  { id: "sports", label: "Training & Gym" },
];

function ProductsCatalogContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "all";
  const initialGender = searchParams.get("gender") || "all";

  // Filter States
  const [selectedGender, setSelectedGender] = useState<string>(initialGender);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>("featured");
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [categoriesList, setCategoriesList] = useState<{ id: string; label: string }[]>(CATEGORIES);
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Synchronize filter state whenever URL searchParams change
  useEffect(() => {
    const cat = searchParams.get("category");
    setSelectedCategory(cat || "all");
    const gen = searchParams.get("gender");
    setSelectedGender(gen || "all");
  }, [searchParams]);

  useEffect(() => {
    let isMounted = true;
    async function loadBackendCategories() {
      try {
        const data = await getCategories();
        if (data && data.length > 0 && isMounted) {
          const mapped = [
            { id: "all", label: "All Categories" },
            ...data.map((c) => ({
              id: c.slug,
              label: c.name,
            })),
          ];
          setCategoriesList(mapped);
        }
      } catch {
        // Continue with initial categories
      }
    }
    loadBackendCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function loadBackendProducts() {
      setLoading(true);
      try {
        const res = await getProducts({ limit: 100 });
        if (isMounted) {
          setProductsList(res?.products || []);
        }
      } catch (e) {
        if (isMounted) {
          setProductsList([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    loadBackendProducts();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    let result = [...productsList];

    // Filter by Gender
    if (selectedGender !== "all") {
      result = result.filter(
        (p) => p.gender.toLowerCase() === selectedGender.toLowerCase()
      );
    }

    // Filter by Category (matches primary or any associated category in array)
    if (selectedCategory !== "all") {
      const target = selectedCategory.toLowerCase();
      result = result.filter((p) => {
        const cat = String(p.categorySlug || p.category || "").toLowerCase();
        const hasInArray = Array.isArray(p.categorySlugs) && p.categorySlugs.some((s) => String(s).toLowerCase() === target);
        return cat === target || hasInArray;
      });
    }

    // Filter by Size
    if (selectedSize) {
      result = result.filter((p) =>
        p.sizes.some((s) => s.size === selectedSize && s.available)
      );
    }

    // Sorting
    if (sortBy === "price-low-high") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-high-low") {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === "rating") {
      result.sort((a, b) => b.rating - a.rating);
    }

    return result;
  }, [productsList, selectedGender, selectedCategory, selectedSize, sortBy]);

  const activeFilterCount =
    (selectedCategory !== "all" ? 1 : 0) +
    (selectedSize ? 1 : 0);

  const handleResetFilters = () => {
    setSelectedCategory("all");
    setSelectedSize(null);
    setSortBy("featured");
  };

  return (
    <main className="w-full min-h-screen bg-white text-[#111111] font-sans select-none pb-24">
      {/* 1. TOP BREADCRUMB & PAGE HEADER */}
      <div className="border-b border-[#ECEFF1] bg-[#FAFAFA] py-8">
        <Container>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#767677] mb-2 font-bold">
            <Link href="/" className="hover:text-black">
              Home
            </Link>
            <span>/</span>
            <span className="text-black">All Footwear</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#767677] block mb-1">
                Performance & Lifestyle Collection
              </span>
              <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-[#000000]">
                All Footwear
              </h1>
            </div>

            <div className="text-xs uppercase font-bold tracking-wider text-[#767677]">
              Showing <strong className="text-black">{filteredProducts.length}</strong> Styles
            </div>
          </div>
        </Container>
      </div>

      <Container className="pt-8">
        {/* 2. TOP TOOLBAR: MOBILE FILTER TRIGGER & DESKTOP SORT */}
        <div className="flex items-center justify-between gap-4 pb-6 border-b border-[#ECEFF1] mb-8">
          {/* Mobile Filter Toggle */}
          <button
            type="button"
            onClick={() => setIsMobileFiltersOpen(true)}
            className="lg:hidden flex items-center gap-2 px-4 py-2.5 border border-black text-xs font-black uppercase tracking-wider hover:bg-black hover:text-white transition-colors"
          >
            <RiFilter3Line className="text-base" />
            <span>Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ""}</span>
          </button>

          {/* Active Filter Chips (Desktop) */}
          <div className="hidden lg:flex items-center gap-2 flex-wrap">
            {selectedGender !== "all" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F5F5F5] border border-[#E0E0E0] text-xs font-bold uppercase tracking-wider">
                Gender: {selectedGender}
                <button
                  onClick={() => setSelectedGender("all")}
                  className="hover:text-[#C83224] transition-colors"
                >
                  <RiCloseLine className="text-sm" />
                </button>
              </span>
            )}
            {selectedCategory !== "all" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F5F5F5] border border-[#E0E0E0] text-xs font-bold uppercase tracking-wider">
                Category: {selectedCategory}
                <button
                  onClick={() => setSelectedCategory("all")}
                  className="hover:text-[#C83224] transition-colors"
                >
                  <RiCloseLine className="text-sm" />
                </button>
              </span>
            )}
            {selectedSize && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F5F5F5] border border-[#E0E0E0] text-xs font-bold uppercase tracking-wider">
                Size: {selectedSize}
                <button
                  onClick={() => setSelectedSize(null)}
                  className="hover:text-[#C83224] transition-colors"
                >
                  <RiCloseLine className="text-sm" />
                </button>
              </span>
            )}
            {activeFilterCount > 0 && (
              <button
                onClick={handleResetFilters}
                className="text-xs font-bold uppercase tracking-wider text-[#767677] hover:text-black underline ml-2 flex items-center gap-1"
              >
                <RiRefreshLine /> Reset All
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 ml-auto">
            <label className="text-xs font-bold uppercase tracking-wider text-[#767677] hidden sm:block">
              Sort By:
            </label>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-10 px-3 pr-8 border border-[#D5D5D5] bg-white text-xs font-bold uppercase tracking-wider text-black outline-none rounded-none cursor-pointer appearance-none"
              >
                <option value="featured">Featured Drops</option>
                <option value="price-low-high">Price: Low to High</option>
                <option value="price-high-low">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
              <RiArrowDownSLine className="absolute right-2.5 top-1/2 -translate-y-1/2 text-base text-black pointer-events-none" />
            </div>
          </div>
        </div>

        {/* 3. MAIN CATALOG GRID & SIDEBAR */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* DESKTOP FILTER SIDEBAR */}
          <aside className="hidden lg:block lg:col-span-3 sticky top-28 space-y-8 pr-4">
            {/* Category Section */}
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-black mb-3">
                Category
              </h3>
              <div className="flex flex-col gap-1.5 text-xs">
                {categoriesList.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCategory(c.id)}
                    className={cn(
                      "flex items-center justify-between py-1.5 text-left font-bold transition-colors cursor-pointer",
                      selectedCategory === c.id
                        ? "text-black font-black"
                        : "text-[#767677] hover:text-black"
                    )}
                  >
                    <span>{c.label}</span>
                    {selectedCategory === c.id && <RiCheckLine className="text-base" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Size Section (Adidas YARN Sharp Grid) */}
            <div className="pt-6 border-t border-[#ECEFF1]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-black">
                  Shoe Size (UK)
                </h3>
                {selectedSize && (
                  <button
                    onClick={() => setSelectedSize(null)}
                    className="text-[11px] text-[#767677] hover:text-black underline font-semibold"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {SIZES.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() =>
                      setSelectedSize(selectedSize === size ? null : size)
                    }
                    className={cn(
                      "h-10 border text-xs font-bold transition-all flex items-center justify-center cursor-pointer rounded-none",
                      selectedSize === size
                        ? "border-black bg-black text-white"
                        : "border-[#D5D5D5] bg-white text-black hover:border-black"
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* PRODUCT CARDS GRID */}
          <div className="lg:col-span-9">
            {loading ? (
              <div className="py-28 flex flex-col items-center justify-center">
                <Loader size={14} text="Loading Dynamic Footwear Collection..." />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-20 text-center border border-[#ECEFF1] bg-[#FAFAFA] p-8">
                <h3 className="text-lg font-black uppercase tracking-wider text-black mb-2">
                  No Footwear Found
                </h3>
                <p className="text-xs text-[#767677] max-w-sm mx-auto mb-6">
                  No styles match your selected filter criteria. Try clearing some filters to explore other options.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="px-6 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-[#222] transition-colors"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onQuickView={(p) => setQuickViewProduct(p)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </Container>

      {/* 4. MOBILE SLIDE-OVER FILTER MODAL */}
      {isMobileFiltersOpen && (
        <div className="fixed inset-0 z-[100] flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setIsMobileFiltersOpen(false)}
          />
          <div className="relative ml-auto w-full max-w-xs bg-white h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#ECEFF1] mb-6">
                <h2 className="text-sm font-black uppercase tracking-wider text-black">
                  Filters
                </h2>
                <button
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="p-1 text-black hover:bg-[#F5F5F5]"
                >
                  <RiCloseLine className="text-xl" />
                </button>
              </div>

              {/* Category Filter */}
              <div className="mb-6">
                <h3 className="text-xs font-black uppercase tracking-wider text-black mb-2">
                  Category
                </h3>
                <div className="flex flex-col gap-1 text-xs">
                  {categoriesList.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCategory(c.id)}
                      className={cn(
                        "py-1.5 text-left font-bold",
                        selectedCategory === c.id ? "text-black" : "text-[#767677]"
                      )}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Size Filter */}
              <div className="mb-6 pt-4 border-t border-[#ECEFF1]">
                <h3 className="text-xs font-black uppercase tracking-wider text-black mb-2">
                  Size (UK)
                </h3>
                <div className="grid grid-cols-3 gap-1.5">
                  {SIZES.map((size) => (
                    <button
                      key={size}
                      onClick={() =>
                        setSelectedSize(selectedSize === size ? null : size)
                      }
                      className={cn(
                        "h-9 border text-xs font-bold flex items-center justify-center",
                        selectedSize === size
                          ? "border-black bg-black text-white"
                          : "border-[#D5D5D5] bg-white text-black"
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#ECEFF1] flex gap-3">
              <button
                onClick={handleResetFilters}
                className="flex-1 py-3 border border-black text-xs font-bold uppercase tracking-wider text-black hover:bg-[#F5F5F5]"
              >
                Reset
              </button>
              <button
                onClick={() => setIsMobileFiltersOpen(false)}
                className="flex-1 py-3 bg-black text-white text-xs font-bold uppercase tracking-wider"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK VIEW MODAL */}
      {quickViewProduct && (
        <ProductQuickView
          product={quickViewProduct}
          isOpen={Boolean(quickViewProduct)}
          onClose={() => setQuickViewProduct(null)}
        />
      )}
    </main>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<Loader text="Loading Footwear Catalog..." className="py-28" />}>
      <ProductsCatalogContent />
    </Suspense>
  );
}
