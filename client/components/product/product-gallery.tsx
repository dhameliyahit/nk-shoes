"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import { Pagination, Navigation } from "swiper/modules";
import {
  RiZoomInLine,
  RiCloseLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiFullscreenLine,
  RiCameraLensLine,
} from "react-icons/ri";
import { ProductBadge } from "@/types/product";
import { cn } from "@/lib/utils";

interface ProductGalleryProps {
  images: string[];
  productName: string;
  badge?: ProductBadge;
  activeColorImage?: string;
  onActiveImageChange?: (image: string, index: number) => void;
}

const ANGLE_LABELS = [
  "Lateral Profile",
  "Quarter Angle",
  "Outsole & Traction",
  "Heel & Collar",
  "Top-Down Silhouette",
];

export function ProductGallery({
  images,
  productName,
  badge,
  activeColorImage,
  onActiveImageChange,
}: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZooming, setIsZooming] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null);

  const imageContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync when active color image changes from outside
  useEffect(() => {
    if (activeColorImage) {
      const idx = images.indexOf(activeColorImage);
      if (idx !== -1 && idx !== selectedIndex) {
        handleSelectImage(idx);
      }
    }
  }, [activeColorImage, images]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsLightboxOpen(false);
      } else if (e.key === "ArrowLeft") {
        setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
      } else if (e.key === "ArrowRight") {
        setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen, images.length]);

  const handleSelectImage = (index: number) => {
    if (index === selectedIndex) return;
    setIsChanging(true);
    setSelectedIndex(index);
    setIsZooming(false);

    if (swiperInstance && !swiperInstance.destroyed) {
      swiperInstance.slideTo(index);
    }
    if (onActiveImageChange && images[index]) {
      onActiveImageChange(images[index], index);
    }

    setTimeout(() => {
      setIsChanging(false);
    }, 200);
  };

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setZoomPos({ x, y });
  }, []);

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsZooming(false);
    const newIdx = selectedIndex === 0 ? images.length - 1 : selectedIndex - 1;
    handleSelectImage(newIdx);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsZooming(false);
    const newIdx = selectedIndex === images.length - 1 ? 0 : selectedIndex + 1;
    handleSelectImage(newIdx);
  };

  const currentImage = images[selectedIndex] || images[0];

  // Fullscreen Lightbox Portal Component
  const lightboxModal = isLightboxOpen && mounted ? (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[9999] bg-[#0E0E0E]/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-8 animate-fadeIn"
      onClick={() => setIsLightboxOpen(false)}
    >
      {/* HEADER BAR */}
      <div className="flex items-center justify-between text-white w-full z-20">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#999999]">
            NK-SHOES Studio Showcase
          </p>
          <h4 className="text-sm sm:text-base font-extrabold text-white uppercase tracking-tight">
            {productName}
          </h4>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs text-[#999999] font-mono">
            {selectedIndex + 1} / {images.length}
          </span>
          <button
            type="button"
            onClick={() => setIsLightboxOpen(false)}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Close Lightbox (Esc)"
          >
            <RiCloseLine className="text-2xl" />
          </button>
        </div>
      </div>

      {/* MAIN LIGHTBOX IMAGE */}
      <div
        className="relative flex-1 max-h-[75vh] w-full flex items-center justify-center my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-full h-full max-w-4xl max-h-[75vh] mx-auto flex items-center justify-center">
          <Image
            src={currentImage}
            alt={`${productName} studio high resolution photography`}
            fill
            sizes="(max-width: 1200px) 95vw, 1200px"
            className="object-contain p-4 drop-shadow-[0_25px_35px_rgba(0,0,0,0.5)] transition-opacity duration-300"
            priority
          />
        </div>

        {/* PREV / NEXT ARROWS */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/70 hover:bg-white hover:text-black text-white flex items-center justify-center transition-all cursor-pointer border border-white/20 shadow-lg"
              title="Previous (Left Arrow)"
            >
              <RiArrowLeftSLine className="text-3xl" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/70 hover:bg-white hover:text-black text-white flex items-center justify-center transition-all cursor-pointer border border-white/20 shadow-lg"
              title="Next (Right Arrow)"
            >
              <RiArrowRightSLine className="text-3xl" />
            </button>
          </>
        )}
      </div>

      {/* LIGHTBOX THUMBNAILS AT BOTTOM */}
      <div
        className="flex items-center justify-center gap-3 overflow-x-auto py-2 z-20"
        onClick={(e) => e.stopPropagation()}
      >
        {images.map((img, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSelectImage(idx)}
            className={cn(
              "relative w-14 h-14 bg-[#1E1E1E] border-2 transition-all cursor-pointer overflow-hidden",
              selectedIndex === idx
                ? "border-white scale-110 shadow-lg"
                : "border-transparent opacity-50 hover:opacity-100"
            )}
          >
            <Image src={img} alt="thumb" fill sizes="56px" className="object-contain p-1" />
          </button>
        ))}
      </div>
    </div>
  ) : null;

  return (
    <div className="w-full font-sans select-none">
      {/* =========================================================
          DESKTOP & TABLET: STUDIO SHOWROOM WITH SMOOTH CONTROLS
          ========================================================= */}
      <div className="hidden md:flex gap-4 items-start">
        {/* VERTICAL THUMBNAIL STRIP */}
        <div className="flex flex-col gap-2.5 w-20 shrink-0">
          {images.map((img, idx) => {
            const isSelected = selectedIndex === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectImage(idx)}
                onMouseEnter={() => handleSelectImage(idx)}
                className={cn(
                  "relative aspect-square w-full studio-showroom-canvas border-2 transition-all cursor-pointer overflow-hidden group",
                  isSelected
                    ? "border-[#111111] shadow-md ring-1 ring-[#111111]"
                    : "border-transparent opacity-70 hover:opacity-100 hover:border-[#CCCCCC]"
                )}
                aria-label={`View angle ${idx + 1}`}
              >
                <div className="relative w-full h-full p-1.5 flex items-center justify-center">
                  <Image
                    src={img}
                    alt={`${productName} thumbnail ${idx + 1}`}
                    fill
                    sizes="80px"
                    className="object-contain p-1 studio-shoe-enhancer group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* MAIN STUDIO SHOWROOM VIEWER */}
        <div className="flex-1 relative">
          <div
            ref={imageContainerRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsZooming(true)}
            onMouseLeave={() => setIsZooming(false)}
            onClick={() => setIsLightboxOpen(true)}
            className="relative aspect-square w-full studio-showroom-canvas overflow-hidden cursor-crosshair group shadow-sm rounded-none"
          >
            {/* STUDIO CONTACT SHADOW UNDER FOOTWEAR */}
            <div className="studio-contact-shadow" />

            {/* MAIN ENHANCED PRODUCT IMAGE WITH CROSSFADE */}
            <div className="relative w-full h-full p-6 sm:p-10 flex items-center justify-center z-2">
              <Image
                src={currentImage}
                alt={`${productName} studio showcase view`}
                fill
                priority
                sizes="(max-width: 1024px) 60vw, 45vw"
                className={cn(
                  "object-contain p-4 studio-shoe-enhancer transition-all duration-300 ease-out",
                  isChanging ? "opacity-30 scale-95" : "opacity-100 scale-100",
                  isZooming ? "opacity-0" : ""
                )}
              />
            </div>

            {/* INTERACTIVE HIGH-RES ZOOM LENS OVERLAY */}
            {isZooming && (
              <div
                className="absolute inset-0 pointer-events-none z-10 overflow-hidden"
                style={{
                  backgroundImage: `url(${currentImage})`,
                  backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                  backgroundSize: "230%",
                  backgroundRepeat: "no-repeat",
                  backgroundColor: "#F6F6F6",
                }}
              />
            )}

            {/* BADGE (TOP LEFT) */}
            {badge && (
              <div className="absolute top-4 left-4 z-20 pointer-events-none">
                <span className="bg-[#111111] text-white text-[10px] font-black tracking-widest uppercase px-2.5 py-1 shadow-sm">
                  {badge.text}
                </span>
              </div>
            )}

            {/* ACTIVE ANGLE PILL (TOP CENTER) */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1.5">
              <RiCameraLensLine className="text-xs" />
              <span>{ANGLE_LABELS[selectedIndex] || `Angle ${selectedIndex + 1}`}</span>
            </div>

            {/* EXPAND LIGHTBOX BUTTON (TOP RIGHT) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsLightboxOpen(true);
              }}
              onMouseEnter={() => setIsZooming(false)}
              title="Expand Studio High-Res View"
              className="absolute top-4 right-4 z-30 w-9 h-9 bg-white/90 hover:bg-white text-[#111111] backdrop-blur-xs flex items-center justify-center rounded-full shadow-sm transition-transform hover:scale-110 cursor-pointer pointer-events-auto"
            >
              <RiFullscreenLine className="text-base" />
            </button>

            {/* PREV / NEXT SHOWROOM ARROWS (SMOOTH & NEVER STUCK) */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  onMouseEnter={() => setIsZooming(false)}
                  title="Previous image"
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/95 hover:bg-white text-[#111] flex items-center justify-center opacity-80 group-hover:opacity-100 transition-all hover:scale-110 cursor-pointer z-30 shadow-md pointer-events-auto"
                >
                  <RiArrowLeftSLine className="text-2xl" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  onMouseEnter={() => setIsZooming(false)}
                  title="Next image"
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/95 hover:bg-white text-[#111] flex items-center justify-center opacity-80 group-hover:opacity-100 transition-all hover:scale-110 cursor-pointer z-30 shadow-md pointer-events-auto"
                >
                  <RiArrowRightSLine className="text-2xl" />
                </button>
              </>
            )}

            {/* ZOOM HINT BAR (BOTTOM RIGHT) */}
            <div className="absolute bottom-3 right-3 z-20 pointer-events-none bg-black/60 backdrop-blur-xs text-white text-[11px] font-medium px-2.5 py-1 rounded-full opacity-70 group-hover:opacity-100 transition-opacity flex items-center gap-1.5">
              <RiZoomInLine className="text-xs" />
              <span>Hover to Zoom • Click to Expand</span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          MOBILE & SMALL SCREEN: SWIPER STUDIO CAROUSEL
          ========================================================= */}
      <div className="md:hidden flex flex-col gap-3">
        <div className="relative aspect-square w-full studio-showroom-canvas overflow-hidden shadow-xs">
          {/* Mobile Contact Shadow */}
          <div className="studio-contact-shadow" />

          <Swiper
            modules={[Pagination, Navigation]}
            pagination={{ clickable: true }}
            spaceBetween={0}
            slidesPerView={1}
            onSwiper={setSwiperInstance}
            onSlideChange={(swiper) => handleSelectImage(swiper.activeIndex)}
            className="w-full h-full studio-gallery-swiper"
          >
            {images.map((image, index) => (
              <SwiperSlide key={index} className="relative w-full h-full flex items-center justify-center p-6">
                <Image
                  src={image}
                  alt={`${productName} view ${index + 1}`}
                  fill
                  priority={index === 0}
                  sizes="100vw"
                  className="object-contain p-4 studio-shoe-enhancer z-2"
                />
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Badge */}
          {badge && (
            <div className="absolute top-3 left-3 z-20 pointer-events-none">
              <span className="bg-[#111111] text-white text-[9px] font-black tracking-widest uppercase px-2 py-0.5 shadow-sm">
                {badge.text}
              </span>
            </div>
          )}

          {/* Slide Counter Badge */}
          <div className="absolute top-3 right-12 z-20 bg-black/50 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            {selectedIndex + 1} / {images.length}
          </div>

          {/* Expand Lightbox Button */}
          <button
            type="button"
            onClick={() => setIsLightboxOpen(true)}
            title="Expand Fullscreen"
            className="absolute top-3 right-3 z-20 w-7 h-7 bg-white/90 text-[#111111] rounded-full flex items-center justify-center shadow-xs cursor-pointer"
          >
            <RiFullscreenLine className="text-sm" />
          </button>
        </div>

        {/* Mobile Horizontal Thumbnail Scroller */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none px-1">
          {images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectImage(idx)}
              className={cn(
                "relative w-14 h-14 studio-showroom-canvas shrink-0 border-2 overflow-hidden transition-all cursor-pointer",
                selectedIndex === idx
                  ? "border-[#111111] ring-1 ring-black"
                  : "border-transparent opacity-65"
              )}
            >
              <Image
                src={img}
                alt="thumb"
                fill
                sizes="56px"
                className="object-contain p-1 studio-shoe-enhancer"
              />
            </button>
          ))}
        </div>
      </div>

      {/* FULLSCREEN LIGHTBOX PORTAL (DOCUMENT.BODY) */}
      {mounted && typeof document !== "undefined" && lightboxModal
        ? createPortal(lightboxModal, document.body)
        : null}
    </div>
  );
}
