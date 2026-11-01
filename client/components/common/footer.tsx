"use client";

import React, { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  RiFacebookFill,
  RiInstagramLine,
  RiYoutubeFill,
  RiTwitterXFill,
} from "react-icons/ri";

export function Footer() {
  const [email, setEmail] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    toast.success("Subscribed successfully! Use coupon for 5% off.");
    setEmail("");
  };

  return (
    <footer className="w-full bg-[#18191B] text-[#BBB9B5] font-sans pt-14 md:pt-16 pb-8 rounded-t-[32px] sm:rounded-t-[40px] md:rounded-t-[48px] border-t border-[#292828] shadow-[0_-12px_48px_rgba(0,0,0,0.35)] select-none">
      <div className="max-w-[1500px] w-[92%] sm:w-[88%] lg:w-[84%] mx-auto flex flex-col row-gap-[50px] gap-12 sm:gap-14">
        {/* =========================================================
            NEWSLETTER ROW (Content | Input | 3D Social Icons)
            ========================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 sm:gap-8 items-center border-b border-[#292828] pb-10 sm:pb-12">
          {/* CONTENT (Cols 1-2 on desktop) */}
          <div className="lg:col-span-2">
            <h3
              className="text-white !text-white text-xl sm:text-2xl font-black capitalize tracking-tight"
              style={{ color: "#ffffff" }}
            >
              Subscribe Newsletter
            </h3>
            <p className="text-xs sm:text-sm text-[#BBB9B5] mt-1.5 leading-relaxed">
              Subscribe newsletter to get 5% on all products.
            </p>
          </div>

          {/* INPUT SECTION (Cols 3-5 on desktop) */}
          <form
            onSubmit={handleSubscribe}
            className="md:col-span-2 lg:col-span-3 flex items-center gap-2 w-full"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter Your Email"
              required
              className="w-full bg-white text-[#111111] placeholder:text-[#777777] text-xs sm:text-sm px-4 py-3.5 border border-white outline-none focus:border-[#E53E3E] transition-colors"
            />
            <button
              type="submit"
              className="bg-[#E53E3E] hover:bg-[#C53030] active:scale-95 text-white text-xs sm:text-sm font-semibold capitalize px-5 sm:px-7 py-3.5 transition-all cursor-pointer shrink-0 border border-[#E53E3E]"
            >
              Subscribe
            </button>
          </form>

          {/* SOCIAL ICONS WITH 3D FLIP ANIMATION (Col 6 on desktop) */}
          <div className="lg:col-span-1 flex items-center gap-5 md:justify-end">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="social-icon-flip text-[#BBB9B5] text-xl"
            >
              <RiFacebookFill />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="social-icon-flip text-[#BBB9B5] text-xl"
            >
              <RiInstagramLine />
            </a>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
              className="social-icon-flip text-[#BBB9B5] text-xl"
            >
              <RiYoutubeFill />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitter X"
              className="social-icon-flip text-[#BBB9B5] text-xl"
            >
              <RiTwitterXFill />
            </a>
          </div>
        </div>

        {/* =========================================================
            FOOTER MENU (Logo | Shop Men | Shop Women | Shop Kids | Quick Links)
            ========================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 sm:gap-10">
          {/* COLUMN 1: BRAND LOGO */}
          <div className="flex flex-col gap-3">
            <Link href="/" className="inline-block" aria-label="NK-SHOES Home">
              <span
                className="text-[32px] sm:text-[36px] font-black italic tracking-[-1.5px] uppercase text-white leading-none"
                style={{ fontFamily: '"Barlow Condensed", sans-serif' }}
              >
                NK<span className="font-bold text-[#E53E3E] ml-[2px]">SHOES</span>
              </span>
            </Link>
            <p className="text-xs text-[#8E8E8E] leading-relaxed max-w-[220px]">
              Engineered for speed, durability, and daily street tempo. High-performance footwear.
            </p>
          </div>

          {/* COLUMN 2: RUNNING & ROAD */}
          <div className="flex flex-col gap-2.5">
            <h4
              className="text-white !text-white text-base sm:text-[17px] font-bold capitalize mb-1.5 tracking-wide"
              style={{ color: "#ffffff" }}
            >
              Running & Road
            </h4>
            <ul className="flex flex-col gap-2">
              <li>
                <Link
                  href="/products?category=running"
                  className="capitalize text-[15px] text-[#BBB9B5] hover:text-[#E53E3E] hover:underline hover:scale-[1.04] transition-all duration-200 inline-block"
                >
                  High-Mileage Runners
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=running"
                  className="capitalize text-[15px] text-[#BBB9B5] hover:text-[#E53E3E] hover:underline hover:scale-[1.04] transition-all duration-200 inline-block"
                >
                  Road Tempo Shoes
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=running"
                  className="capitalize text-[15px] text-[#BBB9B5] hover:text-[#E53E3E] hover:underline hover:scale-[1.04] transition-all duration-200 inline-block"
                >
                  Cushioned Soles
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=running"
                  className="capitalize text-[15px] text-[#BBB9B5] hover:text-[#E53E3E] hover:underline hover:scale-[1.04] transition-all duration-200 inline-block"
                >
                  Daily Trainers
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=running&filter=sale"
                  className="capitalize text-[15px] text-[#BBB9B5] hover:text-[#E53E3E] hover:underline hover:scale-[1.04] transition-all duration-200 inline-block font-semibold"
                >
                  Running Sale Drops
                </Link>
              </li>
            </ul>
          </div>

          {/* COLUMN 3: SNEAKERS & STREETWEAR */}
          <div className="flex flex-col gap-2.5">
            <h4
              className="text-white !text-white text-base sm:text-[17px] font-bold capitalize mb-1.5 tracking-wide"
              style={{ color: "#ffffff" }}
            >
              Sneakers & Street
            </h4>
            <ul className="flex flex-col gap-2">
              <li>
                <Link
                  href="/products?category=sneakers"
                  className="capitalize text-[15px] text-[#BBB9B5] hover:text-[#E53E3E] hover:underline hover:scale-[1.04] transition-all duration-200 inline-block"
                >
                  Classic Retro Kicks
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=sneakers"
                  className="capitalize text-[15px] text-[#BBB9B5] hover:text-[#E53E3E] hover:underline hover:scale-[1.04] transition-all duration-200 inline-block"
                >
                  Low & High Tops
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=sneakers"
                  className="capitalize text-[15px] text-[#BBB9B5] hover:text-[#E53E3E] hover:underline hover:scale-[1.04] transition-all duration-200 inline-block"
                >
                  Casual Streetwear
                </Link>
              </li>
              <li>
                <Link
                  href="/products?filter=new-arrivals"
                  className="capitalize text-[15px] text-[#BBB9B5] hover:text-[#E53E3E] hover:underline hover:scale-[1.04] transition-all duration-200 inline-block"
                >
                  Latest Sneaker Drops
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=sneakers&filter=sale"
                  className="capitalize text-[15px] text-[#BBB9B5] hover:text-[#E53E3E] hover:underline hover:scale-[1.04] transition-all duration-200 inline-block font-semibold"
                >
                  Sneakers on Sale
                </Link>
              </li>
            </ul>
          </div>

          {/* COLUMN 4: SPORTS & PERFORMANCE */}
          <div className="flex flex-col gap-2.5">
            <h4
              className="text-white !text-white text-base sm:text-[17px] font-bold capitalize mb-1.5 tracking-wide"
              style={{ color: "#ffffff" }}
            >
              Sports & Training
            </h4>
            <ul className="flex flex-col gap-2">
              <li>
                <Link
                  href="/products?category=sports"
                  className="capitalize text-[15px] text-[#BBB9B5] hover:text-[#E53E3E] hover:underline hover:scale-[1.04] transition-all duration-200 inline-block"
                >
                  Gym & Cross Training
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=sports"
                  className="capitalize text-[15px] text-[#BBB9B5] hover:text-[#E53E3E] hover:underline hover:scale-[1.04] transition-all duration-200 inline-block"
                >
                  Court & Turf Shoes
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=sports"
                  className="capitalize text-[15px] text-[#BBB9B5] hover:text-[#E53E3E] hover:underline hover:scale-[1.04] transition-all duration-200 inline-block"
                >
                  Athletic Performance
                </Link>
              </li>
              <li>
                <Link
                  href="/products"
                  className="capitalize text-[15px] text-[#BBB9B5] hover:text-[#E53E3E] hover:underline hover:scale-[1.04] transition-all duration-200 inline-block"
                >
                  All Men&apos;s Footwear
                </Link>
              </li>
              <li>
                <Link
                  href="/products?filter=sale"
                  className="capitalize text-[15px] text-[#BBB9B5] hover:text-[#E53E3E] hover:underline hover:scale-[1.04] transition-all duration-200 inline-block font-semibold"
                >
                  Featured Sale Drops
                </Link>
              </li>
            </ul>
          </div>

          {/* COLUMN 5: QUICK LINKS */}
          <div className="flex flex-col gap-2.5">
            <h4
              className="text-white !text-white text-base sm:text-[17px] font-bold capitalize mb-1.5 tracking-wide"
              style={{ color: "#ffffff" }}
            >
              Quick Links
            </h4>
            <ul className="flex flex-col gap-2">
              <li>
                <Link
                  href="/profile?tab=orders"
                  className="capitalize text-[15px] text-[#BBB9B5] hover:text-[#E53E3E] hover:underline hover:scale-[1.04] transition-all duration-200 inline-block"
                >
                  Track Your Order
                </Link>
              </li>
              <li>
                <Link
                  href="/pages/help"
                  className="capitalize text-[15px] text-[#BBB9B5] hover:text-[#E53E3E] hover:underline hover:scale-[1.04] transition-all duration-200 inline-block"
                >
                  Support Center
                </Link>
              </li>
              <li>
                <Link
                  href="/pages/shipping"
                  className="capitalize text-[15px] text-[#BBB9B5] hover:text-[#E53E3E] hover:underline hover:scale-[1.04] transition-all duration-200 inline-block"
                >
                  Shipping & Delivery
                </Link>
              </li>
              <li>
                <Link
                  href="/pages/returns"
                  className="capitalize text-[15px] text-[#BBB9B5] hover:text-[#E53E3E] hover:underline hover:scale-[1.04] transition-all duration-200 inline-block"
                >
                  Returns & Exchanges
                </Link>
              </li>
              <li>
                <Link
                  href="/pages/about"
                  className="capitalize text-[15px] text-[#BBB9B5] hover:text-[#E53E3E] hover:underline hover:scale-[1.04] transition-all duration-200 inline-block"
                >
                  About Brand
                </Link>
              </li>
              <li>
                <Link
                  href="/pages/contact"
                  className="capitalize text-[15px] text-[#BBB9B5] hover:text-[#E53E3E] hover:underline hover:scale-[1.04] transition-all duration-200 inline-block"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* =========================================================
            COPYRIGHT SECTION (Divider | Copyright | SyntaxMart link)
            ========================================================= */}
        <div className="border-t border-[#292828] pt-8 text-center text-xs sm:text-sm text-[#BBB9B5]">
          <p>
            Copyright &copy; 2026 All Rights Reserved | This template is made with care by{" "}
            <span>
              <a
                href="https://syntaxmart.com"
                target="_blank"
                rel="noopener noreferrer"
                className="capitalize text-[#E53E3E] underline font-semibold hover:text-[#FF4A4A] transition-colors"
              >
                SyntaxMart
              </a>
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
