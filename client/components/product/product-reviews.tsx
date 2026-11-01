"use client";

import React, { useState } from "react";
import { RiStarFill, RiCheckLine, RiThumbUpLine } from "react-icons/ri";

interface ProductReviewsProps {
  rating: number;
  reviewCount: number;
  productName: string;
}

const SAMPLE_REVIEWS = [
  {
    id: "r1",
    author: "Rahul S.",
    date: "12 Oct 2026",
    rating: 5,
    title: "Best daily comfort sneaker I've owned",
    content:
      "The cushioning on these is unbelievable. Wore them for a full 8-hour shift and my feet felt completely fresh. True to size, get your exact UK size.",
    verified: true,
    helpfulCount: 24,
  },
  {
    id: "r2",
    author: "Pooja M.",
    date: "28 Sep 2026",
    rating: 5,
    title: "Looks even better in person!",
    content:
      "Material quality is premium and lightweight. Delivery was super fast across Mumbai. Goes well with jeans, cargos, and gym wear.",
    verified: true,
    helpfulCount: 18,
  },
  {
    id: "r3",
    author: "Arjun K.",
    date: "14 Sep 2026",
    rating: 4,
    title: "Very comfortable, great grip",
    content:
      "Great ankle support and solid rubber outsole. Sole has plenty of traction for wet tarmac and gym training.",
    verified: true,
    helpfulCount: 9,
  },
];

export function ProductReviews({
  rating,
  reviewCount,
  productName,
}: ProductReviewsProps) {
  const [helpfulVotes, setHelpfulVotes] = useState<{ [key: string]: boolean }>({});

  const toggleHelpful = (id: string) => {
    setHelpfulVotes((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <section className="py-12 border-t border-[#F0F0F0] font-sans">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-10">
        {/* LEFT: RATINGS SUMMARY & BREAKDOWN */}
        <div className="w-full md:w-80 shrink-0">
          <h3 className="text-xl font-extrabold text-[#111111] uppercase tracking-tight">
            Ratings & Reviews
          </h3>

          <div className="flex items-baseline gap-3 mt-4">
            <span className="text-4xl font-extrabold text-[#111111]">{rating}</span>
            <div className="flex flex-col">
              <div className="flex items-center text-[#FA8C16] text-xs">
                {[...Array(5)].map((_, i) => (
                  <RiStarFill
                    key={i}
                    className={i < Math.floor(rating) ? "text-[#FA8C16]" : "text-[#E8E8E8]"}
                  />
                ))}
              </div>
              <span className="text-xs text-[#707072] mt-0.5">
                Based on {reviewCount} verified reviews
              </span>
            </div>
          </div>

          {/* RATING BREAKDOWN BARS */}
          <div className="flex flex-col gap-1.5 mt-5 text-xs text-[#707072]">
            <div className="flex items-center gap-2">
              <span className="w-12">5 Star</span>
              <div className="flex-1 h-2 bg-[#F0F0F0] overflow-hidden rounded-xs">
                <div className="h-full bg-[#111111] w-[82%]" />
              </div>
              <span className="w-8 text-right font-medium">82%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-12">4 Star</span>
              <div className="flex-1 h-2 bg-[#F0F0F0] overflow-hidden rounded-xs">
                <div className="h-full bg-[#111111] w-[12%]" />
              </div>
              <span className="w-8 text-right font-medium">12%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-12">3 Star</span>
              <div className="flex-1 h-2 bg-[#F0F0F0] overflow-hidden rounded-xs">
                <div className="h-full bg-[#111111] w-[4%]" />
              </div>
              <span className="w-8 text-right font-medium">4%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-12">2 Star</span>
              <div className="flex-1 h-2 bg-[#F0F0F0] overflow-hidden rounded-xs">
                <div className="h-full bg-[#111111] w-[1%]" />
              </div>
              <span className="w-8 text-right font-medium">1%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-12">1 Star</span>
              <div className="flex-1 h-2 bg-[#F0F0F0] overflow-hidden rounded-xs">
                <div className="h-full bg-[#111111] w-[1%]" />
              </div>
              <span className="w-8 text-right font-medium">1%</span>
            </div>
          </div>

          {/* FIT ATTRIBUTE SUMMARY */}
          <div className="mt-6 pt-5 border-t border-[#F0F0F0] text-xs">
            <span className="font-bold text-[#111111] block mb-1">Customer Feedback on Fit:</span>
            <div className="flex items-center gap-1.5 text-[#2E7D32] font-semibold">
              <RiCheckLine className="text-base" />
              <span>94% of buyers say it runs True to Size</span>
            </div>
          </div>
        </div>

        {/* RIGHT: CUSTOMER REVIEW LIST */}
        <div className="flex-1 flex flex-col gap-6">
          {SAMPLE_REVIEWS.map((review) => (
            <div
              key={review.id}
              className="pb-6 border-b border-[#F0F0F0] last:border-b-0"
            >
              {/* Stars & Date */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center text-[#FA8C16]">
                  {[...Array(5)].map((_, i) => (
                    <RiStarFill
                      key={i}
                      className={i < review.rating ? "text-[#FA8C16]" : "text-[#E8E8E8]"}
                    />
                  ))}
                </div>
                <span className="text-[#999999]">{review.date}</span>
              </div>

              {/* Title & Author */}
              <h4 className="text-sm font-bold text-[#111111] mt-2">
                {review.title}
              </h4>

              <div className="flex items-center gap-2 text-[11px] text-[#707072] mt-0.5">
                <span>{review.author}</span>
                {review.verified && (
                  <span className="inline-flex items-center gap-0.5 text-[#2E7D32] font-semibold">
                    <RiCheckLine className="text-xs" /> Verified Buyer
                  </span>
                )}
              </div>

              {/* Content */}
              <p className="text-xs text-[#555555] leading-relaxed mt-2.5">
                {review.content}
              </p>

              {/* Helpful Button */}
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => toggleHelpful(review.id)}
                  className="inline-flex items-center gap-1.5 text-[11px] text-[#707072] hover:text-[#111] transition-colors cursor-pointer"
                >
                  <RiThumbUpLine />
                  <span>
                    Helpful ({review.helpfulCount + (helpfulVotes[review.id] ? 1 : 0)})
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
