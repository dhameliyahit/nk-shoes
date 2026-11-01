"use client";

import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, FreeMode } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import { getCategories } from "@/services/categoryService";
import {
  RiArrowRightLine,
  RiArrowLeftLine,
  RiTruckLine,
  RiShieldCheckLine,
  RiRefreshLine,
  RiBankCardLine,
} from "react-icons/ri";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";

export interface CategoryItem {
  id: string;
  tag: string;
  title: string;
  description: string;
  itemCount: string;
  startingPrice: string;
  badge?: string;
  image: string;
  href: string;
}

export interface BenefitItem {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
}

// Clean, Indian-friendly dynamic category collections
export const CATEGORY_COLLECTIONS: CategoryItem[] = [
  {
    id: "men",
    tag: "MEN",
    title: "Men's Footwear",
    description: "Daily wear sneakers, office shoes & casual trainers.",
    itemCount: "150+ Styles",
    startingPrice: "Starting ₹1,499",
    badge: "BESTSELLER",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=85",
    href: "/products?category=men",
  },
  {
    id: "women",
    tag: "WOMEN",
    title: "Women's Footwear",
    description: "Lightweight walking shoes, sneakers & stylish flats.",
    itemCount: "120+ Styles",
    startingPrice: "Starting ₹1,299",
    badge: "TRENDING",
    image: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&q=85",
    href: "/products?category=women",
  },
  {
    id: "sneakers",
    tag: "SNEAKERS",
    title: "Trending Sneakers",
    description: "Clean white kicks, streetwear & retro high-tops.",
    itemCount: "95+ Styles",
    startingPrice: "Starting ₹1,999",
    badge: "HOT DROP",
    image: "https://images.unsplash.com/photo-1552346154-21d32810aba3?w=800&q=85",
    href: "/products?category=sneakers",
  },
  {
    id: "sports-running",
    tag: "SPORTS",
    title: "Sports & Running",
    description: "Cushioned gym trainers, running & walking shoes.",
    itemCount: "80+ Styles",
    startingPrice: "Starting ₹1,699",
    badge: "PRO TECH",
    image: "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=800&q=85",
    href: "/products?category=sports",
  },
  {
    id: "casual-slides",
    tag: "CASUAL",
    title: "Daily Casuals & Slides",
    description: "Comfortable slip-ons, canvas shoes & slides.",
    itemCount: "60+ Styles",
    startingPrice: "Starting ₹899",
    badge: "BUDGET PICK",
    image: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800&q=85",
    href: "/products?category=casual",
  },
  {
    id: "party-premium",
    tag: "PREMIUM",
    title: "Classics & High-Top",
    description: "Premium finish shoes for parties, outings & events.",
    itemCount: "45+ Styles",
    startingPrice: "Starting ₹2,499",
    badge: "NEW ARRIVAL",
    image: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&q=85",
    href: "/products?category=premium",
  },
];

// Indian E-Commerce Trust Benefits
export const SHOPPING_BENEFITS: BenefitItem[] = [
  {
    id: "b1",
    title: "Fast Delivery",
    description: "Quick shipping across all major pin codes in India.",
    icon: RiTruckLine,
  },
  {
    id: "b2",
    title: "100% Original",
    description: "Genuine quality shoes with verified brand guarantee.",
    icon: RiShieldCheckLine,
  },
  {
    id: "b3",
    title: "7-Day Easy Exchange",
    description: "Size not fitting? Simple and fast doorstep exchange.",
    icon: RiRefreshLine,
  },
  {
    id: "b4",
    title: "Cash on Delivery",
    description: "Pay when your shoes arrive, or use UPI & Cards securely.",
    icon: RiBankCardLine,
  },
];

interface CategoriesSectionProps {
  categories?: CategoryItem[];
  benefits?: BenefitItem[];
  className?: string;
}

export function CategoriesSection({
  categories = CATEGORY_COLLECTIONS,
  benefits = SHOPPING_BENEFITS,
  className,
}: CategoriesSectionProps) {
  const swiperRef = useRef<SwiperType | null>(null);
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);
  const [liveCategories, setLiveCategories] = useState<CategoryItem[]>(categories);

  useEffect(() => {
    let isMounted = true;
    async function loadBackendCategories() {
      try {
        const data = await getCategories({ featured: true });
        if (data && data.length > 0 && isMounted) {
          const mapped: CategoryItem[] = data.map((c) => ({
            id: c._id || c.slug,
            tag: c.tag || c.name.toUpperCase(),
            title: c.name,
            description: c.description || "Exclusive athletic footwear.",
            itemCount: c.itemCount || "50+ Styles",
            startingPrice: c.startingPrice || "Starting ₹1,499",
            badge: c.badge || "",
            image: c.image || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=85",
            href: `/products?category=${c.slug}`,
          }));
          setLiveCategories(mapped);
        }
      } catch (err) {
        // Fallback remains active
      }
    }
    loadBackendCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className={cn("py-6 md:py-10 bg-white font-sans", className)}>
      <Container>
        {/* SECTION HEADER (MATCHING MOCKUP STYLE) */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 mb-6">
          <div>
            <p className="text-[11px] font-bold tracking-[0.2em] text-[#777777] uppercase mb-1">
              EXPLORE NK SHOES
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#111111] tracking-tight font-sans uppercase">
              Shop by Category
            </h2>
            <p className="text-sm text-[#777777] mt-1.5 font-sans">
              Find the perfect pair for daily wear, gym workouts, or casual outings.
            </p>
          </div>

          {/* RIGHT ACTIONS: VIEW ALL LINK + CAROUSEL CONTROLS */}
          <div className="flex items-center gap-4 self-start sm:self-end">
            <Link
              href="/products"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#111111] pb-0.5 border-b border-[#111111] hover:opacity-75 transition-opacity"
            >
              <span>View All Collections</span>
              <span className="text-base leading-none">⟶</span>
            </Link>

            {/* Prev / Next Slider Arrows */}
            <div className="flex items-center gap-1.5 ml-2">
              <button
                type="button"
                onClick={() => swiperRef.current?.slidePrev()}
                disabled={isBeginning}
                aria-label="Previous categories"
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
                aria-label="Next categories"
                className={cn(
                  "w-8 h-8 rounded-full border border-[#dcdcdc] flex items-center justify-center text-[#222] transition-colors cursor-pointer",
                  "hover:bg-[#111] hover:text-white hover:border-[#111]",
                  "disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[#222] disabled:hover:border-[#dcdcdc]"
                )}
              >
                <RiArrowRightLine className="text-sm" />
              </button>
            </div>
          </div>
        </div>

        {/* SWIPER CATEGORY CARDS */}
        <div className="overflow-hidden w-full max-w-full">
          <Swiper
            modules={[Navigation, FreeMode]}
            onBeforeInit={(swiper) => {
              swiperRef.current = swiper;
            }}
            onSlideChange={(swiper) => {
              setIsBeginning(swiper.isBeginning);
              setIsEnd(swiper.isEnd);
            }}
            spaceBetween={20}
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
                spaceBetween: 18,
              },
              768: {
                slidesPerView: 3.1,
                spaceBetween: 20,
              },
              1024: {
                slidesPerView: 4,
                spaceBetween: 24,
              },
            }}
            className="w-full"
          >
            {liveCategories.map((item) => (
              <SwiperSlide key={item.id} className="h-auto">
                <div className="group flex flex-col w-full bg-white select-none text-left">
                  {/* FILLED SQUARE IMAGE TILE (#EAEAEA) */}
                  <div className="relative aspect-square w-full bg-[#EAEAEA] overflow-hidden">
                    <Link
                      href={item.href}
                      className="block w-full h-full relative cursor-pointer"
                      aria-label={item.title}
                    >
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                      />
                    </Link>

                    {/* TOP-LEFT SOLID BLACK BADGE */}
                    {item.badge && (
                      <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none">
                        <span className="bg-[#111111] text-white text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded-none shadow-xs">
                          {item.badge}
                        </span>
                      </div>
                    )}

                    {/* STARTING PRICE PILL (BOTTOM RIGHT) */}
                    <div className="absolute bottom-2.5 right-2.5 z-10 pointer-events-none">
                      <span className="bg-white/95 backdrop-blur-xs text-[#111111] text-[10px] font-bold px-2 py-0.5 shadow-2xs">
                        {item.startingPrice}
                      </span>
                    </div>
                  </div>

                  {/* CATEGORY DETAILS */}
                  <div className="flex flex-col flex-1 pt-2.5 pb-1">
                    {/* TAG & ITEM COUNT */}
                    <div className="flex items-center justify-between text-[10px] font-bold tracking-[0.14em] text-[#777777] uppercase">
                      <span>{item.tag}</span>
                      <span className="text-[#999999] font-normal">{item.itemCount}</span>
                    </div>

                    {/* TITLE */}
                    <h3 className="text-[15px] font-bold text-[#111111] leading-tight mt-0.5 line-clamp-1">
                      <Link href={item.href} className="hover:opacity-75 transition-opacity">
                        {item.title}
                      </Link>
                    </h3>

                    {/* SHORT DESCRIPTION */}
                    <p className="text-[12px] text-[#777777] font-normal leading-tight mt-0.5 line-clamp-1">
                      {item.description}
                    </p>

                    {/* ACTION LINK */}
                    <div className="mt-2.5 pt-2 border-t border-[#f2f2f2] flex items-center justify-between">
                      <Link
                        href={item.href}
                        className="inline-flex items-center gap-1 text-[12px] font-bold text-[#111111] pb-0.5 border-b border-[#111111] hover:opacity-70 transition-opacity"
                      >
                        <span>Shop Collection</span>
                        <span className="text-sm">⟶</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* COMPACT INDIAN E-COMMERCE SHOPPING BENEFITS STRIP */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-8 pt-6 border-t border-[#f0f0f0]">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <div
                key={benefit.id}
                className="flex items-start gap-3 p-3 sm:p-3.5 rounded-none bg-[#f9f9f9] border border-[#f0f0f0]"
              >
                <div className="w-8 h-8 rounded-full bg-white border border-[#eaeaea] flex items-center justify-center text-[#111] shrink-0 shadow-2xs">
                  <Icon className="text-base" />
                </div>
                <div>
                  <h4 className="font-sans text-xs sm:text-sm font-bold text-[#111111]">
                    {benefit.title}
                  </h4>
                  <p className="font-sans text-[11px] text-[#666666] leading-snug mt-0.5">
                    {benefit.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
