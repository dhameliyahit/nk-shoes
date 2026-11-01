"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import {
  RiShieldCheckLine,
  RiTruckLine,
  RiFootprintLine,
  RiArrowLeftLine,
  RiArrowRightLine,
} from "react-icons/ri";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface HeroSlide {
  id: string;
  tag: string;
  titleLine1: string;
  titleLine2: string;
  subtitle: string;
  ctaText: string;
  ctaHref: string;
  imageSrc: string;
  imageAlt: string;
  topRightNoteTitle: string;
  topRightNoteSubtitle: string;
}

const HERO_SLIDES: HeroSlide[] = [
  {
    id: "slide-1",
    tag: "NEW ARRIVALS",
    titleLine1: "FIND YOUR",
    titleLine2: "NEXT FAVORITE.",
    subtitle:
      "Explore trending sneakers and daily footwear made for comfort, style, and everyday movement.",
    ctaText: "SHOP NOW",
    ctaHref: "/products",
    imageSrc: "/hero-section/hero-slide-01.webp",
    imageAlt: "NK-SHOES Premium Footwear Collection on Architectural Pedestals",
    topRightNoteTitle: "NK-SHOES",
    topRightNoteSubtitle: "COMFORT FOR EVERY STEP",
  },
  {
    id: "slide-2",
    tag: "POPULAR SNEAKERS",
    titleLine1: "MADE FOR",
    titleLine2: "EVERYDAY COMFORT.",
    subtitle:
      "Lightweight, stylish shoes designed for walking, sports, and casual everyday wear.",
    ctaText: "EXPLORE COLLECTION",
    ctaHref: "/products?filter=trending",
    imageSrc: "/hero-section/hero-slide-02.webp",
    imageAlt: "NK-SHOES Modern Athletic Shoes Showcase",
    topRightNoteTitle: "PREMIUM QUALITY",
    topRightNoteSubtitle: "ORIGINAL & DURABLE",
  },
];

const TRUST_BADGES = [
  {
    icon: RiShieldCheckLine,
    title: "100% ORIGINAL",
    desc: "Guaranteed genuine brand footwear",
  },
  {
    icon: RiTruckLine,
    title: "FAST DELIVERY",
    desc: "Dispatched with live tracking",
  },
  {
    icon: RiFootprintLine,
    title: "ALL-DAY COMFORT",
    desc: "Soft cushioned soles for walking",
  },
];

export function HeroSection() {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  const totalSlides = HERO_SLIDES.length;
  const currentSlide = HERO_SLIDES[currentSlideIndex];

  // Navigation handlers
  const goToSlide = useCallback(
    (index: number) => {
      if (isAnimating) return;
      setIsAnimating(true);
      setCurrentSlideIndex((index + totalSlides) % totalSlides);
      setTimeout(() => setIsAnimating(false), 450);
    },
    [isAnimating, totalSlides]
  );

  const nextSlide = useCallback(() => {
    goToSlide(currentSlideIndex + 1);
  }, [currentSlideIndex, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide(currentSlideIndex - 1);
  }, [currentSlideIndex, goToSlide]);

  // Autoplay timer with pause on hover
  const startAutoplay = useCallback(() => {
    stopAutoplay();
    autoPlayRef.current = setInterval(() => {
      nextSlide();
    }, 6000);
  }, [nextSlide]);

  const stopAutoplay = () => {
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
      autoPlayRef.current = null;
    }
  };

  useEffect(() => {
    startAutoplay();
    return () => stopAutoplay();
  }, [startAutoplay]);

  // Touch swipe support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > 45) {
      if (diff > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
    setTouchStartX(null);
  };

  return (
    <section
      className="relative w-full overflow-hidden bg-[#ECE8E1] select-none"
      onMouseEnter={stopAutoplay}
      onMouseLeave={startAutoplay}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-label="Featured Footwear Drop"
    >
      {/* =========================================================
          VIEWPORT-FITTED HERO CONTAINER
          Fits in 100vh alongside Announcement Bar & Header without scroll
          ========================================================= */}
      <div className="relative w-full h-[calc(100dvh-156px)] min-h-[520px] max-h-[720px] flex flex-col justify-between">
        {/* Full HD Background Carousel Images */}
        {HERO_SLIDES.map((slide, idx) => {
          const isActive = idx === currentSlideIndex;
          return (
            <div
              key={slide.id}
              className={cn(
                "absolute inset-0 transition-opacity duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
                isActive ? "opacity-100 z-10 pointer-events-auto" : "opacity-0 z-0 pointer-events-none"
              )}
              aria-hidden={!isActive}
            >
              <div className="absolute inset-0 w-full h-full">
                {/* Image pinned to the right so ALL sneakers display in full */}
                <Image
                  src={slide.imageSrc}
                  alt={slide.imageAlt}
                  fill
                  priority={idx === 0}
                  quality={100}
                  sizes="100vw"
                  className="object-cover object-right select-none"
                />

                {/* Left side soft gradient mask to ensure pristine readability of live text */}
                <div
                  className="absolute inset-0 bg-gradient-to-r from-[#ECE8E1] via-[#ECE8E1]/85 to-transparent w-[55%] sm:w-[48%] pointer-events-none"
                  aria-hidden="true"
                />

                {/* Mobile bottom gradient */}
                <div
                  className="absolute inset-0 bg-gradient-to-t from-[#ECE8E1]/90 via-transparent to-transparent sm:hidden pointer-events-none"
                  aria-hidden="true"
                />
              </div>
            </div>
          );
        })}

        {/* =========================================================
            HERO FOREGROUND CONTENT LAYER
            Organized to fit seamlessly inside initial viewport
            ========================================================= */}
        <div className="relative z-20 h-full max-w-[1500px] w-full mx-auto px-4 sm:px-6 lg:px-12 flex flex-col justify-between py-5 sm:py-7 lg:py-8 pointer-events-none">
          {/* TOP ROW: Simple Tag Left | Philosophy Note Right */}
          <div className="flex justify-between items-start">
            {/* Tag */}
            <div className="pointer-events-auto inline-flex items-center gap-2.5">
              <span className="w-5 h-[2px] bg-[#080808]" aria-hidden="true" />
              <span className="text-[11px] sm:text-[12px] font-bold tracking-[0.14em] uppercase text-[#080808]">
                {currentSlide.tag}
              </span>
            </div>

            {/* Desktop Brand Statement (White text for high contrast on dark studio wall) */}
            <div className="hidden lg:flex flex-col items-end text-right bg-black/25 backdrop-blur-[2px] px-3 py-1.5 border border-white/15">
              <span className="text-[11px] font-black uppercase tracking-[0.14em] text-white drop-shadow-sm">
                {currentSlide.topRightNoteTitle}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.09em] text-white/80 mt-0.5">
                {currentSlide.topRightNoteSubtitle}
              </span>
              <span className="w-8 h-[1.5px] bg-white mt-1.5" aria-hidden="true" />
            </div>
          </div>

          {/* MIDDLE: Bold Headline, Subtitle & Action Button */}
          <div className="max-w-[560px] lg:max-w-[620px] my-auto">
            <h1
              className="text-[40px] sm:text-[56px] md:text-[68px] lg:text-[76px] xl:text-[84px] font-black italic uppercase text-[#080808] leading-[0.9] tracking-[-0.03em]"
              style={{ fontFamily: '"Barlow Condensed", sans-serif' }}
            >
              <span>{currentSlide.titleLine1}</span>
              <br />
              <span className="text-[#080808]">{currentSlide.titleLine2}</span>
            </h1>

            <p className="mt-3 sm:mt-4 text-[13.5px] sm:text-[15px] lg:text-[16px] font-medium text-[#444444] max-w-[420px] leading-relaxed">
              {currentSlide.subtitle}
            </p>

            {/* Shop Button */}
            <div className="mt-5 sm:mt-6 pointer-events-auto inline-block">
              <Button
                variant="bag"
                size="default"
                arrow
                href={currentSlide.ctaHref}
                className="!text-[13.5px] sm:!text-[14px] !tracking-[0.06em]"
              >
                {currentSlide.ctaText}
              </Button>
            </div>
          </div>

          {/* BOTTOM ROW: Trust Features Left & Slider Navigation Right */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-2">
            {/* Trust Badges: 100% ORIGINAL | FAST DELIVERY | ALL-DAY COMFORT */}
            <div className="pointer-events-auto flex flex-wrap items-center gap-4 sm:gap-6 lg:gap-8">
              {TRUST_BADGES.map((badge, idx) => {
                const IconComponent = badge.icon;
                return (
                  <div key={badge.title} className="flex items-center gap-2">
                    <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/70 backdrop-blur-xs border border-[#080808]/10 flex items-center justify-center text-[#080808] flex-shrink-0">
                      <IconComponent className="text-[15px] sm:text-[16px]" />
                    </span>
                    <div>
                      <div className="text-[11px] sm:text-[11.5px] font-bold uppercase tracking-[0.04em] text-[#080808]">
                        {badge.title}
                      </div>
                    </div>
                    {idx < TRUST_BADGES.length - 1 && (
                      <span className="hidden sm:inline-block w-px h-3 bg-[#080808]/20 ml-2" aria-hidden="true" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Slider Counter & Navigation Controls */}
            <div className="pointer-events-auto flex items-center gap-3 self-end sm:self-auto">
              {/* Slide Counter (01 / 02) */}
              <div
                className="text-[14px] sm:text-[15px] font-black uppercase tracking-wider text-[#080808]"
                style={{ fontFamily: '"Barlow Condensed", sans-serif' }}
              >
                <span>{`0${currentSlideIndex + 1}`}</span>
                <span className="text-[#777777] mx-1">/</span>
                <span className="text-[#777777]">{`0${totalSlides}`}</span>
              </div>

              {/* Progress Line */}
              <div className="w-10 sm:w-14 h-[2px] bg-[#080808]/20 relative overflow-hidden">
                <div
                  className="absolute top-0 bottom-0 left-0 bg-[#080808] transition-all duration-300 ease-out"
                  style={{
                    width: `${((currentSlideIndex + 1) / totalSlides) * 100}%`,
                  }}
                />
              </div>

              {/* Navigation Arrows */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={prevSlide}
                  className="w-8 h-8 sm:w-8.5 sm:h-8.5 bg-white/80 hover:bg-[#080808] hover:text-white border border-[#080808]/20 transition-all flex items-center justify-center text-[#080808] active:scale-95 cursor-pointer rounded-none"
                  aria-label="Previous Slide"
                >
                  <RiArrowLeftLine className="text-[16px]" />
                </button>
                <button
                  type="button"
                  onClick={nextSlide}
                  className="w-8 h-8 sm:w-8.5 sm:h-8.5 bg-white/80 hover:bg-[#080808] hover:text-white border border-[#080808]/20 transition-all flex items-center justify-center text-[#080808] active:scale-95 cursor-pointer rounded-none"
                  aria-label="Next Slide"
                >
                  <RiArrowRightLine className="text-[16px]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
