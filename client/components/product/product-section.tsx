"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, FreeMode } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import {
  RiArrowRightLine,
  RiArrowLeftLine,
  RiLayoutGridLine,
  RiArrowLeftRightLine,
} from "react-icons/ri";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product/product-card";
import { ProductQuickView } from "@/components/product/product-quick-view";
import { Product } from "@/types/product";
import { cn } from "@/lib/utils";

export interface ProductSectionProps {
  title: string;
  subtitle?: string;
  badge?: string;
  products: Product[];
  defaultLayout?: "slider" | "grid";
  allowLayoutToggle?: boolean;
  viewAllHref?: string;
  viewAllText?: string;
  className?: string;
}

export function ProductSection({
  title,
  subtitle,
  badge,
  products,
  defaultLayout = "slider",
  allowLayoutToggle = true,
  viewAllHref = "/products",
  viewAllText = "View All",
  className,
}: ProductSectionProps) {
  const [layout, setLayout] = useState<"slider" | "grid">(defaultLayout);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  const swiperRef = useRef<SwiperType | null>(null);
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);

  const handleOpenQuickView = (product: Product) => {
    setQuickViewProduct(product);
    setIsQuickViewOpen(true);
  };

  const handleCloseQuickView = () => {
    setIsQuickViewOpen(false);
    setQuickViewProduct(null);
  };

  return (
    <section className={cn("py-8 md:py-12 bg-white font-sans", className)}>
      <Container>
        {/* SECTION HEADER (EXACT MOCKUP STYLE) */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 mb-8">
          <div>
            {badge && (
              <p className="text-[11px] font-bold tracking-[0.2em] text-[#777777] uppercase mb-1">
                {badge}
              </p>
            )}
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#111111] tracking-tight font-sans uppercase">
              {title}
            </h2>
            {subtitle && (
              <p className="text-sm text-[#777777] mt-1.5 font-sans">
                {subtitle}
              </p>
            )}
          </div>

          {/* ACTIONS: LAYOUT TOGGLE + VIEW ALL LINK */}
          <div className="flex items-center gap-4 self-start sm:self-end">
            {/* View Mode Toggle */}
            {allowLayoutToggle && (
              <div className="hidden sm:flex items-center border border-[#e0e0e0] rounded-md p-0.5 bg-[#f8f8f8]">
                <button
                  type="button"
                  onClick={() => setLayout("grid")}
                  title="Grid View"
                  className={cn(
                    "p-1.5 rounded text-xs transition-colors cursor-pointer",
                    layout === "grid"
                      ? "bg-white text-black shadow-xs font-bold"
                      : "text-[#777] hover:text-black"
                  )}
                >
                  <RiLayoutGridLine className="text-sm" />
                </button>
                <button
                  type="button"
                  onClick={() => setLayout("slider")}
                  title="Carousel View"
                  className={cn(
                    "p-1.5 rounded text-xs transition-colors cursor-pointer",
                    layout === "slider"
                      ? "bg-white text-black shadow-xs font-bold"
                      : "text-[#777] hover:text-black"
                  )}
                >
                  <RiArrowLeftRightLine className="text-sm" />
                </button>
              </div>
            )}

            {/* View All Shoes Link (Matches Mockup) */}
            {viewAllHref && (
              <Link
                href={viewAllHref}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#111111] pb-0.5 border-b border-[#111111] hover:opacity-75 transition-opacity"
              >
                <span>{viewAllText}</span>
                <span className="text-base leading-none">⟶</span>
              </Link>
            )}

            {/* Prev / Next Arrows (Carousel Mode) */}
            {layout === "slider" && (
              <div className="flex items-center gap-1.5 ml-2">
                <button
                  type="button"
                  onClick={() => swiperRef.current?.slidePrev()}
                  disabled={isBeginning}
                  aria-label="Previous products"
                  className={cn(
                    "w-8 h-8 rounded-full border border-[#dcdcdc] flex items-center justify-center text-[#222] transition-colors cursor-pointer",
                    "hover:bg-[#111] hover:text-white hover:border-[#111]",
                    "disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[#222] disabled:hover:border-[#dcdcdc]"
                  )}
                >
                  <RiArrowLeftLine className="text-sm" />
                </button>
                <button
                  type="button"
                  onClick={() => swiperRef.current?.slideNext()}
                  disabled={isEnd}
                  aria-label="Next products"
                  className={cn(
                    "w-8 h-8 rounded-full border border-[#dcdcdc] flex items-center justify-center text-[#222] transition-colors cursor-pointer",
                    "hover:bg-[#111] hover:text-white hover:border-[#111]",
                    "disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[#222] disabled:hover:border-[#dcdcdc]"
                  )}
                >
                  <RiArrowRightLine className="text-sm" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* PRODUCTS DISPLAY: SLIDER OR GRID */}
        {layout === "slider" ? (
          <div className="relative overflow-hidden w-full max-w-full">
            <Swiper
              modules={[Navigation, FreeMode]}
              onBeforeInit={(swiper) => {
                swiperRef.current = swiper;
              }}
              onSlideChange={(swiper) => {
                setIsBeginning(swiper.isBeginning);
                setIsEnd(swiper.isEnd);
              }}
              spaceBetween={16}
              slidesPerView={1.25}
              grabCursor={true}
              freeMode={{
                enabled: true,
                sticky: false,
                momentumRatio: 0.8,
              }}
              breakpoints={{
                480: {
                  slidesPerView: 2.1,
                  spaceBetween: 16,
                },
                768: {
                  slidesPerView: 3.1,
                  spaceBetween: 18,
                },
                1024: {
                  slidesPerView: 4,
                  spaceBetween: 20,
                },
              }}
              className="w-full py-1"
            >
              {products.map((product) => (
                <SwiperSlide key={product.id} className="h-auto">
                  <ProductCard
                    product={product}
                    onQuickView={handleOpenQuickView}
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onQuickView={handleOpenQuickView}
              />
            ))}
          </div>
        )}

        {/* QUICK VIEW MODAL */}
        <ProductQuickView
          product={quickViewProduct}
          isOpen={isQuickViewOpen}
          onClose={handleCloseQuickView}
        />
      </Container>
    </section>
  );
}
